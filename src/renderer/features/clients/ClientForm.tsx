import { useState } from "react";

interface Props {
  onSaved: () => void;
  onCancel: () => void;
}

export function ClientForm({ onSaved, onCancel }: Props) {
  const [initials, setInitials] = useState("");
  const [room, setRoom] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = initials.trim().toUpperCase();
    if (!trimmed) return;

    if (!warning) {
      const existing = await window.api.clients.findByInitials(trimmed);
      if (existing.length > 0) {
        const rooms = existing.map((c) => c.room ?? "no room").join(", ");
        setWarning(`${trimmed} already exists (${rooms}). Save anyway?`);
        return;
      }
    }

    setSaving(true);
    await window.api.clients.create({
      initials: trimmed,
      room: room.trim() || null,
      intakeAt: new Date().toISOString(),
    });
    onSaved();
  }

  return (
    <form className="client-form" onSubmit={submit}>
      <input
        autoFocus
        placeholder="Initials"
        value={initials}
        onChange={(e) => {
          setInitials(e.target.value);
          setWarning(null);
        }}
        maxLength={5}
      />
      <input
        placeholder="Room"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      />
      <button className="btn" type="submit" disabled={saving}>
        {warning ? "Save anyway" : "Save"}
      </button>
      <button className="btn ghost" type="button" onClick={onCancel}>
        Cancel
      </button>
      {warning && <p className="form-warning">{warning}</p>}
    </form>
  );
}
