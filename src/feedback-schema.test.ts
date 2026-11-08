import { describe, it, expect } from "vitest";
import { feedbackSchema } from "./feedback-schema";

describe("feedbackSchema", () => {
  it("accepts an nps with and without a message", () => {
    expect(feedbackSchema.parse({ nps: 0 })).toEqual({ nps: 0 });
    expect(feedbackSchema.parse({ nps: 10, message: "  great  " })).toEqual({ nps: 10, message: "great" });
  });

  it("rejects out-of-range or fractional scores", () => {
    expect(feedbackSchema.safeParse({ nps: -1 }).success).toBe(false);
    expect(feedbackSchema.safeParse({ nps: 11 }).success).toBe(false);
    expect(feedbackSchema.safeParse({ nps: 5.5 }).success).toBe(false);
  });

  it("rejects a message over 2000 characters", () => {
    expect(feedbackSchema.safeParse({ nps: 5, message: "a".repeat(2001) }).success).toBe(false);
    expect(feedbackSchema.safeParse({ nps: 5, message: "a".repeat(2000) }).success).toBe(true);
  });
});
