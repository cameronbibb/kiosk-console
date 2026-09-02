import { sendKioskCommand, KioskResult, getDeviceInfo } from "./adb.service";
import type { TaskKind } from "@shared/tasks.types";

export interface TaskStep {
  label: string;
  run: (serial: string) => Promise<void>;
}

export interface TaskDefinition {
  kind: TaskKind;
  label: string;
  steps: TaskStep[];
}

async function command(serial: string, action: string) {
  const result = await sendKioskCommand(serial, action);
  if (result.code === KioskResult.OK) return;

  if (result.code === KioskResult.UNAUTHORIZED)
    throw new Error("Rejected: bad token");
  if (result.code === KioskResult.UNKNOWN_ACTION)
    throw new Error(
      `Device does not support "${action}" — DPO app may be outdated`,
    );
  if (result.code === 0)
    throw new Error("No response from kiosk app — DPO app may be outdated");
  throw new Error(result.data ?? `Command failed (code ${result.code})`);
}

export const TASK_DEFINITIONS: Record<TaskKind, TaskDefinition> = {
  lock: {
    kind: "lock",
    label: "Lock",
    steps: [
      { label: "Sending lock command", run: (s) => command(s, "enableKiosk") },
      {
        label: "Verifying restrictions",
        run: async (s) => {
          const info = await getDeviceInfo(s);
          if (!info.lockdown.kioskEnabled) {
            throw new Error(
              `Lock incomplete — missing: ${info.lockdown.missing.join(", ")}`,
            );
          }
        },
      },
    ],
  },
  unlock: {
    kind: "unlock",
    label: "Unlock",
    steps: [
      {
        label: "Sending unlock command",
        run: (s) => command(s, "disableKiosk"),
      },
      {
        label: "Verifying",
        run: async (s) => {
          const info = await getDeviceInfo(s);
          if (info.policy.userRestrictions.includes("no_config_wifi")) {
            throw new Error("Unlock incomplete — restrictions still applied");
          }
        },
      },
    ],
  },
};
