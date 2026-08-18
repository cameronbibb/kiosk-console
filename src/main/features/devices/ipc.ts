import { ipcMain } from "electron";
import { deviceRepo } from "./devices.repo";
import { getFleet } from "./devices.services";
import { refreshFleet } from "./watcher";
import { getDeviceInfoBatch } from "./adb.service";

export function registerDeviceIpc() {
  ipcMain.handle("devices:list", async () => getFleet());
  ipcMain.handle("devices:detail", async (_e, serials: string[]) => {
    return getDeviceInfoBatch(serials);
  });
  ipcMain.handle(
    "devices:adopt",
    async (_e, serial: string, model: string | null) => {
      await deviceRepo.adopt(serial, model);
      await refreshFleet();
    },
  );
}
