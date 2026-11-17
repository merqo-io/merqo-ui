import { describe, it, expect } from "vitest";
import { errorReasons, weakPasswordMessage } from "./weak-password-message";

const CHARS_MESSAGE =
  "Password should contain at least one character of each: abcdefghijklmnopqrstuvwxyz, ABCDEFGHIJKLMNOPQRSTUVWXYZ, 0123456789, !@#$%^&*()_+-=[]{};':\"|<>?,./`~.";
const GENERIC = "That password is too weak. Choose a longer, less common one.";
const ALL_CLASSES =
  "Password must include a lowercase letter, an uppercase letter, a number and a symbol.";
const PWNED = "This password has appeared in a data breach. Choose a different one.";

describe("weakPasswordMessage", () => {
  it("maps length with and without a number", () => {
    expect(
      weakPasswordMessage({
        reasons: ["length"],
        message: "Password should be at least 8 characters.",
      }),
    ).toBe("Password is too short. Use at least 8 characters.");
    expect(weakPasswordMessage({ reasons: ["length"], message: "short" })).toBe(
      "Password is too short. Use a longer one.",
    );
    expect(weakPasswordMessage({ reasons: ["length"] })).toBe(
      "Password is too short. Use a longer one.",
    );
  });

  it("names all four classes from the real Supabase message", () => {
    expect(weakPasswordMessage({ reasons: ["characters"], message: CHARS_MESSAGE })).toBe(
      ALL_CLASSES,
    );
  });

  it("names only the classes present", () => {
    expect(
      weakPasswordMessage({
        reasons: ["characters"],
        message: "contain at least one character of each: abcdefghijklmnopqrstuvwxyz, 0123456789",
      }),
    ).toBe("Password must include a lowercase letter and a number.");
    expect(
      weakPasswordMessage({ reasons: ["characters"], message: "contain at least one: !@#" }),
    ).toBe("Password must include a symbol.");
  });

  it("falls back to a wider-mix sentence when no class is listed", () => {
    expect(weakPasswordMessage({ reasons: ["characters"], message: "nope" })).toMatch(
      /^Password needs a wider mix of characters/,
    );
  });

  it("maps pwned", () => {
    expect(weakPasswordMessage({ reasons: ["pwned"] })).toBe(PWNED);
  });

  it("joins combined reasons in order", () => {
    expect(
      weakPasswordMessage({
        reasons: ["length", "characters", "pwned"],
        message: `Password should be at least 12 characters. ${CHARS_MESSAGE}`,
      }),
    ).toBe(`Password is too short. Use at least 12 characters. ${ALL_CLASSES} ${PWNED}`);
  });

  it("ignores unknown reasons", () => {
    expect(weakPasswordMessage({ reasons: ["mystery"] })).toBe(GENERIC);
    expect(weakPasswordMessage({ reasons: ["mystery", "pwned"] })).toBe(PWNED);
  });

  it("infers from the message when there are no reasons", () => {
    expect(weakPasswordMessage({ message: "Password should be at least 6 characters." })).toBe(
      "Password is too short. Use at least 6 characters.",
    );
    expect(weakPasswordMessage({ reasons: [], message: CHARS_MESSAGE })).toBe(ALL_CLASSES);
    expect(weakPasswordMessage({ message: `at least 8 characters. ${CHARS_MESSAGE}` })).toBe(
      `Password is too short. Use at least 8 characters. ${ALL_CLASSES}`,
    );
  });

  it("does not infer pwned from message text", () => {
    expect(weakPasswordMessage({ message: "Password has been pwned in a breach" })).toBe(GENERIC);
  });

  it("gives the generic line with nothing to go on", () => {
    expect(weakPasswordMessage({})).toBe(GENERIC);
    expect(weakPasswordMessage({ message: null })).toBe(GENERIC);
  });
});

describe("errorReasons", () => {
  it("returns undefined for non-objects and non-arrays", () => {
    expect(errorReasons(null)).toBeUndefined();
    expect(errorReasons("length")).toBeUndefined();
    expect(errorReasons(42)).toBeUndefined();
    expect(errorReasons({})).toBeUndefined();
    expect(errorReasons({ reasons: "length" })).toBeUndefined();
  });

  it("keeps only string items", () => {
    expect(errorReasons({ reasons: ["length", 1, null, "pwned", {}] })).toEqual([
      "length",
      "pwned",
    ]);
    expect(errorReasons({ reasons: [] })).toEqual([]);
  });
});
