import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// ─── Personal tables (native SQLite only) ───────────────────────────
// Tasks, grades and goals NEVER leave the phone (product decision).
// Shapes mirror db/personal.* so both platforms stay identical.

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  difficulty: text('difficulty').notNull(), // easy | medium | hard
  scheduledDate: text('scheduled_date'),
  status: text('status').notNull().default('pending'), // pending | done
  serverId: text('server_id'), // backend mirror row (for AI arrange)
  createdAt: integer('created_at').notNull(),
});

export const semesters = sqliteTable('semesters', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  gpa: real('gpa').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const gradeRows = sqliteTable('grade_rows', {
  id: text('id').primaryKey(),
  semesterId: text('semester_id').notNull(),
  code: text('code').notNull(),
  title: text('title').notNull(),
  units: integer('units').notNull(),
  grade: text('grade').notNull(), // A..F
});

export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  detail: text('detail').notNull().default(''),
  pct: integer('pct').notNull().default(0),
  createdAt: integer('created_at').notNull(),
});

// Tiny key/value for auth tokens (avoids another dependency).
export const meta = sqliteTable('meta', {
  key: text('key').primaryKey(),
  value: text('value'),
});
