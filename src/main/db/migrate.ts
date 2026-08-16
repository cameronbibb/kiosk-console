import type Database from "better-sqlite3";
import { MIGRATIONS } from "./migrations";

export function migrate(db: Database.Database) {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);

  const applied = new Set(
    db
      .prepare("SELECT version FROM schema_migrations")
      .all()
      .map((r: any) => r.version),
  );

  for (const { version, sql } of MIGRATIONS) {
    if (applied.has(version)) continue;

    db.transaction(() => {
      db.exec(sql);
      db.prepare(
        "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
      ).run(version, new Date().toISOString());
    })();

    console.log("[db] applied", version);
  }
}
