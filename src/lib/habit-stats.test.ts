import { describe, expect, it } from "vitest";

import { addDays, type ISODate } from "~/lib/dates";
import { computeHabitStats, type StatsInput } from "~/lib/habit-stats";

// Fortnights used below: … 08-31, 09-14, 09-28 (current, today = Mon 10-05).
const TODAY = "2026-10-05";

function days(start: ISODate, n: number): StatsInput["checkIns"] {
  return Array.from({ length: n }, (_, i) => ({
    date: addDays(start, i),
    backfilled: false,
  }));
}

function stats(overrides: Partial<StatsInput>) {
  return computeHabitStats({
    startDate: "2026-08-31",
    today: TODAY,
    targets: [{ value: 4, effectiveFrom: "2026-08-31" }],
    checkIns: [],
    skips: [],
    ...overrides,
  });
}

describe("computeHabitStats", () => {
  it("counts distinct days and treats exceeding the target as a hit", () => {
    const s = stats({
      checkIns: [
        ...days("2026-08-31", 6),
        { date: "2026-08-31", backfilled: true },
      ],
    });
    expect(s.periods[0]).toMatchObject({ count: 6, target: 4, status: "hit" });
  });

  it("builds periods from the start fortnight through the current one", () => {
    const s = stats({});
    expect(s.periods.map((p) => p.start)).toEqual([
      "2026-08-31",
      "2026-09-14",
      "2026-09-28",
    ]);
    expect(s.periods.map((p) => p.status)).toEqual([
      "miss",
      "miss",
      "in-progress",
    ]);
  });

  it("counts a streak of consecutive hits, ignoring an unfinished current period", () => {
    const s = stats({
      checkIns: [...days("2026-08-31", 4), ...days("2026-09-14", 4)],
    });
    expect(s.streak).toBe(2);
    expect(s.bestStreak).toBe(2);
  });

  it("includes the current period in the streak once it is hit", () => {
    const s = stats({
      checkIns: [...days("2026-09-14", 4), ...days("2026-09-28", 4)],
    });
    expect(s.streak).toBe(2);
    expect(s.misses).toBe(1);
  });

  it("lets skipped periods pass through the streak", () => {
    const s = stats({
      checkIns: [...days("2026-08-31", 4), ...days("2026-09-28", 4)],
      skips: [{ periodStart: "2026-09-14", reason: "sick" }],
    });
    expect(s.periods[1]).toMatchObject({
      status: "skipped",
      skipReason: "sick",
    });
    expect(s.streak).toBe(2);
  });

  it("excludes a partial first period from the streak", () => {
    const s = stats({
      startDate: "2026-09-03",
      checkIns: days("2026-09-03", 4),
    });
    expect(s.periods[0]).toMatchObject({ isPartial: true, status: "hit" });
    expect(s.streak).toBe(0);
    expect(s.hits).toBe(0);
  });

  it("judges each period by the target in effect then", () => {
    const s = stats({
      targets: [
        { value: 2, effectiveFrom: "2026-08-31" },
        { value: 8, effectiveFrom: "2026-09-20" },
      ],
      checkIns: [...days("2026-08-31", 2), ...days("2026-09-14", 3)],
    });
    expect(s.periods.map((p) => p.target)).toEqual([2, 8, 8]);
    expect(s.periods.map((p) => p.status)).toEqual([
      "hit",
      "miss",
      "in-progress",
    ]);
    expect(s.currentTarget).toBe(8);
  });

  it("never lets a miss raise the next target", () => {
    const s = stats({ checkIns: [] });
    expect(s.periods.every((p) => p.target === 4)).toBe(true);
  });

  it("counts distinct checked days against days since start", () => {
    const s = stats({
      checkIns: [
        ...days("2026-08-31", 3),
        { date: "2026-08-31", backfilled: true },
        { date: "2026-08-30", backfilled: true },
      ],
    });
    expect(s.checkedDays).toBe(3);
    expect(s.daysSinceStart).toBe(36);
    expect(stats({ startDate: "2026-10-10" }).daysSinceStart).toBe(0);
  });

  it("ignores check-ins before the start date or after today", () => {
    const s = stats({
      checkIns: [
        { date: "2026-08-30", backfilled: true },
        { date: "2026-10-06", backfilled: false },
      ],
    });
    expect(s.periods.reduce((n, p) => n + p.count, 0)).toBe(0);
  });

  describe("current period pace", () => {
    it("reports days left and remaining check-ins", () => {
      const s = stats({
        targets: [{ value: 8, effectiveFrom: "2026-08-31" }],
        checkIns: days("2026-09-28", 3),
      });
      // Today is day 8 of 14 → 7 days left including today.
      expect(s.current).toMatchObject({
        count: 3,
        daysLeft: 7,
        openDays: 7,
        remaining: 5,
        elapsedDays: 8,
        evenPace: 4,
        pace: "behind",
        checkedInToday: false,
      });
    });

    it("is tight when open days barely cover what's left", () => {
      const s = stats({
        targets: [{ value: 8, effectiveFrom: "2026-08-31" }],
        checkIns: days("2026-09-28", 2),
      });
      expect(s.current.pace).toBe("tight");
    });

    it("drops today from open days once checked in", () => {
      const s = stats({
        targets: [{ value: 8, effectiveFrom: "2026-08-31" }],
        checkIns: [{ date: TODAY, backfilled: false }],
      });
      expect(s.current.checkedInToday).toBe(true);
      expect(s.current.openDays).toBe(6);
      expect(s.current.pace).toBe("out-of-reach");
    });

    it("is done once the target is reached, and resting when skipped", () => {
      expect(stats({ checkIns: days("2026-09-28", 4) }).current.pace).toBe(
        "done",
      );
      expect(
        stats({ skips: [{ periodStart: "2026-09-28", reason: null }] }).current
          .pace,
      ).toBe("resting");
    });
  });

  it("summarises averages, best period, weekdays and backfills", () => {
    const s = stats({
      checkIns: [
        ...days("2026-08-31", 6),
        { date: "2026-09-14", backfilled: true },
        { date: "2026-09-16", backfilled: true },
      ],
    });
    expect(s.averagePerPeriod).toBe(4);
    expect(s.bestPeriod?.start).toBe("2026-08-31");
    expect(s.weekdayCounts).toEqual([2, 1, 2, 1, 1, 1, 0]);
    expect(s.liveCount).toBe(6);
    expect(s.backfilledCount).toBe(2);
  });
});
