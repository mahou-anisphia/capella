import { describe, expect, it } from "vitest";

import {
  addDays,
  formatLong,
  formatShort,
  fortnightOf,
  isValidISODate,
  todayInAppZone,
  weekdayIndex,
} from "~/lib/dates";

describe("fortnightOf", () => {
  it("starts on a Monday and spans 14 days", () => {
    expect(fortnightOf("2026-10-05")).toEqual({
      start: "2026-09-28",
      end: "2026-10-11",
    });
    expect(weekdayIndex("2026-09-28")).toBe(0);
    expect(weekdayIndex("2026-10-11")).toBe(6);
  });

  it("gives every day of a fortnight the same period", () => {
    for (let i = 0; i < 14; i++) {
      expect(fortnightOf(addDays("2026-09-28", i)).start).toBe("2026-09-28");
    }
    expect(fortnightOf("2026-10-12").start).toBe("2026-10-12");
    expect(fortnightOf("2026-09-27").start).toBe("2026-09-14");
  });

  it("pairs weeks across a year boundary and in 53-week years", () => {
    // 2020 has an ISO week 53; pairing is global, not ISO-parity based.
    expect(fortnightOf("2021-01-03")).toEqual({
      start: "2020-12-28",
      end: "2021-01-10",
    });
  });

  it("handles dates before the epoch", () => {
    expect(fortnightOf("1969-12-31")).toEqual({
      start: "1969-12-22",
      end: "1970-01-04",
    });
  });
});

describe("todayInAppZone", () => {
  it("rolls over at midnight Saigon time, not UTC", () => {
    // 17:30 UTC on 4 Oct is 00:30 on 5 Oct in UTC+7.
    expect(todayInAppZone(new Date("2026-10-04T17:30:00Z"))).toBe("2026-10-05");
    expect(todayInAppZone(new Date("2026-10-04T16:59:00Z"))).toBe("2026-10-04");
  });
});

describe("isValidISODate", () => {
  it("rejects malformed and impossible dates", () => {
    expect(isValidISODate("2026-10-05")).toBe(true);
    expect(isValidISODate("2026-02-30")).toBe(false);
    expect(isValidISODate("2026-1-5")).toBe(false);
  });
});

describe("formatShort / formatLong", () => {
  it("formats independently of the runtime's ICU data", () => {
    expect(formatShort("2026-09-14")).toBe("14 Sep");
    expect(formatLong("2026-10-05")).toBe("Mon, 5 Oct 2026");
  });
});
