import type { LiveDevice, DeviceDetail } from "./devices.types";

export type Unsubscribe = () => void;

export interface DeviceApi {
  list(): Promise<LiveDevice[]>;
  detail(serials: string[]): Promise<Record<string, DeviceDetail>>;
  onChanged(cb: (devices: LiveDevice[]) => void): Unsubscribe;
  adopt(serial: string, model: string | null): Promise<void>;
}

export interface KioskApi {
  devices: DeviceApi;
}

declare global {
  interface Window {
    api: KioskApi;
  }
}
