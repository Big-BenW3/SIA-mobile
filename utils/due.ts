// ─── Due-date display ───────────────────────────────────────────────
// Backend ships ISO timestamps; legacy stubs used labels ("in 2 days",
// "Friday"). Both render as friendly countdowns; unparseable values
// pass through untouched instead of breaking the card.

export function formatDue(due: string | null | undefined): string | null {
  if (!due) return null;
  const date = new Date(due);
  if (Number.isNaN(date.getTime())) return due; // legacy label — show as-is
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (days < 0) return 'Past due';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
