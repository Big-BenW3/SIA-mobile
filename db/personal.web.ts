import { uid } from "./uid";
import type { Difficulty, Grade, SemesterEntry } from "@/types";
import type { Goal } from "@/stores/goalsStore";

// ─── Personal backend: web (in-memory) ──────────────────────────────
// expo-sqlite has no working web build, so the web app runs the same
// personal API against memory Maps. Same function names + shapes as
// personal.native.ts — stores never know which backend is active.
// Data does NOT persist across reloads on web; native is unaffected.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const tables = {
  tasks: new Map<string, Row>(),
  semesters: new Map<string, Row>(),
  gradeRows: new Map<string, Row>(),
  goals: new Map<string, Row>(),
  meta: new Map<string, string | null>(),
};

function byCreated(a: Row, b: Row): number {
  return (a.createdAt ?? 0) - (b.createdAt ?? 0);
}

// ── tasks ──
export function listTasks() {
  return [...tables.tasks.values()].sort(byCreated).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    difficulty: r.difficulty as Difficulty,
    scheduledDate: (r.scheduledDate ?? null) as string | null,
    status: (r.status === "done" ? "done" : "pending") as "pending" | "done",
    serverId: (r.serverId ?? null) as string | null,
  }));
}

export function insertTask(input: {
  title: string;
  difficulty: Difficulty;
  scheduledDate: string | null;
}): string {
  const id = uid("t");
  tables.tasks.set(id, {
    id,
    ...input,
    status: "pending",
    serverId: null,
    createdAt: Date.now(),
  });
  return id;
}

export function setTaskServerId(id: string, serverId: string): void {
  const row = tables.tasks.get(id);
  if (row) row.serverId = serverId;
}

export function updateTaskDb(
  id: string,
  patch: {
    title?: string;
    difficulty?: Difficulty;
    scheduledDate?: string | null;
    status?: "pending" | "done";
  },
): void {
  const row = tables.tasks.get(id);
  if (row) Object.assign(row, patch);
}

export function deleteTaskDb(id: string): void {
  tables.tasks.delete(id);
}

// ── semesters + grades ──
export function listSemesters(): SemesterEntry[] {
  return [...tables.semesters.values()].sort(byCreated).map((s) => ({
    id: s.id as string,
    label: s.label as string,
    gpa: s.gpa as number,
    courses: [...tables.gradeRows.values()]
      .filter((r) => r.semesterId === s.id)
      .map((r) => ({
        code: r.code as string,
        title: r.title as string,
        creditUnit: r.units as number,
        grade: r.grade as Grade,
      })),
  }));
}

export function insertSemester(
  label: string,
  gpa: number,
  courses: { code: string; title: string; creditUnit: number; grade: Grade }[],
): string {
  const id = uid("s");
  tables.semesters.set(id, { id, label, gpa, createdAt: Date.now() });
  for (const c of courses) {
    const gid = uid("g");
    tables.gradeRows.set(gid, {
      id: gid,
      semesterId: id,
      code: c.code,
      title: c.title,
      units: c.creditUnit,
      grade: c.grade,
    });
  }
  return id;
}

export function deleteSemesterDb(id: string): void {
  for (const [gid, r] of tables.gradeRows) {
    if (r.semesterId === id) tables.gradeRows.delete(gid);
  }
  tables.semesters.delete(id);
}

// ── goals ──
export function listGoals(): Goal[] {
  return [...tables.goals.values()].sort(byCreated).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    detail: r.detail as string,
    pct: r.pct as number,
  }));
}

export function insertGoal(title: string, detail: string): string {
  const id = uid("goal");
  tables.goals.set(id, { id, title, detail, pct: 0, createdAt: Date.now() });
  return id;
}

export function deleteGoalDb(id: string): void {
  tables.goals.delete(id);
}

// ── meta (auth tokens) ──
export function metaGet(key: string): string | null {
  return tables.meta.get(key) ?? null;
}

export function metaSet(key: string, value: string | null): void {
  if (value === null) tables.meta.delete(key);
  else tables.meta.set(key, value);
}
