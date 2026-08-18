import { randomUUID } from "node:crypto";
import { getDb } from "../../db";
import type { ClientRecord, ClientInput } from "../../../shared/clients.types";

interface ClientRow {
  id: string;
  initials: string;
  room: string | null;
  active: number;
  intake_at: string | null;
  created_at: string;
}

function toRecord(row: ClientRow): ClientRecord {
  return {
    id: row.id,
    initials: row.initials,
    room: row.room,
    active: row.active === 1,
    intakeAt: row.intake_at,
    createdAt: row.created_at,
  };
}

export const clientRepo = {
  async list(includeInactive = false): Promise<ClientRecord[]> {
    const sql = includeInactive
      ? "SELECT * FROM clients ORDER BY initials"
      : "SELECT * FROM clients WHERE active = 1 ORDER BY initials";
    return (getDb().prepare(sql).all() as ClientRow[]).map(toRecord);
  },

  async findById(id: string): Promise<ClientRecord | null> {
    const row = getDb()
      .prepare("SELECT * FROM clients WHERE id = ?")
      .get(id) as ClientRow | undefined;
    return row ? toRecord(row) : null;
  },

  async findByInitials(initials: string): Promise<ClientRecord[]> {
    const rows = getDb()
      .prepare("SELECT * FROM clients WHERE initials = ? AND active = 1")
      .all(initials) as ClientRow[];
    return rows.map(toRecord);
  },

  async create(input: ClientInput): Promise<ClientRecord> {
    const id = randomUUID();
    getDb()
      .prepare(
        `INSERT INTO clients (id, initials, room, active, intake_at, created_at)
                VALUES (?, ?, ?, 1, ?, ?)`,
      )
      .run(
        id,
        input.initials,
        input.room,
        input.intakeAt,
        new Date().toISOString(),
      );
    return (await this.findById(id))!;
  },

  async update(id: string, input: ClientInput): Promise<ClientRecord> {
    getDb()
      .prepare(
        "UPDATE clients SET initials = ?, room = ?, intake_at = ? WHERE id = ?",
      )
      .run(input.initials, input.room, input.intakeAt, id);
    return (await this.findById(id))!;
  },

  async deactivate(id: string): Promise<void> {
    getDb().prepare("UPDATE clients SET active = 0 WHERE id = ?").run(id);
  },
};
