import Database from "better-sqlite3";
import { app } from "electron";
import path from "node:path";
import { migrate } from "./migrate";
import { isDemo, seedDemo } from "@main/demo/demo";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  // Demo mode uses a separate file so real data is never read or changed.
  const name = isDemo ? "kiosk-console-demo.db" : "kiosk-console.db";
  const file = path.join(app.getPath("userData"), name);
  db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  migrate(db);
  if (isDemo) seedDemo(db);

  console.log("[db]", file);
  return db;
}
