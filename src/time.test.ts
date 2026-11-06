import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  SGT_TIME_ZONE,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatTime,
  sgDayKey,
  startOfSgDay,
} from "./time";

// Pin the process zone away from SGT so any code that leaks the host zone
// would produce a different answer than the expectations below.
let originalTz: string | undefined;
beforeAll(() => {
  originalTz = process.env.TZ;
  process.env.TZ = "America/Los_Angeles";
});
afterAll(() => {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
});

// 2026-11-06T17:30:00Z is 2026-11-07 01:30 in Singapore.
const ACROSS_MIDNIGHT = "2026-11-06T17:30:00Z";

describe("SGT formatting", () => {
  it("pins the zone", () => {
    expect(SGT_TIME_ZONE).toBe("Asia/Singapore");
  });

  it("formats the date in SGT", () => {
    expect(formatDate(ACROSS_MIDNIGHT)).toBe("7 Nov 2026");
  });

  it("formats the time in SGT, 12-hour lower-case", () => {
    expect(formatTime(ACROSS_MIDNIGHT)).toBe("1:30 am");
    expect(formatTime("2026-11-07T04:05:00Z")).toBe("12:05 pm");
    expect(formatTime("2026-11-06T16:00:00Z")).toBe("12:00 am");
    expect(formatTime("2026-11-07T11:45:00Z")).toBe("7:45 pm");
  });

  it("formats date and time together", () => {
    expect(formatDateTime(ACROSS_MIDNIGHT)).toBe("7 Nov 2026, 1:30 am");
  });

  it("accepts Date and epoch millisecond input", () => {
    const date = new Date(ACROSS_MIDNIGHT);
    expect(formatDate(date)).toBe("7 Nov 2026");
    expect(formatDateTime(date.getTime())).toBe("7 Nov 2026, 1:30 am");
  });

  it("returns a dash for invalid input", () => {
    expect(formatDate("not a date")).toBe("-");
    expect(formatTime(Number.NaN)).toBe("-");
    expect(formatDateTime(new Date("x"))).toBe("-");
    expect(formatRelativeTime("x")).toBe("-");
    expect(sgDayKey("x")).toBe("");
    expect(Number.isNaN(startOfSgDay("x").getTime())).toBe(true);
  });
});

describe("sgDayKey and startOfSgDay", () => {
  it("returns the Singapore calendar day", () => {
    expect(sgDayKey(ACROSS_MIDNIGHT)).toBe("2026-11-07");
    expect(sgDayKey("2026-11-06T15:59:59Z")).toBe("2026-11-06");
    expect(sgDayKey("2026-11-06T16:00:00Z")).toBe("2026-11-07");
  });

  it("returns Singapore midnight as a UTC instant", () => {
    expect(startOfSgDay(ACROSS_MIDNIGHT).toISOString()).toBe(
      "2026-11-06T16:00:00.000Z",
    );
    expect(startOfSgDay("2026-11-07T10:00:00Z").toISOString()).toBe(
      "2026-11-06T16:00:00.000Z",
    );
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-11-07T04:00:00Z");
  it.each([
    ["2026-11-07T03:59:45Z", "just now"],
    ["2026-11-07T04:00:20Z", "just now"],
    ["2026-11-07T03:55:00Z", "5m ago"],
    ["2026-11-07T01:00:00Z", "3h ago"],
    ["2026-11-05T04:00:00Z", "2d ago"],
    ["2026-11-07T04:10:00Z", "in 10m"],
    ["2026-11-07T07:00:00Z", "in 3h"],
    ["2026-11-10T04:00:00Z", "in 3d"],
  ])("%s -> %s", (iso, expected) => {
    expect(formatRelativeTime(iso, now)).toBe(expected);
  });

  it("falls back to the SGT date beyond a week", () => {
    expect(formatRelativeTime("2026-10-01T17:00:00Z", now)).toBe("2 Oct 2026");
    expect(formatRelativeTime("2026-12-25T04:00:00Z", now)).toBe("25 Dec 2026");
  });

  it("defaults now to the current time", () => {
    expect(formatRelativeTime(new Date())).toBe("just now");
  });
});
