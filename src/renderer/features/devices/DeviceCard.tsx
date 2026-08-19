import type { FleetDevice, DeviceDetail } from "../../../shared/devices.types";
import { useState } from "react";
import { AssignPicker } from "./AssignPicker";
import { UnassignPicker } from "./UnassignPicker";

interface Props {
  fleet: FleetDevice;
  detail?: DeviceDetail;
}

const STATE_LABEL: Record<string, string> = {
  device: "Connected",
  unauthorized: "Unauthorized",
  offline: "Offline",
  recovery: "Recovery",
};

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function DeviceCard({ fleet, detail }: Props) {
  const { serial, record, live, client } = fleet;
  const [mode, setMode] = useState<"idle" | "assign" | "unassign">("idle");

  const title = client
    ? `${client.initials}${client.room ? ` · ${client.room}` : ""}`
    : "Unassigned";

  // Not adopted
  if (!record) {
    return (
      <article className="card" data-status="new">
        <header className="card-head">
          <div>
            <h3 className="card-title">Not in fleet</h3>
            <p className="card-serial">{serial}</p>
          </div>
          <span className="pill">{live?.model ?? "Unknown"}</span>
        </header>
        <p className="card-hint">This device isn't registered yet.</p>
        <button
          className="card-action"
          onClick={() => window.api.devices.adopt(serial, live?.model ?? null)}
        >
          Add device
        </button>
      </article>
    );
  }

  // Adopted but absent
  if (!live) {
    return (
      <article className="card" data-status="absent">
        <header className="card-head">
          <div>
            <h3 className="card-title">{title}</h3>
            <p className="card-serial">{serial}</p>
          </div>
          <span className="pill">Not plugged in</span>
        </header>
        <p className="card-hint">Last seen {relativeTime(record.lastSeenAt)}</p>
      </article>
    );
  }

  // Adopted and connected
  const lockdown = detail?.lockdown;
  const status =
    live.connection === "device"
      ? lockdown?.kioskEnabled
        ? "ok"
        : "warn"
      : "error";

  return (
    <article className="card" data-status={status}>
      <header className="card-head">
        <div>
          <h3 className="card-title">{title}</h3>
          <p className="card-serial">{serial}</p>
        </div>
        <span className="pill">
          {STATE_LABEL[live.connection] ?? live.connection}
        </span>
      </header>

      {live.connection === "unauthorized" && (
        <p className="card-hint">
          Accept the USB debugging prompt on the device.
        </p>
      )}

      {detail && (
        <>
          <dl className="vitals">
            <div>
              <dt>Battery</dt>
              <dd>
                {detail.battery?.level ?? "—"}%
                {detail.battery?.charging ? " ⚡" : ""}
              </dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{detail.policy.deviceOwnerActive ? "Set" : "None"}</dd>
            </div>
            <div>
              <dt>Kiosk</dt>
              <dd>{lockdown?.kioskEnabled ? "Locked" : "Unlocked"}</dd>
            </div>
          </dl>

          {mode === "assign" && (
            <AssignPicker serial={serial} onDone={() => setMode("idle")} />
          )}
          {mode === "unassign" && (
            <UnassignPicker serial={serial} onDone={() => setMode("idle")} />
          )}
          {mode === "idle" && (
            <div className="card-footer">
              {client ? (
                <button
                  className="btn ghost"
                  onClick={() => setMode("unassign")}
                >
                  Unassign
                </button>
              ) : (
                <button className="btn ghost" onClick={() => setMode("assign")}>
                  Assign client
                </button>
              )}
            </div>
          )}

          {lockdown &&
            !lockdown.kioskEnabled &&
            lockdown.missing.length > 0 && (
              <p className="card-hint">
                Missing: {lockdown.missing.join(", ")}
              </p>
            )}
        </>
      )}
    </article>
  );
}
