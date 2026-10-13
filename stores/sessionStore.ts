import { create } from 'zustand';
import { sessionApi, type CalendarEventDto, type CourseDto, type ResourceDto, type SemesterStateDto, type WeekDto } from '@/services/session.service';
import { ApiError } from '@/services/api';

// ─── Session store (real backend, read-only app data) ───────────────
// Levels, courses, semester, calendar and resources load once per login
// (level-scoped from the member record). status/error drive the shared
// loading + retry shells. Questions stay a local bank until the admin
// dashboard ships uploads (backend bank + seed already exist).

interface SessionState {
  levelId: string | null;
  levelName: string | null;
  semester: string;
  sessionYear: string;
  week: WeekDto | null;
  events: CalendarEventDto[];
  courses: CourseDto[];
  resources: ResourceDto[];
  status: 'idle' | 'loading' | 'error';
  error: string;
  load: () => Promise<void>;
  /** Reload just the file list (after upload/delete) without full session. */
  refreshResources: () => Promise<void>;
  reset: () => void;
}

const initial = {
  levelId: null as string | null,
  levelName: null as string | null,
  semester: '',
  sessionYear: '',
  week: null as WeekDto | null,
  events: [] as CalendarEventDto[],
  courses: [] as CourseDto[],
  resources: [] as ResourceDto[],
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initial,
  status: 'idle',
  error: '',

  load: async () => {    set({ status: 'loading', error: '' });
    try {
      const me = await sessionApi.me();
      const levels = await sessionApi.levels();
      const level = levels.find((l) => l.name === (me.level ?? '')) ?? levels[0];
      if (!level) throw new ApiError(404, 'No levels are set up yet.');
      const sem = await sessionApi.semester();
      const [courses, resources, week, events] = await Promise.all([
        sessionApi.courses(level.id, sem.currentSemester),
        sessionApi.resources(level.id, sem.currentSemester),
        sessionApi.week().catch(() => null),
        sessionApi.events(level.id).catch(() => [] as CalendarEventDto[]),
      ]);
      set({
        levelId: level.id,
        levelName: level.name,
        semester: sem.currentSemester,
        sessionYear: sem.currentSessionYear,
        week,
        events,
        courses,
        resources,
        status: 'idle',
      });
    } catch (err) {
      set({ status: 'error', error: err instanceof ApiError ? err.message : 'Could not load your level. Check your connection.' });
    }
  },

  reset: () => set({ ...initial, status: 'idle', error: '' }),

  refreshResources: async () => {
    const { levelId, semester } = get();
    if (!levelId || !semester) return;
    try {
      const resources = await sessionApi.resources(levelId, semester);
      set({ resources });
    } catch {
      // List keeps stale data; the detail screens surface their own errors.
    }
  },
}));
