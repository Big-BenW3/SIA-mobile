import { api, clearTokens, saveTokens } from "./api";
import type { Role, RoleInLevel } from "@/types";

// ─── Auth service (real API) ────────────────────────────────────────
// Shapes mirror the backend auth module exactly. Pending CR responses
// carry pendingLevel instead of tokens (auto-approve ON means this
// branch stays dormant until the admin dashboard flips it to manual).

export interface SessionUser {
  fullName: string;
  email: string;
  role: Role;
  roleInLevel?: RoleInLevel;
  level: string | null;
}

interface AuthOk {
  user: {
    id: string;
    fullName: string;
    email: string;
    globalRole: "admin" | "cr" | "student";
    verificationStatus: string | null;
    level: string | null;
    roleInLevel: RoleInLevel | null;
  };
  accessToken: string;
  refreshToken: string;
  joinCode?: string;
}

interface AuthPending {
  user: {
    id: string;
    fullName: string;
    email: string;
    globalRole: string;
    verificationStatus: string;
    level: string | null;
    roleInLevel: null;
  };
  pendingLevel: string | null;
}

function toSession(u: AuthOk["user"]): SessionUser {
  return {
    fullName: u.fullName,
    email: u.email,
    role: u.globalRole === "admin" ? "student" : u.globalRole,
    roleInLevel: u.roleInLevel ?? undefined,
    level: u.level,
  };
}

export const authApi = {
  async login(
    email: string,
    password: string,
  ): Promise<{ user: SessionUser } | { pendingLevel: string | null }> {
    const res = await api.post<AuthOk | AuthPending>("/api/auth/login", {
      email,
      password,
    });
    if ("accessToken" in res) {
      saveTokens(res.accessToken, res.refreshToken);
      return { user: toSession(res.user) };
    }
    return { pendingLevel: res.pendingLevel };
  },

  async signupStudent(
    fullName: string,
    email: string,
    password: string,
    joinCode: string,
  ): Promise<SessionUser> {
    const res = await api.post<AuthOk>("/api/auth/signup/student", {
      fullName,
      email,
      password,
      joinCode,
    });
    saveTokens(res.accessToken, res.refreshToken);
    return toSession(res.user);
  },

  async signupCR(
    fullName: string,
    email: string,
    password: string,
    levelRequested: string,
  ): Promise<SessionUser | { pendingLevel: string | null }> {
    const res = await api.post<AuthOk | AuthPending>("/api/auth/signup/cr", {
      fullName,
      email,
      password,
      levelRequested,
    });
    if ("accessToken" in res) {
      saveTokens(res.accessToken, res.refreshToken);
      return toSession(res.user);
    }
    return { pendingLevel: res.pendingLevel };
  },

  async logout(): Promise<void> {
    try {
      await api.post("/api/auth/logout");
    } finally {
      clearTokens();
    }
  },
};
