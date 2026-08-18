import type { LiveDevice, DeviceDetail } from "./devices.types";
import type { ClientRecord, ClientInput } from "./clients.types";

export type Unsubscribe = () => void;

export interface DeviceApi {
  list(): Promise<LiveDevice[]>;
  detail(serials: string[]): Promise<Record<string, DeviceDetail>>;
  onChanged(cb: (devices: LiveDevice[]) => void): Unsubscribe;
  adopt(serial: string, model: string | null): Promise<void>;
}

export interface ClientApi {
  list(includeInactive?: boolean): Promise<ClientRecord[]>;
  findByInitials(initials: string): Promise<ClientRecord[]>;
  create(input: ClientInput): Promise<ClientRecord>;
  update(id: string, input: ClientInput): Promise<ClientRecord>;
  deactivate(id: string): Promise<void>;
}

export interface KioskApi {
  devices: DeviceApi;
  clients: ClientApi;
}

declare global {
  interface Window {
    api: KioskApi;
  }
}
