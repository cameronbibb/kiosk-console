import type { LiveDevice, DeviceDetail } from "../../../shared/devices.types";

interface Props {
  device: LiveDevice;
  detail?: DeviceDetail;
}

const STATE_LABEL: Record<string, string> = {
  device: "Connected",
  unauthorized: "Unauthorized",
  offline: "Offline",
  recovery: "Recovery",
};

export function DeviceCard({ device, detail }: Props) {
  const lockdown = detail?.lockdown;
  const battery = detail?.battery;

  const status =
    device.connection === "device"
      ? lockdown?.kioskEnabled
        ? "ok"
        : "warn"
      : "error";

  return (
    <article className="card" data-status={status}>
      <header className="card-head">
        <div>
          <h3 className="card-title">Unassigned</h3>
          <p className="card-serial">{device.serial}</p>
        </div>
        <span className="pill">
          {STATE_LABEL[device.connection] ?? device.connection}
        </span>
      </header>

      {device.connection === "unauthorized" && (
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
                {battery?.level ?? "—"}%{battery?.charging ? " ⚡" : ""}
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
