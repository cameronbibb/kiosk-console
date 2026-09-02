export type TaskKind = "lock" | "unlock";
export type TaskStatus =
  "queued" | "running" | "success" | "failed" | "cancelled";

export interface TaskProgress {
  id: string;
  serial: string;
  kind: TaskKind;
  status: TaskStatus;
  stepIndex: number; // 0-based, which step is active
  stepCount: number;
  stepLabel: string;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}
