import { api, clearTokens, getRefreshToken, saveTokens } from "./api";
import type { Role, RoleInLevel } from "@/types";

// ─── Auth service (real API) ────────────────────────────────────────
// Shapes mirror the backend auth module exactly. Pending CR responses
// carry pendingLevel instead of tokens (the default now: CR signups wait in
// the admin verification queue until approved).
//
// Login, signup and logout are sent with `auth: false`: they are not covered by
// the access token, and a 401 from them (wrong password) must surface the
// server's message instead of being mistaken for an expired session.

export interface SessionUser {
  /** Server user id (lets screens tell "mine" from other people's items). */
  id: string;
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
    id: u.id,
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
    const res = await api.post<AuthOk | AuthPending>(
      "/api/auth/login",
      { email, password },
      { auth: false },
    );
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
    const res = await api.post<AuthOk>(
      "/api/auth/signup/student",
      { fullName, email, password, joinCode },
      { auth: false },
    );
    saveTokens(res.accessToken, res.refreshToken);
    return toSession(res.user);
  },

  async signupCR(
    fullName: string,
    email: string,
    password: string,
    levelRequested: string,
  ): Promise<SessionUser | { pendingLevel: string | null }> {
    const res = await api.post<AuthOk | AuthPending>(
      "/api/auth/signup/cr",
      { fullName, email, password, levelRequested },
      { auth: false },
    );
    if ("accessToken" in res) {
      saveTokens(res.accessToken, res.refreshToken);
      return toSession(res.user);
    }
    return { pendingLevel: res.pendingLevel };
  },

  // Ends the session on the server (revokes this login's refresh-token
  // family), then forgets the tokens locally. The server call is best effort:
  // being offline must never stop someone logging out of the app.
  async logout(): Promise<void> {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await api.post("/api/auth/logout", { refreshToken }, { auth: false });
      }
    } catch {
      // offline / server error: still log out locally
    } finally {
      clearTokens();
    }
  },
};
