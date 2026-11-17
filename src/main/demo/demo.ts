// Demo mode: fake devices and made-up client data for screenshots and demos.
// Enabled with KIOSK_DEMO=1 (see `npm run start:demo`). Uses its own database
// file and never touches adb, so no real client or device data can appear.

import { app } from "electron";
import type Database from "better-sqlite3";
import { parseDevicePolicy } from "@main/features/devices/parsers";
import { checkLockdown } from "@main/features/devices/lockdown";
import type { LiveDevice, DeviceDetail } from "@shared/devices.types";
import lockedPolicy from "@main/features/devices/__fixtures__/policy-locked.txt?raw";
import unlockedPolicy from "@main/features/devices/__fixtures__/policy-unlocked.txt?raw";
import unprovisionedPolicy from "@main/features/devices/__fixtures__/policy-unprovisioned.txt?raw";

// Development only: a packaged (installed) app ignores KIOSK_DEMO, so it
// always shows real devices and the real database.
const demoRequested = process.env.KIOSK_DEMO === "1";
export const isDemo = demoRequested && !app.isPackaged;

if (demoRequested && app.isPackaged) {
  console.warn("[demo] KIOSK_DEMO ignored: demo mode is development-only");
}

// How long each fake kiosk command takes, so progress bars are easy to
// screenshot. Override with KIOSK_DEMO_DELAY_MS.
const COMMAND_DELAY_MS = Number(process.env.KIOSK_DEMO_DELAY_MS) || 4000;

type PolicyState = "locked" | "unlocked" | "unprovisioned";

interface DemoDevice {
  live: LiveDevice;
  policy: PolicyState;
  battery: number;
  charging: boolean;
}

const MODEL = "Demo_Player";

// Devices that appear "plugged in". DEMO-0004 is adopted but absent, so it
// is only in the database, not here.
const demoDevices: DemoDevice[] = [
  device("DEMO-0001", "locked", 86, false),
  device("DEMO-0002", "locked", 42, true),
  device("DEMO-0003", "unlocked", 100, false),
  device("DEMO-0005", "unprovisioned", 64, true), // not adopted yet
  {
    live: { serial: "DEMO-0006", connection: "unauthorized" },
    policy: "unprovisioned",
    battery: 0,
    charging: false,
  },
];

function device(
  serial: string,
  policy: PolicyState,
  battery: number,
  charging: boolean,
): DemoDevice {
  return {
    live: { serial, connection: "device", model: MODEL, usbPath: "demo" },
    policy,
    battery,
    charging,
  };
}

const POLICY_TEXT: Record<PolicyState, string> = {
  locked: lockedPolicy,
  unlocked: unlockedPolicy,
  unprovisioned: unprovisionedPolicy,
};

function find(serial: string): DemoDevice {
  const d = demoDevices.find((x) => x.live.serial === serial);
  if (!d) throw new Error(`Unknown demo device ${serial}`);
  return d;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const demoAdb = {
  async listDevices(): Promise<LiveDevice[]> {
    return demoDevices.map((d) => d.live);
  },

  async getDeviceInfo(serial: string): Promise<DeviceDetail> {
    const d = find(serial);
    const policy = parseDevicePolicy(POLICY_TEXT[d.policy]);
    return {
      serial,
      battery: { level: d.battery, charging: d.charging, temperatureC: 28 },
      policy,
      lockdown: checkLockdown(policy),
    };
  },

  // Mimics the kiosk app's broadcast reply. Result code 1 = OK.
  async sendKioskCommand(serial: string, action: string) {
    const d = find(serial);
    await delay(COMMAND_DELAY_MS);
    if (d.policy === "unprovisioned") {
      return { code: 0, data: null, raw: "demo: no kiosk app" };
    }
    if (action === "enableKiosk") d.policy = "locked";
    else if (action === "disableKiosk") d.policy = "unlocked";
    else if (action === "queryState") {
      const data = JSON.stringify({
        deviceOwner: true,
        kioskEnabled: d.policy === "locked",
        appVersion: "demo",
      });
      return { code: 1, data, raw: "demo" };
    } else return { code: 4, data: null, raw: "demo: unknown action" };
    return { code: 1, data: null, raw: "demo" };
  },
};

// Made-up clients. Initials and rooms are placeholders, not real people.
const CLIENTS = [
  { id: "demo-client-1", initials: "AB", room: "101" },
  { id: "demo-client-2", initials: "CD", room: "104" },
  { id: "demo-client-3", initials: "EF", room: "112" },
  { id: "demo-client-4", initials: "GH", room: "118" },
  { id: "demo-client-5", initials: "JK", room: null },
];

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

// Fills an empty demo database. Does nothing if data already exists.
export function seedDemo(db: Database.Database) {
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM clients").get() as {
    n: number;
  };
  if (n > 0) return;

  const staff = "demo-staff";

  db.transaction(() => {
    const client = db.prepare(
      `INSERT INTO clients (id, initials, room, active, intake_at, created_at)
       VALUES (?, ?, ?, 1, ?, ?)`,
    );
    CLIENTS.forEach((c, i) =>
      client.run(c.id, c.initials, c.room, daysAgo(30 - i * 5), daysAgo(30 - i * 5)),
    );

    const dev = db.prepare(
      `INSERT INTO devices (serial, label, model, status, provisioned_at, last_seen_at)
       VALUES (?, NULL, ?, ?, ?, ?)`,
    );
    dev.run("DEMO-0001", MODEL, "active", daysAgo(40), daysAgo(0));
    dev.run("DEMO-0002", MODEL, "active", daysAgo(40), daysAgo(0));
    dev.run("DEMO-0003", MODEL, "spare", daysAgo(40), daysAgo(0));
    dev.run("DEMO-0004", MODEL, "active", daysAgo(40), daysAgo(3));

    const assign = db.prepare(
      `INSERT INTO device_assignments
         (id, client_id, device_serial, assigned_at, returned_at, end_reason, notes, performed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    // Open assignments
    assign.run("demo-a1", "demo-client-1", "DEMO-0001", daysAgo(28), null, null, null, staff);
    assign.run("demo-a2", "demo-client-2", "DEMO-0002", daysAgo(20), null, null, null, staff);
    assign.run("demo-a3", "demo-client-3", "DEMO-0004", daysAgo(12), null, null, null, staff);
    // Past assignment, so DEMO-0003 has history
    assign.run(
      "demo-a4", "demo-client-4", "DEMO-0003", daysAgo(25), daysAgo(6),
      "returned", "Returned in good condition", staff,
    );
  })();

  console.log("[demo] seeded demo database");
}
