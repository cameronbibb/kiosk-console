import { useEffect, useState } from "react";
import { DeviceDetail, LiveDevice } from "./shared/devices.types";
import { DeviceCard } from "./renderer/features/devices/DeviceCard";
import "./renderer/features/devices/devices.css";

export default function App() {
  const [devices, setDevices] = useState<LiveDevice[]>([]);
  const [details, setDetails] = useState<Record<string, DeviceDetail>>({});
  const serialKey = devices
    .map((d) => `${d.serial}:${d.connection}`)
    .sort()
    .join(",");

  useEffect(() => {
    const api = window.api.devices;
    api.list().then(setDevices);
    return api.onChanged(setDevices);
  }, []);

  useEffect(() => {
    if (devices.length === 0) return;
    window.api.devices.detail(devices.map((d) => d.serial)).then(setDetails);
  }, [serialKey]);

  return (
    <div className="app">
      <h1>Kiosk Console</h1>

      <div className="grid">
        {devices.map((d) => (
          <DeviceCard key={d.serial} device={d} detail={details[d.serial]} />
        ))}
      </div>
    </div>
  );
}
