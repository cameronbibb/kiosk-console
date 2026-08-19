import { ipcMain } from "electron";
import { deviceRepo } from "./devices.repo";
import { getFleet } from "./devices.services";
import { refreshFleet } from "./watcher";
import { getDeviceInfoBatch } from "./adb.service";
import { assignmentRepo } from "./assignments.repo";
import { EndReason } from "src/shared/clients.types";

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
  ipcMain.handle(
    "devices:assign",
    async (_e, serial: string, clientId: string) => {
      await assignmentRepo.assign(clientId, serial);
      await refreshFleet();
    },
  );

  ipcMain.handle(
    "devices:unassign",
    async (_e, serial: string, reason: EndReason, notes: string | null) => {
      await assignmentRepo.close(serial, reason, notes);
      await refreshFleet();
    },
  );

  ipcMain.handle("devices:history", async (_e, serial: string) =>
    assignmentRepo.historyForDevice(serial),
  );
}
