import { listDevices } from "./adb.service";
import { deviceRepo } from "./devices.repo";
import { assignmentRepo } from "./assignments.repo";
import { clientRepo } from "../clients/clients.repo";
import type { FleetDevice } from "../../../shared/devices.types";

export async function getFleet(): Promise<FleetDevice[]> {
  const [live, known, openAssignments, clients] = await Promise.all([
    listDevices(),
    deviceRepo.list(),
    assignmentRepo.openForAll(),
    clientRepo.list(true),
  ]);

  const liveBySerial = new Map(live.map((d) => [d.serial, d]));
  const knownBySerial = new Map(known.map((d) => [d.serial, d]));
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const clientBySerial = new Map(
    openAssignments.map((a) => [
      a.deviceSerial,
      clientById.get(a.clientId) ?? null,
    ]),
  );

  const serials = new Set([...liveBySerial.keys(), ...knownBySerial.keys()]);

  return [...serials].map((serial) => ({
    serial,
    record: knownBySerial.get(serial) ?? null,
    live: liveBySerial.get(serial) ?? null,
    client: clientBySerial.get(serial) ?? null,
  }));
}
