import { create } from "zustand";
import {
  deleteTaskDb,
  insertTask,
  listTasks,
  metaGet,
  metaSet,
  setTaskServerId,
  updateTaskDb,
} from "@/db/personal";
import { ApiError } from "@/services/api";
import { sessionApi } from "@/services/session.service";
import type { Difficulty, ItineraryItem } from "@/types";

// ─── Planner store (on-device personal DB) ──────────────────────────
// Local data is the source of truth; the backend holds a best-effort
// mirror used ONLY for AI arrangement (Groq key can't ship in the app).
// Mirror calls never block or fail the UI: network errors are swallowed
// and the local write always wins.
//
// The mirror is kept honest: deleting a task deletes its server row, and
// completing/editing a task patches it, so the arranger never ranks a task the
// user already removed or finished. Operations that fail (offline, server
// asleep) go into a persisted queue (`plannerPendingOps`) and are replayed on
// the next opportunity, so a delete is never silently lost.
//
// The arranged ORDER is kept as `order` (task id → rank) and persisted in the
// on-device meta table, so a smart arrange survives a restart without a schema
// change. Tasks with no rank (added since) sort after ranked ones.

const ORDER_KEY = "plannerOrder";
const OPS_KEY = "plannerPendingOps";

function loadOrder(): Record<string, number> {
  try {
    const raw = metaGet(ORDER_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (parsed && typeof parsed === "object") {
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === "number") out[k] = v;
      }
      return out;
    }
  } catch {
    // corrupt value: start unranked
  }
  return {};
}

function saveOrder(order: Record<string, number>) {
  try {
    metaSet(ORDER_KEY, JSON.stringify(order));
  } catch {
    // ordering is a nicety; never fail a task action over it
  }
}

/** Open tasks by rank (unranked keep insertion order, after ranked), then done. */
export function orderTasks(
  tasks: ItineraryItem[],
  order: Record<string, number>,
): ItineraryItem[] {
  const index = new Map(tasks.map((t, i) => [t.id, i]));
  const rank = (t: ItineraryItem) => order[t.id] ?? Number.MAX_SAFE_INTEGER;
  const open = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => rank(a) - rank(b) || index.get(a.id)! - index.get(b.id)!);
  const done = tasks.filter((t) => t.status === "done");
  return [...open, ...done];
}

