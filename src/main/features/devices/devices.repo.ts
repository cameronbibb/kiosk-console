import { getDb } from "@main/db";
import type { DeviceRecord, DeviceStatus } from "@shared/devices.types";

interface DeviceRow {
  serial: string;
  label: string | null;
  model: string | null;
  status: string;
  provisioned_at: string | null;
  last_seen_at: string | null;
}

function toRecord(row: DeviceRow): DeviceRecord {
  return {
    serial: row.serial,
    label: row.label,
    model: row.model,
    status: row.status as DeviceStatus,
    provisionedAt: row.provisioned_at,
    lastSeenAt: row.last_seen_at,
  };
}

export const deviceRepo = {
  async list(): Promise<DeviceRecord[]> {
    const rows = getDb()
      .prepare("SELECT * FROM devices ORDER BY serial")
      .all() as DeviceRow[];
    return rows.map(toRecord);
  },

  async findBySerial(serial: string): Promise<DeviceRecord | null> {
    const row = getDb()
      .prepare("SELECT * FROM devices WHERE serial = ?")
      .get(serial) as DeviceRow | undefined;
    return row ? toRecord(row) : null;
  },

  async adopt(serial: string, model: string | null): Promise<DeviceRecord> {
    const now = new Date().toISOString();
    getDb()
      .prepare(
        `INSERT INTO devices (serial, model, status, provisioned_at, last_seen_at)
                VALUES (?, ?, 'active', ?, ?)`,
      )
      .run(serial, model, now, now);
    return (await this.findBySerial(serial))!;
  },

  async touchLastSeen(serials: string[]): Promise<void> {
    if (serials.length === 0) return;
    const db = getDb();
    const stmt = db.prepare(
      "UPDATE devices SET last_seen_at = ? WHERE serial = ?",
    );
    const now = new Date().toISOString();
    db.transaction(() => {
      for (const serial of serials) stmt.run(now, serial);
    })();
  },
};
