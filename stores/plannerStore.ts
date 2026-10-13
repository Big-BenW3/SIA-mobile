import { create } from 'zustand';
import { deleteTaskDb, insertTask, listTasks, setTaskServerId, updateTaskDb } from '@/db/personal';
import { sessionApi } from '@/services/session.service';
import type { Difficulty, ItineraryItem } from '@/types';

// ─── Planner store (on-device personal DB) ──────────────────────────
// Local data is the source of truth; the backend holds a best-effort
// mirror used ONLY for AI arrangement (Groq key can't ship in the app).
// Mirror calls never block or fail the UI: network errors are swallowed
// and the local write always wins.

function isoOrNull(label: string | null): string | null {
  if (!label) return null;
  const d = new Date(label);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function mirror(task: ItineraryItem): Promise<string | null> {
  try {
    const created = await sessionApi.mirrorTask({ title: task.title, scheduledDate: isoOrNull(task.scheduledDate), difficulty: task.difficulty });
    setTaskServerId(task.id, created.id);
    return created.id;
  } catch {
    return null;
  }
}

interface PlannerState {
  tasks: ItineraryItem[];
  toggleDone: (id: string) => void;
  addTask: (input: { title: string; difficulty: Difficulty; scheduledDate: string | null }) => string;
  updateTask: (id: string, patch: Partial<Pick<ItineraryItem, 'title' | 'difficulty' | 'scheduledDate' | 'status'>>) => void;
  deleteTask: (id: string) => void;
  /** Server AI arrangement applied onto local tasks. Throws offline. */
  arrangeViaServer: () => Promise<void>;
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  tasks: listTasks(),

  toggleDone: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const status = task.status === 'done' ? 'pending' : 'done';
    updateTaskDb(id, { status });
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)) }));
  },

  addTask: (input) => {
    const id = insertTask(input);
    set((s) => ({ tasks: [...s.tasks, { id, status: 'pending', serverId: null, ...input }] }));
    // Best-effort mirror (never blocks the UI).
    const task = get().tasks.find((t) => t.id === id);
    if (task) {
      void mirror(task).then((serverId) => {
        if (serverId) set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, serverId } : t)) }));
      });
    }
    return id;
  },

  updateTask: (id, patch) => {
    updateTaskDb(id, patch);
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  },

  deleteTask: (id) => {
    deleteTaskDb(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  arrangeViaServer: async () => {
    // Mirror anything missing a server row, then arrange server-side.
    const pending = get().tasks.filter((t) => t.status === 'pending');
    for (const t of pending.filter((t) => !t.serverId)) {
      const serverId = await mirror(t);
      if (serverId) {
        const sid = serverId;
        set((s) => ({ tasks: s.tasks.map((x) => (x.id === t.id ? { ...x, serverId: sid } : x)) }));
      }
    }
    // Positions align: mirror rows were created in local order, and the
    // server returns 1-based order over the same set.
    const arranged = await sessionApi.arrange();
    const ordered = [...get().tasks.filter((t) => t.status === 'pending')];
    const valid = ['easy', 'medium', 'hard'] as const;
    byOrder(arranged).forEach((a, i) => {
      const local = ordered[i];
      if (!local) return;
      const difficulty = (valid as readonly string[]).includes(a.difficulty) ? (a.difficulty as Difficulty) : 'medium';
      updateTaskDb(local.id, { difficulty });
      set((s) => ({ tasks: s.tasks.map((x) => (x.id === local.id ? { ...x, difficulty } : x)) }));
    });
  },
}));

function byOrder(arranged: { id: string; difficulty: string; order: number }[]) {
  return [...arranged].sort((a, b) => a.order - b.order);
}
