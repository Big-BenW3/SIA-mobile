import * as SQLite from 'expo-sqlite';
import { asc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { goals, gradeRows, meta, semesters, tasks } from './schema';
import { uid } from './uid';
import type { Difficulty, Grade, SemesterEntry } from '@/types';
import type { Goal } from '@/stores/goalsStore';

// ─── Personal backend: native (SQLite via Drizzle) ──────────────────
// Synchronous throughout: stores keep sync signatures, the UI never
// awaits the database. Tables created idempotently at import.

const sqlite = SQLite.openDatabaseSync('sia.db');
const pdb = drizzle(sqlite);

sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, difficulty TEXT NOT NULL,
    scheduled_date TEXT, status TEXT NOT NULL DEFAULT 'pending',
    server_id TEXT, created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS semesters (
    id TEXT PRIMARY KEY, label TEXT NOT NULL, gpa REAL NOT NULL, created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS grade_rows (
    id TEXT PRIMARY KEY, semester_id TEXT NOT NULL, code TEXT NOT NULL,
    title TEXT NOT NULL, units INTEGER NOT NULL, grade TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '',
    pct INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
`);

// Forward-compatible column for installs created before mirroring.
try {
  sqlite.execSync(`ALTER TABLE tasks ADD COLUMN server_id TEXT;`);
} catch {
  // Already exists — nothing to do.
}

// ── tasks ──
export function listTasks() {
  return pdb
    .select()
    .from(tasks)
    .orderBy(asc(tasks.createdAt))
    .all()
    .map((r) => ({
      id: r.id,
      title: r.title,
      difficulty: r.difficulty as Difficulty,
      scheduledDate: r.scheduledDate,
      status: (r.status === 'done' ? 'done' : 'pending') as 'pending' | 'done',
      serverId: r.serverId,
    }));
}

export function insertTask(input: { title: string; difficulty: Difficulty; scheduledDate: string | null }) {
  const id = uid('t');
  pdb
    .insert(tasks)
    .values({ id, title: input.title, difficulty: input.difficulty, scheduledDate: input.scheduledDate, status: 'pending', serverId: null, createdAt: Date.now() })
    .run();
  return id;
}

export function setTaskServerId(id: string, serverId: string): void {
  pdb.update(tasks).set({ serverId }).where(eq(tasks.id, id)).run();
}

export function updateTaskDb(id: string, patch: { title?: string; difficulty?: Difficulty; scheduledDate?: string | null; status?: 'pending' | 'done' }): void {
  pdb.update(tasks).set(patch).where(eq(tasks.id, id)).run();
}

export function deleteTaskDb(id: string): void {
  pdb.delete(tasks).where(eq(tasks.id, id)).run();
}

// ── semesters + grades ──
export function listSemesters(): SemesterEntry[] {
  return pdb
    .select()
    .from(semesters)
    .orderBy(asc(semesters.createdAt))
    .all()
    .map((s) => ({
      id: s.id,
      label: s.label,
      gpa: s.gpa,
      courses: pdb
        .select()
        .from(gradeRows)
        .where(eq(gradeRows.semesterId, s.id))
        .all()
        .map((r) => ({ code: r.code, title: r.title, creditUnit: r.units, grade: r.grade as Grade })),
    }));
}

export function insertSemester(label: string, gpa: number, courses: { code: string; title: string; creditUnit: number; grade: Grade }[]): string {
  const id = uid('s');
  pdb.insert(semesters).values({ id, label, gpa, createdAt: Date.now() }).run();
  for (const c of courses) {
    pdb.insert(gradeRows).values({ id: uid('g'), semesterId: id, code: c.code, title: c.title, units: c.creditUnit, grade: c.grade }).run();
  }
  return id;
}

export function deleteSemesterDb(id: string): void {
  pdb.delete(gradeRows).where(eq(gradeRows.semesterId, id)).run();
  pdb.delete(semesters).where(eq(semesters.id, id)).run();
}

// ── goals ──
export function listGoals(): Goal[] {
  return pdb
    .select()
    .from(goals)
    .orderBy(asc(goals.createdAt))
    .all()
    .map((r) => ({ id: r.id, title: r.title, detail: r.detail, pct: r.pct }));
}

export function insertGoal(title: string, detail: string): string {
  const id = uid('goal');
  pdb.insert(goals).values({ id, title, detail, pct: 0, createdAt: Date.now() }).run();
  return id;
}

export function deleteGoalDb(id: string): void {
  pdb.delete(goals).where(eq(goals.id, id)).run();
}

// ── meta (auth tokens) ──
export function metaGet(key: string): string | null {
  const row = pdb.select().from(meta).where(eq(meta.key, key)).get();
  return row?.value ?? null;
}

export function metaSet(key: string, value: string | null): void {
  if (value === null) {
    pdb.delete(meta).where(eq(meta.key, key)).run();
    return;
  }
  pdb.insert(meta).values({ key, value }).onConflictDoUpdate({ target: meta.key, set: { value } }).run();
}
