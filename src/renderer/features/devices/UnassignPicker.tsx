import { useState } from "react";
import type { EndReason } from "@shared/clients.types";

const REASONS: { value: EndReason; label: string; hint?: string }[] = [
  { value: "returned", label: "Returned to inventory" },
  {
    value: "released",
    label: "Client keeps device",
    hint: "Wipe and factory reset before handover.",
  },
  { value: "broken", label: "Device is broken" },
  {
    value: "lost",
    label: "Lost or unaccounted for",
    hint: "Sign out of Spotify everywhere and change the account password.",
  },
];

interface Props {
  serial: string;
  onDone: () => void;
}

export function UnassignPicker({ serial, onDone }: Props) {
  const [reason, setReason] = useState<EndReason>("returned");
  const [notes, setNotes] = useState("");
  const hint = REASONS.find((r) => r.value === reason)?.hint;

  return (
    <div className="picker">
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value as EndReason)}
      >
        {REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <input
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {hint && <p className="picker-hint">{hint}</p>}
      <button
        className="btn"
        onClick={async () => {
          await window.api.devices.unassign(
            serial,
            reason,
            notes.trim() || null,
          );
          onDone();
        }}
      >
        Confirm
      </button>
      <button className="btn ghost" onClick={onDone}>
        Cancel
      </button>
    </div>
  );
}
