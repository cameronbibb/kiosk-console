// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { KioskApi } from "./shared/api";
import type { LiveDevice } from "./shared/devices.types";

const api: KioskApi = {
  devices: {
    list: () => ipcRenderer.invoke("devices:list"),
    detail: (serials: string[]) =>
      ipcRenderer.invoke("devices:detail", serials),
    onChanged: (cb) => {
      const handler = (_e: IpcRendererEvent, devices: LiveDevice[]) =>
        cb(devices);
      ipcRenderer.on("devices:changed", handler);
      return () => ipcRenderer.removeListener("devices:changed", handler);
    },
    adopt: (serial: string, model: string | null) =>
      ipcRenderer.invoke("devices:adopt", serial, model),
  },
  clients: {
    list: (includeInactive) =>
      ipcRenderer.invoke("clients:list", includeInactive),
    findByInitials: (initials) =>
      ipcRenderer.invoke("clients:findByInitials", initials),
    create: (input) => ipcRenderer.invoke("clients:create", input),
    update: (id, input) => ipcRenderer.invoke("clients:update", id, input),
    deactivate: (id) => ipcRenderer.invoke("clients:deactivate", id),
  },
};

contextBridge.exposeInMainWorld("api", api);
