import { listDevices } from "./adb.service";
import { deviceRepo } from "./devices.repo";
import type { FleetDevice } from "../../../shared/devices.types";

export async function getFleet(): Promise<FleetDevice[]> {
  const [live, known] = await Promise.all([listDevices(), deviceRepo.list()]);

  const liveBySerial = new Map(live.map((d) => [d.serial, d]));
  const knownBySerial = new Map(known.map((d) => [d.serial, d]));

  const serials = new Set([...liveBySerial.keys(), ...knownBySerial.keys()]);

  return [...serials].map((serial) => ({
    serial,
    record: knownBySerial.get(serial) ?? null,
    live: liveBySerial.get(serial) ?? null,
  }));
}
