import { useEffect, useState } from "react";
import { DeviceDetail, FleetDevice, LiveDevice } from "./shared/devices.types";
import { DeviceCard } from "./renderer/features/devices/DeviceCard";
import "./renderer/features/devices/devices.css";

export default function App() {
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

  return (
    <div className="app">
      <h1>Kiosk Console</h1>
      <div className="grid">
        {fleet.map((f) => (
          <DeviceCard key={f.serial} fleet={f} detail={details[f.serial]} />
        ))}
      </div>
    </div>
  );
}
