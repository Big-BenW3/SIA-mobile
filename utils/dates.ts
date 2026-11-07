// ─── Day helpers for planner dates ──────────────────────────────────
// Tasks store `scheduledDate` as a plain local calendar day, "YYYY-MM-DD".
// Older rows may hold free text ("Friday"); those display exactly as typed.

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function parseDay(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "Today" / "Tomorrow" / "Yesterday" / "Fri 14 Nov"; legacy text passes through. */
export function formatDay(value: string | null | undefined): string {
  if (!value) return "No date";
  if (!DAY_RE.test(value)) return value;
  const target = parseDay(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return target.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** True when a plain-day value is before today (open tasks only). */
export function isOverdueDay(value: string | null | undefined): boolean {
  if (!value || !DAY_RE.test(value)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseDay(value).getTime() < today.getTime();
}

// ─── Post due dates (CR composer) ───────────────────────────────────
// The API accepts only a real timestamp for `dueDate` (free text such as
// "Friday, 5pm" is rejected with 400). The composer therefore builds one from
// a picked day + picked time; the result is a full ISO string.

export interface TimeChoice {
  key: string;
  label: string;
  hour: number;
  minute: number;
}

export const TIME_CHOICES: TimeChoice[] = [
  { key: "9am", label: "9:00 am", hour: 9, minute: 0 },
  { key: "12pm", label: "12:00 pm", hour: 12, minute: 0 },
  { key: "5pm", label: "5:00 pm", hour: 17, minute: 0 },
  { key: "2359", label: "11:59 pm", hour: 23, minute: 59 },
];

/** Day + time → ISO timestamp (local time, serialised with its offset as UTC). */
export function dueIso(
  day: string,
  time: Pick<TimeChoice, "hour" | "minute">,
): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d, time.hour, time.minute).toISOString();
}

/** "Fri 14 Nov, 5:00 pm" for a due ISO string; "" when unset/invalid. */
export function formatDueStamp(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day}, ${time}`;
}

/** Quick picks for a deadline, starting tomorrow. */
export function dueDayChoices(now = new Date()): DayChoice[] {
  return [
    { key: "none", label: "No due date", value: null },
    { key: "d1", label: "Tomorrow", value: isoDay(addDays(now, 1)) },
    { key: "d3", label: "In 3 days", value: isoDay(addDays(now, 3)) },
    { key: "d7", label: "In a week", value: isoDay(addDays(now, 7)) },
    { key: "d14", label: "In 2 weeks", value: isoDay(addDays(now, 14)) },
  ];
}

export interface DayChoice {
  key: string;
  label: string;
  /** ISO day, or null for "no date". */
  value: string | null;
}

/** The quick picks on the add-task form. */
export function dayChoices(now = new Date()): DayChoice[] {
  const dow = now.getDay(); // 0 Sun … 6 Sat
  const toSat = (6 - dow + 7) % 7 || 7;
  const toMon = (1 - dow + 7) % 7 || 7;
  return [
    { key: "today", label: "Today", value: isoDay(now) },
    { key: "tomorrow", label: "Tomorrow", value: isoDay(addDays(now, 1)) },
    { key: "weekend", label: "Weekend", value: isoDay(addDays(now, toSat)) },
    { key: "next", label: "Next week", value: isoDay(addDays(now, toMon)) },
    { key: "none", label: "No date", value: null },
  ];
}
