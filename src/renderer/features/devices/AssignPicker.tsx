import { useEffect, useState } from "react";
import type { ClientRecord } from "../../../shared/clients.types";

interface Props {
  serial: string;
  onDone: () => void;
}

export function AssignPicker({ serial, onDone }: Props) {
  const [clients, setClients] = useState<ClientRecord[]>([]);

  useEffect(() => {
    window.api.clients.list().then(setClients);
  }, []);

  return (
    <div className="picker">
      <select
        autoFocus
        defaultValue=""
        onChange={async (e) => {
          if (!e.target.value) return;
          await window.api.devices.assign(serial, e.target.value);
          onDone();
        }}
      >
        <option value="" disabled>
          Choose client…
        </option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.initials}
            {c.room ? ` · ${c.room}` : ""}
          </option>
        ))}
      </select>
      <button className="btn ghost" onClick={onDone}>
        Cancel
      </button>
    </div>
  );
}
