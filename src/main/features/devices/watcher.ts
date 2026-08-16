import type { BrowserWindow } from "electron";
import type { LiveDevice } from "src/shared/devices.types";
import { listDevices } from "./adb.service";
import { deviceRepo } from "./devices.repo";
import { getFleet } from "./devices.services";

const POLL_INTERVAL_MS = 2000;

let timer: NodeJS.Timeout | null = null;
let lastSnapshot = "";
let currentWin: BrowserWindow | null = null;

function fingerprint(devices: LiveDevice[]): string {
  return devices
    .map((d) => `${d.serial}:${d.connection}`)
    .sort()
    .join("|");
}

export async function pushFleet(win: BrowserWindow) {
  const fleet = await getFleet();
  if (!win.isDestroyed()) {
    win.webContents.send("devices:changed", fleet);
  }
}

export async function refreshFleet() {
  if (currentWin && !currentWin.isDestroyed()) {
    await pushFleet(currentWin);
  }
}

export function startWatcher(win: BrowserWindow) {
  stopWatcher();
  currentWin = win;

  const tick = async () => {
    try {
      const live = await listDevices();
      await deviceRepo.touchLastSeen(live.map((d) => d.serial));

      const snapshot = fingerprint(live);
      if (snapshot !== lastSnapshot) {
        lastSnapshot = snapshot;
        await pushFleet(win);
      }
    } catch (err) {
      console.error("[watcher] poll failed:", err);
    } finally {
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    }
  };

  tick();
}

export function stopWatcher() {
  if (timer) clearTimeout(timer);
  timer = null;
  lastSnapshot = "";
  currentWin = null;
}
