import { metaGet, metaSet } from "@/db/personal";

// ─── API client (real backend, no stubs) ────────────────────────────
// Base URL comes from EXPO_PUBLIC_API_URL (.env, dev + EAS profiles).
// Tokens live in the on-device meta table. 401s trigger one silent
// refresh + retry; anything else throws ApiError with the server message.

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

interface Options {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
}

async function request<T>(
  path: string,
  opts: Options = {},
  retried = false,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.auth !== false) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && opts.auth !== false && !retried) {
    // One silent refresh, then a single retry.
    const refresh = getRefreshToken();
    if (refresh) {
      const r = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (r.ok) {
        const data = (await r.json()) as { accessToken: string };
        accessCache = data.accessToken;
        writeToken("accessToken", data.accessToken);
        return request<T>(path, opts, true);
      }
    }
    clearTokens();
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
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
