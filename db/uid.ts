// ─── uid (platform-agnostic) ────────────────────────────────────────
// Local id factory shared by the native + web personal-data backends.
export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}
