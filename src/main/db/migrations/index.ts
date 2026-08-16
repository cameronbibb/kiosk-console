import initial from "./001_initial.sql?raw";

export const MIGRATIONS: Array<{ version: string; sql: string }> = [
  { version: "001_initial", sql: initial },
];
