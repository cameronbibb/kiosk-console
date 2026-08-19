import { useState } from "react";
import { DevicesPage } from "./features/devices/DevicesPage";
import { ClientsPage } from "./features/clients/ClientsPage";
import "./features/devices/devices.css";
import "./app.css";

const SECTIONS = [
  { id: "devices", label: "Devices" },
  { id: "clients", label: "Clients" },
] as const;

type Section = (typeof SECTIONS)[number]["id"];

export default function App() {
  const [section, setSection] = useState<Section>("devices");

  return (
    <div className="shell">
      <nav className="sidebar">
        <div className="brand">Kiosk Console</div>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={section === s.id ? "nav-item active" : "nav-item"}
            onClick={() => setSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>
      <main className="content">
        {section === "devices" && <DevicesPage />}
        {section === "clients" && <ClientsPage />}
      </main>
    </div>
  );
}
