// Pure and directive-free so Server Components can import it. Every output
// is pinned to Singapore time: never the server's or the browser's zone.

export const SGT_TIME_ZONE = "Asia/Singapore";

// Singapore has no daylight saving, so its offset from UTC is constant.
const SGT_OFFSET_MS = 8 * 60 * 60 * 1000;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Built once: Intl.DateTimeFormat construction is comparatively expensive.
const SGT_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: SGT_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});

export type DateInput = string | number | Date;

interface SgtParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function toDate(input: DateInput): Date | null {
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sgtParts(date: Date): SgtParts {
  const map: Record<string, number> = {};
  for (const part of SGT_PARTS.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = Number(part.value);
  }
  return {
    year: map.year ?? 0,
    month: map.month ?? 1,
    day: map.day ?? 1,
    hour: map.hour ?? 0,
    minute: map.minute ?? 0,
  };
}

function dateText(p: SgtParts): string {
  return `${p.day} ${MONTHS[p.month - 1]} ${p.year}`;
}

function timeText(p: SgtParts): string {
  const meridiem = p.hour < 12 ? "am" : "pm";
  const hour12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  return `${hour12}:${String(p.minute).padStart(2, "0")} ${meridiem}`;
}

/** "7 Nov 2026" in SGT. Invalid input renders as "-". */
export function formatDate(input: DateInput): string {
  const date = toDate(input);
  return date ? dateText(sgtParts(date)) : "-";
}

/** "1:30 am" in SGT (12-hour, lower-case). Invalid input renders as "-". */
export function formatTime(input: DateInput): string {
  const date = toDate(input);
  return date ? timeText(sgtParts(date)) : "-";
}

/** "7 Nov 2026, 1:30 am" in SGT. Invalid input renders as "-". */
export function formatDateTime(input: DateInput): string {
  const date = toDate(input);
  if (!date) return "-";
  const parts = sgtParts(date);
  return `${dateText(parts)}, ${timeText(parts)}`;
}

/** "YYYY-MM-DD" of the Singapore calendar day, or "" for invalid input. */
export function sgDayKey(input: DateInput): string {
  const date = toDate(input);
  if (!date) return "";
  const p = sgtParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** The instant of 00:00 SGT on the Singapore day containing `input`. */
export function startOfSgDay(input: DateInput): Date {
  const date = toDate(input);
  if (!date) return new Date(Number.NaN);
  const p = sgtParts(date);
  return new Date(Date.UTC(p.year, p.month - 1, p.day) - SGT_OFFSET_MS);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "just now", "5m ago", "3h ago", "2d ago" (and "in 5m" for the future);
 * beyond a week it falls back to the SGT date. Invalid input renders as "-".
 */
export function formatRelativeTime(
  input: DateInput,
  now: DateInput = new Date(),
): string {
  const date = toDate(input);
  const reference = toDate(now);
  if (!date || !reference) return "-";
  const diff = reference.getTime() - date.getTime();
  const abs = Math.abs(diff);
  if (abs < MINUTE) return "just now";
  if (abs >= 7 * DAY) return formatDate(date);
  let text: string;
  if (abs < HOUR) text = `${Math.floor(abs / MINUTE)}m`;
  else if (abs < DAY) text = `${Math.floor(abs / HOUR)}h`;
  else text = `${Math.floor(abs / DAY)}d`;
  return diff >= 0 ? `${text} ago` : `in ${text}`;
}
