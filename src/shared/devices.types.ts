import { checkLockdown } from "src/main/features/devices/lockdown";

export type ConnectionState =
  "device" | "unauthorized" | "offline" | "recovery";

export interface LiveDevice {
  serial: string;
  connection: ConnectionState;
  model?: string;
  usbPath?: string;
}

export interface BatteryInfo {
  level: number | null;
  charging: boolean;
  temperatureC: number | null;
}

export interface DevicePolicyInfo {
  deviceOwnerActive: boolean;
  ownerPackage: string | null;
  provisioningState: number | null;
  userRestrictions: string[];
  policies: string[];
}

export interface DeviceDetail {
  serial: string;
  battery: BatteryInfo;
  policy: DevicePolicyInfo;
  lockdown: ReturnType<typeof checkLockdown>;
}

export type DeviceStatus = "active" | "broken" | "spare" | "retired";

export interface DeviceRecord {
  serial: string;
  label: string | null;
  model: string | null;
  status: DeviceStatus;
  provisionedAt: string | null;
  lastSeenAt: string | null;
}

export interface FleetDevice {
  serial: string;
  record: DeviceRecord | null; // null = not adopted
  live: LiveDevice | null; // null = not plugged in
}
