import { randomUUID } from "node:crypto";
import os from "node:os";
import { getDb } from "@main/db";
import type {
  AssignmentRecord,
  EndReason,
} from "@shared/clients.types";
import type { DeviceStatus } from "@shared/devices.types";

interface AssignmentRow {
  id: string;
  client_id: string;
  device_serial: string;
  assigned_at: string;
  returned_at: string | null;
  end_reason: string | null;
  notes: string | null;
  performed_by: string | null;
}

function toRecord(row: AssignmentRow): AssignmentRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    deviceSerial: row.device_serial,
    assignedAt: row.assigned_at,
    returnedAt: row.returned_at,
    endReason: row.end_reason as EndReason | null,
    notes: row.notes,
    performedBy: row.performed_by,
  };
}

const STATUS_FOR_REASON: Record<EndReason, DeviceStatus> = {
  released: "released",
  returned: "spare",
  broken: "broken",
  lost: "lost",
};

export const assignmentRepo = {
  async openForDevice(serial: string): Promise<AssignmentRecord | null> {
    const row = getDb()
      .prepare(
        "SELECT * FROM device_assignments WHERE device_serial = ? AND returned_at IS NULL",
      )
      .get(serial) as AssignmentRow | undefined;
    return row ? toRecord(row) : null;
  },

  async openForAll(): Promise<AssignmentRecord[]> {
    const rows = getDb()
      .prepare("SELECT * FROM device_assignments WHERE returned_at IS NULL")
      .all() as AssignmentRow[];
    return rows.map(toRecord);
  },

  async historyForDevice(serial: string): Promise<AssignmentRecord[]> {
    const rows = getDb()
      .prepare(
        "SELECT * FROM device_assignments WHERE device_serial = ? ORDER BY assigned_at DESC",
      )
      .all(serial) as AssignmentRow[];
    return rows.map(toRecord);
  },

  async assign(clientId: string, serial: string): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    const who = os.userInfo().username;

    db.transaction(() => {
      db.prepare(
        `UPDATE device_assignments
            SET returned_at = ?, end_reason = 'returned', performed_by = ?
          WHERE device_serial = ? AND returned_at IS NULL`,
      ).run(now, who, serial);

      db.prepare(
        `INSERT INTO device_assignments
           (id, client_id, device_serial, assigned_at, performed_by)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(randomUUID(), clientId, serial, now, who);

      db.prepare(`UPDATE devices SET status = 'active' WHERE serial = ?`).run(
        serial,
      );
    })();
  },

  async close(
    serial: string,
    reason: EndReason,
    notes: string | null,
  ): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    const who = os.userInfo().username;

    db.transaction(() => {
      db.prepare(
        `UPDATE device_assignments
            SET returned_at = ?, end_reason = ?, notes = ?, performed_by = ?
          WHERE device_serial = ? AND returned_at IS NULL`,
      ).run(now, reason, notes, who, serial);

      db.prepare("UPDATE devices SET status = ? WHERE serial = ?").run(
        STATUS_FOR_REASON[reason],
        serial,
      );
    })();
  },
};
