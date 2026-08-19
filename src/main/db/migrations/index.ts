import initial from "./001_initial.sql?raw";
import assignment_notes from "./002_assignment_notes.sql?raw";

export const MIGRATIONS: Array<{ version: string; sql: string }> = [
  { version: "001_initial", sql: initial },
  { version: "002_assignment_notes", sql: assignment_notes },
];
