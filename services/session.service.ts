import { API_BASE, api, getAccessToken } from "./api";
import type { AppNotification } from "@/types";

// ─── Session service (real API): levels, courses, semester, ─────────
// calendar, resources, itinerary arrange. Read-only app data that used
// to be mocks; now fetched once per login into sessionStore.

export interface LevelDto {
  id: string;
  name: string;
  createdAt: string;
}

export interface CourseDto {
  id: string;
  levelId: string;
  semester: string;
  courseCode: string;
  courseTitle: string;
  creditUnit: number;
  createdAt: string;
}

export interface ResourceDto {
  id: string;
  levelId: string;
  semester: string;
  courseId: string;
  title: string;
  fileUrl: string;
  fileType: string;
  /** Who uploaded it (user id). Drives who may delete it. */
  uploadedBy: string;
  createdAt: string;
}

// Mirrors the server's upload allowlist (backend/src/utils/upload.ts) so the
// app can refuse an unsupported file before wasting an upload. The server
// remains the authority.
export const UPLOAD_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "txt",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "zip",
] as const;
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export interface SemesterStateDto {
  currentSemester: string;
  currentSessionYear: string;
}

export interface WeekDto {
  weekNumber: number;
  totalWeeks: number;
  semester: string;
  sessionYear: string;
  note: string | null;
}

export interface CalendarEventDto {
  id: string;
  title: string;
  /** General announcement shown with the date, visible to everyone. */
  description: string | null;
  eventDate: string;
  levelId: string | null;
}

export const sessionApi = {
  me(): Promise<{
    id: string;
    level?: string | null;
    roleInLevel?: string | null;
    fullName: string;
    email: string;
  }> {
    return api.get("/api/users/me");
  },
  levels(): Promise<LevelDto[]> {
    return api.get<LevelDto[]>("/api/levels");
  },
  courses(levelId: string, semester: string): Promise<CourseDto[]> {
    return api.get<CourseDto[]>(
      `/api/courses?levelId=${encodeURIComponent(levelId)}&semester=${encodeURIComponent(semester)}`,
    );
  },
  resources(levelId: string, semester: string): Promise<ResourceDto[]> {
    return api.get<ResourceDto[]>(
      `/api/resources?levelId=${encodeURIComponent(levelId)}&semester=${encodeURIComponent(semester)}`,
    );
  },
  semester(): Promise<SemesterStateDto> {
    return api.get<SemesterStateDto>("/api/semester/current");
  },
  week(): Promise<WeekDto> {
    return api.get<WeekDto>("/api/calendar/current");
  },
  events(levelId: string): Promise<CalendarEventDto[]> {
    return api.get<CalendarEventDto[]>(
      `/api/calendar/events?levelId=${encodeURIComponent(levelId)}`,
    );
  },
  arrange(): Promise<{ id: string; difficulty: string; order: number }[]> {
    return api.post("/api/itinerary/arrange");
  },

  mirrorTask(input: {
    title: string;
    scheduledDate: string | null;
    difficulty: string;
  }): Promise<{ id: string }> {
    return api.post("/api/itinerary", {
      title: input.title,
      rawInputText: input.title,
      scheduledDate: input.scheduledDate,
      difficulty: input.difficulty,
    });
  },
  /** Remove the server mirror of a task (the mirror exists only for arrange). */
  deleteTask(serverId: string): Promise<unknown> {
    return api.del(`/api/itinerary/${serverId}`);
  },
  /** Keep the mirror in step with local edits so arrange never sees stale rows. */
  patchTask(
    serverId: string,
    patch: {
      status?: "pending" | "done";
      difficulty?: string;
      title?: string;
      scheduledDate?: string | null;
    },
  ): Promise<unknown> {
    return api.patch(`/api/itinerary/${serverId}`, patch);
  },
  notifications(): Promise<AppNotification[]> {
    return api.get<AppNotification[]>("/api/notifications");
  },
  markNotificationRead(id: string): Promise<unknown> {
    return api.patch(`/api/notifications/${id}/read`);
  },
  registerPushToken(expoPushToken: string): Promise<unknown> {
    return api.post("/api/users/me/device-token", { expoPushToken });
  },

  /** Multipart upload for CR/admin. Returns the created record. */
  async uploadResource(input: {
    levelId: string;
    semester: string;
    courseId: string;
    title: string;
    uri: string;
    name: string;
    mimeType: string;
  }): Promise<ResourceDto> {
    const form = new FormData();
    form.append("levelId", input.levelId);
    form.append("semester", input.semester);
    form.append("courseId", input.courseId);
    form.append("title", input.title);
    form.append("file", {
      uri: input.uri,
      name: input.name,
      type: input.mimeType,
    } as unknown as Blob);
    const send = () => {
      const token = getAccessToken();
      return fetch(`${API_BASE}/api/resources`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
    };
    let res = await send();
    if (res.status === 401) {
      // Multipart bypasses the JSON client's silent refresh, so trigger it
      // with a cheap authenticated call, then retry the upload once.
      try {
        await api.get("/api/users/me");
        res = await send();
      } catch {
        // fall through to the error handling below with the original 401
      }
    }
    if (!res.ok) {
      let message = `Upload failed (${res.status}).`;
      try {
        const data = (await res.json()) as { error?: { message?: string } };
        if (data.error?.message) message = data.error.message;
      } catch {
        // keep generic
      }
      const { ApiError } = await import("./api");
      throw new ApiError(res.status, message);
    }
    return (await res.json()) as ResourceDto;
  },

  deleteResource(id: string): Promise<{ ok: boolean }> {
    return api.del(`/api/resources/${id}`);
  },
};
