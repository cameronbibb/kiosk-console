import type { BrowserWindow } from "electron";
import { LiveDevice } from "src/shared/devices.types";
import { listDevices } from "./adb.service";

const POLL_INTERVAL_MS = 2000;

let timer: NodeJS.Timeout | null = null;
let lastSnapshot = "";

function fingerprint(devices: LiveDevice[]): string {
  return devices
    .map((d) => `${d.serial}:${d.connection}`)
    .sort()
    .join("|");
}

export function startWatcher(win: BrowserWindow) {
  stopWatcher();

  const tick = async () => {
    try {
      const devices = await listDevices();
      const snapshot = fingerprint(devices);

      if (snapshot !== lastSnapshot) {
        lastSnapshot = snapshot;
        if (!win.isDestroyed()) {
          win.webContents.send("devices:changed", devices);
        }
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
}
