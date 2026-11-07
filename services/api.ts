import { metaGet, metaSet } from "@/db/personal";

// ─── API client (real backend, no stubs) ────────────────────────────
// Base URL comes from EXPO_PUBLIC_API_URL (.env, dev + EAS profiles).
// Tokens live in the on-device meta table. A 401 triggers ONE silent token
// refresh (shared by every request that failed at the same time) and a single
// retry; anything else throws ApiError with the server message.
//
// Refresh tokens ROTATE: every successful refresh returns a new refresh token
// and the old one is spent. The new pair must be stored, and two overlapping
// refreshes must never both spend the same token, hence the single-flight
// promise below.

// `||`, not `??`: an empty EXPO_PUBLIC_API_URL must fall back rather than
// resolve to '' and turn every request into a relative URL.
export const API_BASE: string =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let accessCache: string | null | undefined;
let refreshCache: string | null | undefined;

function readToken(key: string): string | null {
  return metaGet(key);
}

function writeToken(key: string, value: string | null): void {
  metaSet(key, value);
}

export function getAccessToken(): string | null {
  if (accessCache === undefined) accessCache = readToken("accessToken");
  return accessCache;
}

export function getRefreshToken(): string | null {
  if (refreshCache === undefined) refreshCache = readToken("refreshToken");
  return refreshCache;
}

export function saveTokens(access: string, refresh: string): void {
  accessCache = access;
  refreshCache = refresh;
  writeToken("accessToken", access);
  writeToken("refreshToken", refresh);
}

export function clearTokens(): void {
  accessCache = null;
  refreshCache = null;
  writeToken("accessToken", null);
  writeToken("refreshToken", null);
}

// The auth store registers this so the API layer can tell the app a session
// is gone (revoked, expired, account disabled) without importing the store.
let sessionExpiredHandler: (() => void) | null = null;
export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

interface Options {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Send the access token and refresh on 401. Login/signup/logout pass false. */
  auth?: boolean;
}

type RefreshOutcome = "ok" | "expired" | "unavailable";
let refreshing: Promise<RefreshOutcome> | null = null;

// One refresh at a time: concurrent 401s await the same promise instead of
// each spending (and invalidating) the same single-use refresh token.
function refreshSession(): Promise<RefreshOutcome> {
  refreshing ??= (async (): Promise<RefreshOutcome> => {
    const refresh = getRefreshToken();
    if (!refresh) return "expired";
    try {
      const r = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (r.ok) {
        const data = (await r.json()) as {
          accessToken: string;
          refreshToken: string;
        };
        saveTokens(data.accessToken, data.refreshToken);
        return "ok";
      }
      // 401/403: the server says this session is over (revoked, reused,
      // account disabled). Anything else (429, 5xx) is transient: keep the
      // tokens so the user is not logged out by a server hiccup.
      return r.status === 401 || r.status === 403 ? "expired" : "unavailable";
    } catch {
      return "unavailable"; // offline: do not destroy a valid session
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

// Some responses rotate the session (a password change revokes every refresh
// token and returns a fresh pair for this device). Adopt them so the user stays
// signed in on the device they just used.
function adoptRotatedTokens(path: string, method: string, data: unknown): void {
  if (method !== "PATCH" || path !== "/api/users/me") return;
  const d = data as { accessToken?: unknown; refreshToken?: unknown } | null;
  if (
    d &&
    typeof d.accessToken === "string" &&
    typeof d.refreshToken === "string"
  ) {
    saveTokens(d.accessToken, d.refreshToken);
  }
}

async function request<T>(
  path: string,
  opts: Options = {},
  retried = false,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const authed = opts.auth !== false;
  if (authed) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const method = opts.method ?? "GET";
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && authed && !retried) {
    const outcome = await refreshSession();
    if (outcome === "ok") return request<T>(path, opts, true);
    if (outcome === "unavailable") {
      throw new ApiError(503, "Could not reach the server. Try again.");
    }
    clearTokens();
    sessionExpiredHandler?.();
    throw new ApiError(401, "Session expired. Log in again.");
  }

  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      const data = (await res.json()) as { error?: { message?: string } };
      if (data.error?.message) message = data.error.message;
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json()) as T;
  adoptRotatedTokens(path, method, data);
  return data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown, opts?: Pick<Options, "auth">) =>
    request<T>(path, { method: "POST", body, ...opts }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
