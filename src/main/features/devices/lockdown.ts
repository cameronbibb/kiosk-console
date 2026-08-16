import { DevicePolicyInfo } from "src/shared/devices.types";

const REQUIRED_WHEN_LOCKED = [
  "no_config_wifi",
  "no_network_reset",
  "no_factory_reset",
  "no_safe_boot",
  "no_install_unknown_sources",
  "no_control_apps",
  "no_uninstall_apps",
] as const;

export function checkLockdown(info: DevicePolicyInfo) {
  const missing = REQUIRED_WHEN_LOCKED.filter(
    (r) => !info.userRestrictions.includes(r),
  );
  return {
    kioskEnabled: missing.length === 0,
    missing,
  };
}
