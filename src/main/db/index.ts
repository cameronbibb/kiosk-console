import Database from "better-sqlite3";
import { app } from "electron";
import path from "node:path";
import { migrate } from "./migrate";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const file = path.join(app.getPath("userData"), "kiosk-console.db");
  db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  migrate(db);

  console.log("[db]", file);
  return db;
}
