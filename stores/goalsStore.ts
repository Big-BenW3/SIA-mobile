import { create } from 'zustand';
import { deleteGoalDb, insertGoal, listGoals } from '@/db/personal';

// ─── Goals store (on-device personal DB) ────────────────────────────
// Personal goals never leave the phone. Replaces the old in-component
// list so goals survive restarts.

export interface Goal {
  id: string;
  title: string;
  detail: string;
  pct: number;
}

interface GoalsState {
  goals: Goal[];
  addGoal: (title: string, detail: string) => void;
  removeGoal: (id: string) => void;
}

export const useGoalsStore = create<GoalsState>((set) => ({
  goals: listGoals(),

  addGoal: (title, detail) => {
    const id = insertGoal(title, detail || 'Just started');
    set((s) => ({ goals: [...s.goals, { id, title, detail: detail || 'Just started', pct: 0 }] }));
  },

  removeGoal: (id) => {
    deleteGoalDb(id);
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
  },
}));
