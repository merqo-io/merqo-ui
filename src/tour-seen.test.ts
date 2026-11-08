import { describe, it, expect } from "vitest";
import { readTourSeen, writeTourSeen, type TourSeenStorage } from "./tour-seen";

function memory(): TourSeenStorage & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

describe("tour-seen", () => {
  it("is unseen until written", () => {
    const s = memory();
    expect(readTourSeen("kit:tour", s)).toBe(false);
    writeTourSeen("kit:tour", s);
    expect(readTourSeen("kit:tour", s)).toBe(true);
    expect(readTourSeen("other", s)).toBe(false);
  });

  it("stores an ISO timestamp", () => {
    const s = memory();
    writeTourSeen("k", s, new Date("2026-01-02T03:04:05.000Z"));
    expect(s.data.k).toBe("2026-01-02T03:04:05.000Z");
  });

  it("treats a throwing or missing storage as unseen and never throws", () => {
    const bad: TourSeenStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readTourSeen("k", bad)).toBe(false);
    expect(() => writeTourSeen("k", bad)).not.toThrow();
    expect(readTourSeen("k", null)).toBe(false);
    expect(() => writeTourSeen("k", null)).not.toThrow();
  });

  it("falls back to window.localStorage when no storage is passed", () => {
    expect(readTourSeen("fallback-key")).toBe(false);
    writeTourSeen("fallback-key");
    expect(readTourSeen("fallback-key")).toBe(true);
    window.localStorage.clear();
  });
});
