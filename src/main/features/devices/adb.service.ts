import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseDeviceLine, parseBattery, parseDevicePolicy } from "./parsers";
import { checkLockdown } from "./lockdown";
import { LiveDevice, DeviceDetail } from "src/shared/devices.types";

const execFileAsync = promisify(execFile);

// Dev only — we'll add the bundled-binary resolver later in Phase 0
const ADB = "adb";

export async function listDevices(): Promise<LiveDevice[]> {
  const { stdout } = await execFileAsync(ADB, ["devices", "-l"]);

  return stdout
    .split("\n")
    .slice(1) // drop "List of devices attached"
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseDeviceLine)
    .filter((d): d is LiveDevice => d !== null);
}

async function adb(serial: string, ...args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(ADB, ["-s", serial, ...args]);
  return stdout;
}

export async function getDeviceInfo(serial: string): Promise<DeviceDetail> {
  const [batteryOut, policyOut] = await Promise.all([
    adb(serial, "shell", "dumpsys", "battery"),
    adb(serial, "shell", "dumpsys", "device_policy"),
  ]);

  const policy = parseDevicePolicy(policyOut);

  return {
    serial,
    battery: parseBattery(batteryOut),
    policy,
    lockdown: checkLockdown(policy),
  };
}

export async function getDeviceInfoBatch(
  serials: string[],
): Promise<Record<string, DeviceDetail>> {
  const results = await Promise.all(
    serials.map(
      async (serial) => [serial, await getDeviceInfo(serial)] as const,
    ),
  );
  return Object.fromEntries(results);
}
