import { describe, expect, it } from "vitest";
import {
  MAX_MONEY_CENTS,
  centsToDollarString,
  dollarsToCents,
  formatMoney,
  parseDollarsToCents,
} from "./money";

describe("formatMoney", () => {
  it.each([
    [1250, "S$12.50"],
    [0, "S$0.00"],
    [5, "S$0.05"],
    [100, "S$1.00"],
    [-1250, "-S$12.50"],
    [-5, "-S$0.05"],
    [123456789, "S$1,234,567.89"],
    [Number.MAX_SAFE_INTEGER, "S$90,071,992,547,409.91"],
  ])("formats %i cents as %s", (cents, expected) => {
    expect(formatMoney(cents)).toBe(expected);
  });

  it("drops the fraction for whole amounts when asked", () => {
    expect(formatMoney(1600, { trimWholeDollars: true })).toBe("S$16");
    expect(formatMoney(1333, { trimWholeDollars: true })).toBe("S$13.33");
    expect(formatMoney(-2000, { trimWholeDollars: true })).toBe("-S$20");
  });

  it("returns a dash for non-finite input", () => {
    expect(formatMoney(Number.NaN)).toBe("-");
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe("-");
  });

  it("rounds fractional cents", () => {
    expect(formatMoney(1250.4)).toBe("S$12.50");
  });
});

describe("centsToDollarString", () => {
  it.each([
    [650, "6.50"],
    [0, "0.00"],
    [-5, "-0.05"],
    [123456, "1234.56"],
  ])("%i -> %s", (cents, expected) => {
    expect(centsToDollarString(cents)).toBe(expected);
  });
});

describe("parseDollarsToCents", () => {
  it.each([
    ["6.50", 650],
    ["6", 600],
    ["6.", 600],
    [".5", 50],
    ["0", 0],
    ["5.001", 500],
    ["1.005", 101],
    ["1.004", 100],
    ["0.999", 100],
    [" 12.5 ", 1250],
    ["S$12.50", 1250],
    ["$1,234.50", 123450],
    [12.5, 1250],
    [1.005, 101],
    [0, 0],
  ])("parses %j as %i cents", (input, cents) => {
    expect(parseDollarsToCents(input)).toEqual({ ok: true, cents });
  });

  it("treats blank input as unset", () => {
    expect(parseDollarsToCents("")).toEqual({ ok: true, cents: undefined });
    expect(parseDollarsToCents("   ")).toEqual({ ok: true, cents: undefined });
  });

  it.each([
    "abc",
    ".",
    "1e3",
    "0x10",
    "-5",
    "1.2.3",
    "12,34",
    Number.NaN,
    Number.POSITIVE_INFINITY,
    -1,
    1e21,
  ])("rejects %j", (input) => {
    expect(parseDollarsToCents(input)).toEqual({ ok: false });
  });

  it("rejects amounts above the cap", () => {
    expect(parseDollarsToCents("999999999999999999")).toEqual({ ok: false });
    expect(parseDollarsToCents(MAX_MONEY_CENTS / 100 + 1)).toEqual({
      ok: false,
    });
  });

  it("accepts negatives only when allowed", () => {
    expect(parseDollarsToCents("-5.25", { allowNegative: true })).toEqual({
      ok: true,
      cents: -525,
    });
    expect(parseDollarsToCents(-5.25, { allowNegative: true })).toEqual({
      ok: true,
      cents: -525,
    });
  });
});

describe("dollarsToCents", () => {
  it("returns cents or null", () => {
    expect(dollarsToCents("6.50")).toBe(650);
    expect(dollarsToCents(6.5)).toBe(650);
    expect(dollarsToCents("")).toBeNull();
    expect(dollarsToCents("nope")).toBeNull();
  });
});

describe("rounding, guards and signs", () => {
  it("rounds half away from zero symmetrically", () => {
    expect(formatMoney(2.5)).toBe("S$0.03");
    expect(formatMoney(-2.5)).toBe("-S$0.03");
    expect(centsToDollarString(-2.5)).toBe("-0.03");
  });

  it("never prints negative zero", () => {
    expect(formatMoney(-0.4)).toBe("S$0.00");
    expect(formatMoney(-0)).toBe("S$0.00");
    expect(centsToDollarString(-0.4)).toBe("0.00");
  });

  it("guards non-finite and unsafe-large values", () => {
    expect(formatMoney(1e21)).toBe("-");
    expect(formatMoney(-1e21)).toBe("-");
    expect(centsToDollarString(1e21)).toBe("");
    expect(centsToDollarString(Number.NaN)).toBe("");
    expect(centsToDollarString(Number.POSITIVE_INFINITY)).toBe("");
  });

  it("normalises negative zero when parsing", () => {
    const parsed = parseDollarsToCents("-0", { allowNegative: true });
    expect(parsed).toEqual({ ok: true, cents: 0 });
    expect(Object.is((parsed as { cents: number }).cents, -0)).toBe(false);
    expect(parseDollarsToCents(-0)).toEqual({ ok: true, cents: 0 });
  });

  it("accepts the sign before or after the currency prefix", () => {
    const opts = { allowNegative: true };
    expect(parseDollarsToCents("-S$5", opts)).toEqual({ ok: true, cents: -500 });
    expect(parseDollarsToCents("S$-5", opts)).toEqual({ ok: true, cents: -500 });
    expect(parseDollarsToCents("$-5.25", opts)).toEqual({ ok: true, cents: -525 });
    expect(parseDollarsToCents("S$-5")).toEqual({ ok: false });
    expect(parseDollarsToCents("-S$-5", opts)).toEqual({ ok: false });
  });
});
