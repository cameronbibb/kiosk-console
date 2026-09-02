import { useEffect, useState } from "react";
import type { FleetDevice, DeviceDetail } from "@shared/devices.types";
import { DeviceCard } from "./DeviceCard";
import type { TaskProgress } from "@shared/tasks.types";

export function DevicesPage() {
  const [fleet, setFleet] = useState<FleetDevice[]>([]);
  const [details, setDetails] = useState<Record<string, DeviceDetail>>({});
  const [tasks, setTasks] = useState<Record<string, TaskProgress>>({});

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

  useEffect(() => {
    const api = window.api.devices;
    api.activeTasks().then((list) => {
      setTasks(Object.fromEntries(list.map((t) => [t.serial, t])));
    });
    return api.onTaskProgress((p) => {
      setTasks((prev) => ({ ...prev, [p.serial]: p }));
    });
  }, []);

  const connectedCount = fleet.filter((f) => f.live).length;

  const connected = fleet.filter(
    (f) => f.live?.connection === "device" && f.record,
  );

  async function runAll(kind: "lock" | "unlock") {
    for (const f of connected) {
      await window.api.devices.runTask(f.serial, kind);
    }
  }

  return (
    <>
      <header className="page-head">
        <h2>Devices</h2>
        <span className="page-sub">
          {connectedCount} connected · {fleet.length - connectedCount} absent
        </span>
        <div className="batch-actions">
          <button
            className="btn"
            onClick={() => runAll("lock")}
            disabled={connected.length === 0}
          >
            Lock all ({connected.length})
          </button>
          <button
            className="btn"
            onClick={() => runAll("unlock")}
            disabled={connected.length === 0}
          >
            Unlock all
          </button>
        </div>
      </header>
      <div className="grid">
        {fleet.map((f) => (
          <DeviceCard
            key={f.serial}
            fleet={f}
            detail={details[f.serial]}
            task={tasks[f.serial]}
          />
        ))}
      </div>
    </>
  );
}
