import { ipcMain } from "electron";
import { clientRepo } from "./clients.repo";
import type { ClientInput } from "../../../shared/clients.types";

export function registerClientIpc() {
  ipcMain.handle("clients:list", async (_e, includeInactive?: boolean) =>
    clientRepo.list(includeInactive ?? false),
  );

  ipcMain.handle("clients:findByInitials", async (_e, initials: string) =>
    clientRepo.findByInitials(initials),
  );

  ipcMain.handle("clients:create", async (_e, input: ClientInput) =>
    clientRepo.create(input),
  );

  ipcMain.handle("clients:update", async (_e, id: string, input: ClientInput) =>
    clientRepo.update(id, input),
  );

  ipcMain.handle("clients:deactivate", async (_e, id: string) =>
    clientRepo.deactivate(id),
  );
}