function isoOrNull(label: string | null): string | null {
  if (!label) return null;
  const d = new Date(label);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// ─── Server sync queue ──────────────────────────────────────────────

interface TaskPatch {
  status?: "pending" | "done";
  difficulty?: Difficulty;
  title?: string;
  scheduledDate?: string | null;
}

export type PendingOp =
  | { op: "delete"; serverId: string }
  | { op: "patch"; serverId: string; patch: TaskPatch };

function loadOps(): PendingOp[] {
  try {
    const raw = metaGet(OPS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (o): o is PendingOp =>
        !!o &&
        typeof o === "object" &&
        typeof (o as PendingOp).serverId === "string" &&
        ((o as PendingOp).op === "delete" || (o as PendingOp).op === "patch"),
    );
  } catch {
    return [];
  }
}

function saveOps(ops: PendingOp[]) {
  try {
    metaSet(OPS_KEY, ops.length ? JSON.stringify(ops) : null);
  } catch {
    // the queue is best effort; losing it only means a stale mirror row
  }
}

/**
 * Adds an op to the queue, keeping it minimal: a delete supersedes every
 * earlier op for that task, and consecutive patches merge into one.
 */
export function enqueueOp(queue: PendingOp[], op: PendingOp): PendingOp[] {
  if (op.op === "delete") {
    return [...queue.filter((o) => o.serverId !== op.serverId), op];
  }
  if (queue.some((o) => o.op === "delete" && o.serverId === op.serverId)) {
    return queue; // already being deleted; a patch is moot
  }
  const existing = queue.find(
    (o) => o.op === "patch" && o.serverId === op.serverId,
  );
  if (existing && existing.op === "patch") {
    return queue.map((o) =>
      o === existing
        ? { ...existing, patch: { ...existing.patch, ...op.patch } }
        : o,
    );
  }
  return [...queue, op];
}

/** What to do with a failed op: done (gone already), dropped (never succeeds), or retry. */
export function classifyFailure(err: unknown): "done" | "drop" | "retry" {
  if (err instanceof ApiError) {
    if (err.status === 404) return "done"; // already deleted/never existed
    if (err.status === 400 || err.status === 403 || err.status === 422)
      return "drop";
  }
  return "retry"; // network error, 5xx, 401 (session), 429 …
}

async function execute(op: PendingOp): Promise<void> {
  if (op.op === "delete") {
    await sessionApi.deleteTask(op.serverId);
  } else {
    const { scheduledDate, ...rest } = op.patch;
    await sessionApi.patchTask(op.serverId, {
      ...rest,
      ...(scheduledDate !== undefined
        ? { scheduledDate: isoOrNull(scheduledDate) }
        : {}),
    });
  }
}

let flushing = false;
let kicked = false;

async function mirror(task: ItineraryItem): Promise<string | null> {
  try {
    const created = await sessionApi.mirrorTask({
      title: task.title,
      scheduledDate: isoOrNull(task.scheduledDate),
      difficulty: task.difficulty,
    });
    setTaskServerId(task.id, created.id);
    return created.id;
  } catch {
    return null;
  }
}

/** What a smart arrange actually did, for the UI to report truthfully. */
export interface ArrangeResult {
  /** Open tasks on this device at the time. */
  total: number;
  /** Tasks the arranger ranked. */
  ranked: number;
  /** Ranked tasks whose position changed. */
  moved: number;
  /** Ranked tasks whose difficulty changed. */
  reclassified: number;
  /** Open tasks it could not rank (not synced to the server). */
  skipped: number;
}

interface PlannerState {
  tasks: ItineraryItem[];
  /** task id → rank from the last smart arrange. */
  order: Record<string, number>;
  toggleDone: (id: string) => void;
  addTask: (input: {
    title: string;
    difficulty: Difficulty;
    scheduledDate: string | null;
  }) => string;
  updateTask: (
    id: string,
    patch: Partial<
      Pick<ItineraryItem, "title" | "difficulty" | "scheduledDate" | "status">
    >,
  ) => void;
  deleteTask: (id: string) => void;
  /** Replay queued server deletes/patches. Safe to call any time; never throws. */
  flushPendingOps: () => Promise<void>;
  /** Server arrangement applied onto local tasks. Throws offline. */
  arrangeViaServer: () => Promise<ArrangeResult>;
}

// Mirror creates still in flight, and tasks the user deleted while one was.
const mirroring = new Map<string, Promise<string | null>>();
const deletedWhileMirroring = new Set<string>();

export const usePlannerStore = create<PlannerState>((set, get) => {
  /** Send an op now; on a retryable failure park it in the persisted queue. */
  const sendOp = async (op: PendingOp): Promise<void> => {
    try {
      await execute(op);
    } catch (err) {
      if (classifyFailure(err) === "retry") {
        saveOps(enqueueOp(loadOps(), op));
      }
    }
  };

  /** Make sure the queue gets replayed at least once per app run. */
  const kick = () => {
    if (kicked) return;
    kicked = true;
    void get().flushPendingOps();
  };

  const syncPatch = (id: string, patch: TaskPatch) => {
    const serverId = get().tasks.find((t) => t.id === id)?.serverId;
    if (serverId) void sendOp({ op: "patch", serverId, patch });
    // No serverId: either never mirrored (nothing to keep in step) or the
    // mirror is in flight; its completion handler sends the current state.
  };

  /** Mirror a task and reconcile anything that changed while it was in flight. */
  const mirrorTracked = (task: ItineraryItem): Promise<string | null> => {
    const existing = mirroring.get(task.id);
    if (existing) return existing;
    const p = (async () => {
      const serverId = await mirror(task);
      mirroring.delete(task.id);
      if (!serverId) return null;
      if (deletedWhileMirroring.delete(task.id)) {
        // Deleted locally before the server row existed: remove it now.
        void sendOp({ op: "delete", serverId });
        return null;
      }
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === task.id ? { ...t, serverId } : t)),
      }));
      const current = get().tasks.find((t) => t.id === task.id);
      if (current) {
        const patch: TaskPatch = {};
        if (current.status === "done") patch.status = "done";
        if (current.difficulty !== task.difficulty)
          patch.difficulty = current.difficulty;
        if (current.title !== task.title) patch.title = current.title;
        if (current.scheduledDate !== task.scheduledDate) {
          patch.scheduledDate = current.scheduledDate;
        }
        if (Object.keys(patch).length > 0) {
          void sendOp({ op: "patch", serverId, patch });
        }
      }
      void get().flushPendingOps();
      return serverId;
    })();
    mirroring.set(task.id, p);
    return p;
  };

  return {
    tasks: listTasks(),
    order: loadOrder(),

    toggleDone: (id) => {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return;
      const status = task.status === "done" ? "pending" : "done";
      updateTaskDb(id, { status });
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
      }));
      kick();
      syncPatch(id, { status });
    },

    addTask: (input) => {
      const id = insertTask(input);
      set((s) => ({
        tasks: [
          ...s.tasks,
          { id, status: "pending", serverId: null, ...input },
        ],
      }));
      kick();
      // Best-effort mirror (never blocks the UI).
      const task = get().tasks.find((t) => t.id === id);
      if (task) void mirrorTracked(task);
      return id;
    },

    updateTask: (id, patch) => {
      updateTaskDb(id, patch);
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      }));
      kick();
      syncPatch(id, patch);
    },

    deleteTask: (id) => {
      const task = get().tasks.find((t) => t.id === id);
      deleteTaskDb(id);
      set((s) => {
        const { [id]: _removed, ...order } = s.order;
        void _removed;
        saveOrder(order);
        return { tasks: s.tasks.filter((t) => t.id !== id), order };
      });
      kick();
      // Removed "totally": the server row goes too (queued if offline).
      if (task?.serverId) {
        void sendOp({ op: "delete", serverId: task.serverId });
      } else if (mirroring.has(id)) {
        deletedWhileMirroring.add(id);
      }
    },

    flushPendingOps: async () => {
      if (flushing) return;
      flushing = true;
      try {
        let queue = loadOps();
        while (queue.length > 0) {
          const op = queue[0] as PendingOp;
          try {
            await execute(op);
          } catch (err) {
            if (classifyFailure(err) === "retry") break; // try again later
          }
          queue = queue.slice(1);
          saveOps(queue);
        }
      } finally {
        flushing = false;
      }
    },

    arrangeViaServer: async () => {
      // Deletes/completions must reach the server BEFORE it ranks anything.
      await get().flushPendingOps();

      const pending = get().tasks.filter((t) => t.status === "pending");
      if (pending.length === 0) {
        return { total: 0, ranked: 0, moved: 0, reclassified: 0, skipped: 0 };
      }
      const before = orderTasks(pending, get().order).map((t) => t.id);

      // Mirror anything missing a server row, then arrange server-side.
      for (const t of pending.filter((t) => !t.serverId)) {
        await mirrorTracked(t);
      }

      const arranged = await sessionApi.arrange();

      // Map results back by SERVER ID (never by position): the server may also
      // hold rows this device no longer has, which must not shift ranks.
      const byServerId = new Map(
        get()
          .tasks.filter((t) => t.serverId && t.status === "pending")
          .map((t) => [t.serverId as string, t]),
      );
      const valid = ["easy", "medium", "hard"] as const;
      const nextOrder: Record<string, number> = {};
      let rank = 0;
      let reclassified = 0;

      for (const a of byOrder(arranged)) {
        const local = byServerId.get(a.id);
        if (!local) continue;
        nextOrder[local.id] = ++rank;
        const difficulty = (valid as readonly string[]).includes(a.difficulty)
          ? (a.difficulty as Difficulty)
          : "medium";
        if (difficulty !== local.difficulty) {
          reclassified++;
          updateTaskDb(local.id, { difficulty });
          set((s) => ({
            tasks: s.tasks.map((x) =>
              x.id === local.id ? { ...x, difficulty } : x,
            ),
          }));
        }
      }

      saveOrder(nextOrder);
      set({ order: nextOrder });

      const after = orderTasks(
        get().tasks.filter((t) => t.status === "pending"),
        nextOrder,
      ).map((t) => t.id);
      const moved = after.filter((id, i) => before[i] !== id).length;

      return {
        total: pending.length,
        ranked: rank,
        moved,
        reclassified,
        skipped: pending.length - rank,
      };
    },
  };
});

function byOrder(
  arranged: { id: string; difficulty: string; order: number }[],
) {
  return [...arranged].sort((a, b) => a.order - b.order);
}
