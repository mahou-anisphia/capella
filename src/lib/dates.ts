/**
 * Calendar-date helpers. A date is always an ISO `YYYY-MM-DD` string with no time or zone, so
 * arithmetic happens on whole day numbers and can't drift across DST or server timezones.
 */

export type ISODate = string;

/** The day rolls over at midnight in this zone (Asia/Saigon is the legacy alias). */
export const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

export const FORTNIGHT_DAYS = 14;

const MS_PER_DAY = 86_400_000;

/** 1970-01-05 was a Monday; fortnights are counted from it. */
const EPOCH_MONDAY = 4;

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidISODate(value: string): boolean {
  const match = ISO_DATE_RE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

/** Days since 1970-01-01. */
export function toDayNumber(date: ISODate): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d) / MS_PER_DAY;
}

export function fromDayNumber(day: number): ISODate {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

export function addDays(date: ISODate, days: number): ISODate {
  return fromDayNumber(toDayNumber(date) + days);
}

/** Inclusive count of days from `from` to `to` (same day → 1). */
export function daysBetweenInclusive(from: ISODate, to: ISODate): number {
  return toDayNumber(to) - toDayNumber(from) + 1;
}

/** Monday = 0 … Sunday = 6. */
export function weekdayIndex(date: ISODate): number {
  const offset = (toDayNumber(date) - EPOCH_MONDAY) % 7;
  return (offset + 7) % 7;
}

/** Today's calendar date in {@link APP_TIME_ZONE}, regardless of where the code runs. */
export function todayInAppZone(now: Date = new Date()): ISODate {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function fortnightIndex(date: ISODate): number {
  return Math.floor((toDayNumber(date) - EPOCH_MONDAY) / FORTNIGHT_DAYS);
}

export function fortnightByIndex(index: number): {
  start: ISODate;
  end: ISODate;
} {
  const startDay = EPOCH_MONDAY + index * FORTNIGHT_DAYS;
  return {
    start: fromDayNumber(startDay),
    end: fromDayNumber(startDay + FORTNIGHT_DAYS - 1),
  };
}

/** The fortnight (Monday → Sunday 13 days later) containing `date`. */
export function fortnightOf(date: ISODate): { start: ISODate; end: ISODate } {
  return fortnightByIndex(fortnightIndex(date));
}

/** Local `Date` (as used by date pickers) ↔ ISO date, using the browser's calendar fields. */
export function localDateToISO(date: Date): ISODate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isoToLocalDate(date: ISODate): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

const shortFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const longFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "5 Oct" */
export function formatShort(date: ISODate): string {
  return shortFormat.format(new Date(toDayNumber(date) * MS_PER_DAY));
}

/** "Mon, 5 Oct 2026" */
export function formatLong(date: ISODate): string {
  return longFormat.format(new Date(toDayNumber(date) * MS_PER_DAY));
}

/** "5 – 18 Oct" */
export function formatRange(start: ISODate, end: ISODate): string {
  return `${formatShort(start)} – ${formatShort(end)}`;
}

export const WEEKDAY_LABELS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;
