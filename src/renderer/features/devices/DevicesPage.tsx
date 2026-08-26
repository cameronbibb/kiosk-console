import { useEffect, useState } from "react";
import type { FleetDevice, DeviceDetail } from "@shared/devices.types";
import { DeviceCard } from "./DeviceCard";

export function DevicesPage() {
  const [fleet, setFleet] = useState<FleetDevice[]>([]);
  const [details, setDetails] = useState<Record<string, DeviceDetail>>({});

  const connectedKey = fleet
    .filter((f) => f.live)
    .map((f) => `${f.serial}:${f.live!.connection}`)
    .sort()
    .join(",");

  useEffect(() => {
    const api = window.api.devices;
    api.list().then(setFleet);
    return api.onChanged(setFleet);
  }, []);

  useEffect(() => {
    const connected = fleet.filter((f) => f.live).map((f) => f.serial);
    if (connected.length === 0) return;
    window.api.devices.detail(connected).then(setDetails);
  }, [connectedKey]);

  const connectedCount = fleet.filter((f) => f.live).length;

  return (
    <>
      <header className="page-head">
        <h2>Devices</h2>
        <span className="page-sub">
          {connectedCount} connected · {fleet.length - connectedCount} absent
        </span>
      </header>
      <div className="grid">
        {fleet.map((f) => (
          <DeviceCard key={f.serial} fleet={f} detail={details[f.serial]} />
        ))}
      </div>
    </>
  );
}
