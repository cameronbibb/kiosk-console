CREATE TABLE clients (
  id          TEXT PRIMARY KEY,
  initials        TEXT NOT NULL,
  room        TEXT,
  active      INTEGER NOT NULL DEFAULT 1,
  intake_at   TEXT,
  created_at  TEXT NOT NULL
);

CREATE TABLE devices (
  serial          TEXT PRIMARY KEY,
  label           TEXT,
  model           TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  provisioned_at  TEXT,
  last_seen_at    TEXT
);

CREATE TABLE device_assignments (
  id             TEXT PRIMARY KEY,
  client_id      TEXT NOT NULL REFERENCES clients(id),
  device_serial  TEXT NOT NULL REFERENCES devices(serial),
  assigned_at    TEXT NOT NULL,
  returned_at    TEXT,
  end_reason     TEXT,
  performed_by   TEXT
);

CREATE UNIQUE INDEX idx_one_open_assignment
  ON device_assignments(device_serial)
  WHERE returned_at IS NULL;

CREATE TABLE device_tasks (
  id             TEXT PRIMARY KEY,
  device_serial  TEXT NOT NULL REFERENCES devices(serial),
  kind           TEXT NOT NULL,
  status         TEXT NOT NULL,
  started_at     TEXT NOT NULL,
  finished_at    TEXT,
  error          TEXT,
  performed_by   TEXT
);

CREATE INDEX idx_tasks_by_device ON device_tasks(device_serial, started_at);