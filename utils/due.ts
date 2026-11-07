// ─── Due-date display ───────────────────────────────────────────────
// Backend ships ISO timestamps; legacy stubs used labels ("in 2 days",
// "Friday"). Both render as friendly countdowns; unparseable values
// pass through untouched instead of breaking the card.

export function formatDue(due: string | null | undefined): string | null {
  if (!due) return null;
  const date = new Date(due);
  if (Number.isNaN(date.getTime())) return due; // legacy label — show as-is
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (days < 0) return "Past due";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

/** "just now" / "5m ago" / "3h ago" / "2d ago", then a short date. */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const secs = Math.round((Date.now() - date.getTime()) / 1000);
  if (secs < 45) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export type DueTone = "past" | "soon" | "later" | "none";

// How urgent a due date feels: drives colour (danger / warning / neutral).
// "soon" = due within two days. Unparseable legacy labels count as "later".
export function dueTone(due: string | null | undefined): DueTone {
  if (!due) return "none";
  const date = new Date(due);
  if (Number.isNaN(date.getTime())) return "later";
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (days < 0) return "past";
  return days <= 2 ? "soon" : "later";
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
