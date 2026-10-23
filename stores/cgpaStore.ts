import { create } from "zustand";
import { deleteSemesterDb, insertSemester, listSemesters } from "@/db/personal";
import type { Grade, SemesterEntry } from "@/types";

// ─── CGPA store (on-device personal DB) ─────────────────────────────
// Grades never leave the phone (product decision — no backend table).
// Same API as before; starts empty so the empty state is genuinely
// reachable on first run.

export const GRADE_POINTS: Record<Grade, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
};

export type CourseInput = {
  code: string;
  title: string;
  creditUnit: number;
  grade: Grade;
};

/** Credit-weighted GPA for one set of courses. */
export function gpaFor(courses: CourseInput[]): number {
  const units = courses.reduce((s, c) => s + c.creditUnit, 0);
  if (units === 0) return 0;
  const points = courses.reduce(
    (s, c) => s + GRADE_POINTS[c.grade] * c.creditUnit,
    0,
  );
  return Math.round((points / units) * 100) / 100;
}

interface CgpaState {
  semesters: SemesterEntry[];
  addSemester: (label: string, courses: CourseInput[]) => void;
  deleteSemester: (id: string) => void;
  /** Credit-weighted CGPA across all semesters. */
  cgpa: () => number;
}

export const useCgpaStore = create<CgpaState>((set, get) => ({
  semesters: listSemesters(),

  addSemester: (label, courses) => {
    const id = insertSemester(label, gpaFor(courses), courses);
    set((s) => ({
      semesters: [...s.semesters, { id, label, gpa: gpaFor(courses), courses }],
    }));
  },

  deleteSemester: (id) => {
    deleteSemesterDb(id);
    set((s) => ({ semesters: s.semesters.filter((x) => x.id !== id) }));
  },

  cgpa: () => {
    const all = get().semesters.flatMap((s) => s.courses);
    return gpaFor(all);
  },
}));
