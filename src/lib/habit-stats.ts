import {
  FORTNIGHT_DAYS,
  daysBetweenInclusive,
  fortnightByIndex,
  fortnightIndex,
  weekdayIndex,
  type ISODate,
} from "~/lib/dates";

/**
 * Everything about progress is derived here from raw check-ins; nothing is stored. Keep this file
 * free of I/O so it can run on the server and in tests.
 */

export const SKIP_REASONS = ["tired", "sick", "busy", "travel"] as const;
export type SkipReason = (typeof SKIP_REASONS)[number];

export type PeriodStatus = "hit" | "miss" | "skipped" | "in-progress";

/** How the current fortnight is going, from calmest to tightest. */
export type PaceState =
  "resting" | "done" | "on-pace" | "behind" | "tight" | "out-of-reach";

export interface StatsInput {
  startDate: ISODate;
  today: ISODate;
  /** At least one entry. A period is judged by the latest target effective by its last day. */
  targets: { value: number; effectiveFrom: ISODate }[];
  checkIns: { date: ISODate; backfilled: boolean }[];
  skips: { periodStart: ISODate; reason: SkipReason | null }[];
}

export interface PeriodResult {
  start: ISODate;
  end: ISODate;
  count: number;
  target: number;
  status: PeriodStatus;
  isCurrent: boolean;
  /** Tracking began after this fortnight started; excluded from streaks rather than prorated. */
  isPartial: boolean;
  skipReason: SkipReason | null;
}

export interface CurrentPeriod extends PeriodResult {
  /** Days left including today. */
  daysLeft: number;
  /** Days still open for a check-in (today drops out once it is done). */
  openDays: number;
  remaining: number;
  elapsedDays: number;
  /** Check-ins an even pace would have by today. */
  evenPace: number;
  pace: PaceState;
  checkedInToday: boolean;
}

export interface HabitStats {
  today: ISODate;
  currentTarget: number;
  /** Chronological, from the fortnight containing `startDate` up to the current one. */
  periods: PeriodResult[];
  current: CurrentPeriod;
  streak: number;
  bestStreak: number;
  hits: number;
  misses: number;
  skipped: number;
  /** Mean check-ins over completed, full, non-skipped fortnights. */
  averagePerPeriod: number | null;
  bestPeriod: PeriodResult | null;
  /** Monday-first check-in counts. */
  weekdayCounts: number[];
  /** Distinct days checked in, from `startDate` through today. */
  checkedDays: number;
  /** Calendar days from `startDate` through today (0 if it starts later). */
  daysSinceStart: number;
  liveCount: number;
  backfilledCount: number;
}

export function targetFor(
  targets: StatsInput["targets"],
  date: ISODate,
): number {
  const sorted = [...targets].sort((a, b) =>
    a.effectiveFrom.localeCompare(b.effectiveFrom),
  );
  let value = sorted[0]?.value ?? 1;
  for (const t of sorted) {
    if (t.effectiveFrom <= date) value = t.value;
  }
  return value;
}

/** Periods that take part in streaks and hit/miss totals. */
function isCounted(p: PeriodResult): boolean {
  return !p.isPartial && (p.status === "hit" || p.status === "miss");
}

export function computeHabitStats(input: StatsInput): HabitStats {
  const { startDate, today, targets } = input;
  const dates = input.checkIns
    .map((c) => c.date)
    .filter((d) => d >= startDate && d <= today);
  const uniqueDates = new Set(dates);
  const skips = new Map(input.skips.map((s) => [s.periodStart, s.reason]));

  const todayIdx = fortnightIndex(today);
  const firstIdx = Math.min(fortnightIndex(startDate), todayIdx);

  const periods: PeriodResult[] = [];
  for (let idx = firstIdx; idx <= todayIdx; idx++) {
    const { start, end } = fortnightByIndex(idx);
    let count = 0;
    for (const d of uniqueDates) if (d >= start && d <= end) count++;
    const target = targetFor(targets, end);
    const isCurrent = idx === todayIdx;
    const skipped = skips.has(start);

    let status: PeriodStatus;
    if (skipped) status = "skipped";
    else if (count >= target) status = "hit";
    else if (isCurrent) status = "in-progress";
    else status = "miss";

    periods.push({
      start,
      end,
      count,
      target,
      status,
      isCurrent,
      isPartial: start < startDate,
      skipReason: skips.get(start) ?? null,
    });
  }

  const counted = periods.filter(isCounted);

  let streak = 0;
  for (let i = counted.length - 1; i >= 0; i--) {
    if (counted[i]!.status !== "hit") break;
    streak++;
  }

  let bestStreak = 0;
  let run = 0;
  for (const p of counted) {
    run = p.status === "hit" ? run + 1 : 0;
    bestStreak = Math.max(bestStreak, run);
  }

  const completedFull = periods.filter(
    (p) => !p.isCurrent && !p.isPartial && p.status !== "skipped",
  );
  const averagePerPeriod =
    completedFull.length > 0
      ? completedFull.reduce((sum, p) => sum + p.count, 0) /
        completedFull.length
      : null;

  let bestPeriod: PeriodResult | null = null;
  for (const p of periods) {
    if (p.isPartial || p.count === 0) continue;
    if (!bestPeriod || p.count >= bestPeriod.count) bestPeriod = p;
  }

  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const d of uniqueDates) weekdayCounts[weekdayIndex(d)]!++;

  const inRange = input.checkIns.filter(
    (c) => c.date >= startDate && c.date <= today,
  );
  const backfilledCount = inRange.filter((c) => c.backfilled).length;

  return {
    today,
    currentTarget: targetFor(targets, today),
    periods,
    current: describeCurrent(periods[periods.length - 1]!, today, uniqueDates),
    streak,
    bestStreak,
    hits: counted.filter((p) => p.status === "hit").length,
    misses: counted.filter((p) => p.status === "miss").length,
    skipped: periods.filter((p) => p.status === "skipped").length,
    averagePerPeriod,
    bestPeriod,
    weekdayCounts,
    checkedDays: uniqueDates.size,
    daysSinceStart: Math.max(0, daysBetweenInclusive(startDate, today)),
    liveCount: inRange.length - backfilledCount,
    backfilledCount,
  };
}

function describeCurrent(
  period: PeriodResult,
  today: ISODate,
  dates: Set<ISODate>,
): CurrentPeriod {
  const checkedInToday = dates.has(today);
  const daysLeft = daysBetweenInclusive(today, period.end);
  const openDays = daysLeft - (checkedInToday ? 1 : 0);
  const remaining = Math.max(0, period.target - period.count);
  const elapsedDays = daysBetweenInclusive(period.start, today);
  const evenPace = Math.floor((period.target * elapsedDays) / FORTNIGHT_DAYS);

  let pace: PaceState;
  if (period.status === "skipped") pace = "resting";
  else if (remaining === 0) pace = "done";
  else if (remaining > openDays) pace = "out-of-reach";
  else if (openDays - remaining <= 1) pace = "tight";
  else if (period.count < evenPace) pace = "behind";
  else pace = "on-pace";

  return {
    ...period,
    daysLeft,
    openDays,
    remaining,
    elapsedDays,
    evenPace,
    pace,
    checkedInToday,
  };
}
