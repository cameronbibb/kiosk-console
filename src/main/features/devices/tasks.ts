import { randomUUID } from "node:crypto";
import os from "node:os";
import { TASK_DEFINITIONS } from "./task-definitions";
import type { TaskKind, TaskProgress, TaskStatus } from "@shared/tasks.types";

const MAX_CONCURRENT = 4;

interface QueuedTask {
  id: string;
  serial: string;
  kind: TaskKind;
  status: TaskStatus;
  stepIndex: number;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
  cancelled: boolean;
}

type Listener = (progress: TaskProgress) => void;

const tasks = new Map<string, QueuedTask>();
const pending: string[] = [];
const busySerials = new Set<string>();
let running = 0;
let listener: Listener | null = null;

export function onTaskProgress(cb: Listener) {
  listener = cb;
}

function toProgress(task: QueuedTask): TaskProgress {
  const def = TASK_DEFINITIONS[task.kind];
  return {
    id: task.id,
    serial: task.serial,
    kind: task.kind,
    status: task.status,
    stepIndex: task.stepIndex,
    stepCount: def.steps.length,
    stepLabel: def.steps[task.stepIndex]?.label ?? "",
    error: task.error,
    startedAt: task.startedAt,
    finishedAt: task.finishedAt,
  };
}

function emit(task: QueuedTask) {
  listener?.(toProgress(task));
}

export function enqueue(serial: string, kind: TaskKind): string {
  const id = randomUUID();
  tasks.set(id, {
    id,
    serial,
    kind,
    status: "queued",
    stepIndex: 0,
    error: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    cancelled: false,
  });
  pending.push(id);
  emit(tasks.get(id)!);
  pump();
  return id;
}

export function cancel(id: string) {
  const task = tasks.get(id);
  if (!task || task.status === "success" || task.status === "failed") return;
  task.cancelled = true;
  if (task.status === "queued") {
    task.status = "cancelled";
    task.finishedAt = new Date().toISOString();
    const i = pending.indexOf(id);
    if (i >= 0) pending.splice(i, 1);
    emit(task);
  }
}

export function activeTasks(): TaskProgress[] {
  return [...tasks.values()]
    .filter((t) => t.status === "queued" || t.status === "running")
    .map(toProgress);
}

function pump() {
  while (running < MAX_CONCURRENT) {
    const index = pending.findIndex(
      (id) => !busySerials.has(tasks.get(id)!.serial),
    );
    if (index === -1) return;

    const [id] = pending.splice(index, 1);
    const task = tasks.get(id)!;
    busySerials.add(task.serial);
    running++;
    void execute(task);
  }
}

async function execute(task: QueuedTask) {
  const def = TASK_DEFINITIONS[task.kind];
  task.status = "running";
  task.startedAt = new Date().toISOString();
  emit(task);

  try {
    for (let i = 0; i < def.steps.length; i++) {
      if (task.cancelled) {
        task.status = "cancelled";
        break;
      }
      task.stepIndex = i;
      emit(task);
      await def.steps[i].run(task.serial);
    }
    if (task.status !== "cancelled") task.status = "success";
  } catch (err) {
    task.status = "failed";
    task.error = err instanceof Error ? err.message : String(err);
    console.error(`[task] ${task.kind} failed on ${task.serial}:`, err);
  } finally {
    task.finishedAt = new Date().toISOString();
    emit(task);
    busySerials.delete(task.serial);
    running--;
    pump();
  }
}

export function performedBy(): string {
  return os.userInfo().username;
}
