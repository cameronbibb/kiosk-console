import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseDeviceLine, parseBattery, parseDevicePolicy } from "./parsers";
import { checkLockdown } from "./lockdown";
import type { LiveDevice, DeviceDetail } from "@shared/devices.types";

const execFileAsync = promisify(execFile);

// Dev only — we'll add the bundled-binary resolver later in Phase 0
const ADB = "adb";

export async function listDevices(): Promise<LiveDevice[]> {
  const { stdout } = await execFileAsync(ADB, ["devices", "-l"]);

  return stdout
    .split(/\r?\n/)
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

const DO_RECEIVER = "com.kumh.mp3kiosk/.KioskControlReceiver";

export const KioskResult = {
  OK: 1,
  ERROR: 2,
  UNAUTHORIZED: 3,
  UNKNOWN_ACTION: 4,
} as const;

export interface BroadcastResult {
  code: number | null;
  data: string | null;
  raw: string;
}

export async function sendKioskCommand(
  serial: string,
  action: string,
  extras: Record<string, string> = {},
): Promise<BroadcastResult> {
  const token = process.env.KIOSK_TOKEN;
  if (!token) throw new Error("KIOSK_TOKEN is not configured");

  const args = [
    "shell",
    "am",
    "broadcast",
    "-n",
    DO_RECEIVER,
    "--es",
    "action",
    action,
    "--es",
    "token",
    token,
  ];

  for (const [k, v] of Object.entries(extras)) {
    args.push("--es", k, v);
  }

  return parseBroadcastResult(await adb(serial, ...args));
}

export function parseBroadcastResult(stdout: string): BroadcastResult {
  const line =
    stdout.split(/\r?\n/).find((l) => l.includes("Broadcast completed")) ?? "";
  const code = line.match(/result=(-?\d+)/);
  const data = line.match(/data="(.*)"\s*$/);
  return {
    code: code ? Number(code[1]) : null,
    data: data ? data[1] : null,
    raw: stdout.trim(),
  };
}

export interface KioskState {
  deviceOwner: boolean;
  kioskEnabled: boolean;
  appVersion: string;
}

export async function queryKioskState(
  serial: string,
): Promise<KioskState | null> {
  const result = await sendKioskCommand(serial, "queryState");
  if (result.code !== KioskResult.OK || !result.data) return null;
  try {
    return JSON.parse(result.data) as KioskState;
  } catch {
    return null;
  }
}
