import { useEffect, useState } from "react";
import type { ClientRecord } from "../../../shared/clients.types";
import { ClientForm } from "./ClientForm";

export function ClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [adding, setAdding] = useState(false);

  const reload = () => window.api.clients.list().then(setClients);

  useEffect(() => {
    reload();
  }, []);

  return (
    <>
      <header className="page-head">
        <h2>Clients</h2>
        <span className="page-sub">{clients.length} active</span>
        <button className="btn" onClick={() => setAdding(true)}>
          Add client
        </button>
      </header>

      {adding && (
        <ClientForm
          onSaved={() => {
            setAdding(false);
            reload();
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {clients.length === 0 && !adding && (
        <p className="empty">
          No clients yet. Add one to start assigning devices.
        </p>
      )}

      <ul className="client-list">
        {clients.map((c) => (
          <li key={c.id} className="client-row">
            <span className="client-initials">{c.initials}</span>
            <span className="client-room">{c.room ?? "—"}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
