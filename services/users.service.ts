import { api } from "./api";

// ─── Users service (real API) ─────────────────────────────────────────
// Self-service profile + preferences + push token registration.

export interface MeDto {
  id: string;
  fullName: string;
  email: string;
  globalRole: string;
  level: string | null;
  roleInLevel: string | null;
}

export const usersApi = {
  me(): Promise<MeDto> {
    return api.get<MeDto>("/api/users/me");
  },
  updateMe(patch: {
    fullName?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<MeDto> {
    return api.patch<MeDto>("/api/users/me", patch);
  },
  prefs(): Promise<{ postAlerts: boolean; reminders: boolean }> {
    return api.get("/api/users/me/notification-preferences");
  },
  updatePrefs(patch: {
    postAlerts?: boolean;
    reminders?: boolean;
  }): Promise<{ postAlerts: boolean; reminders: boolean }> {
    return api.patch("/api/users/me/notification-preferences", patch);
  },
};
