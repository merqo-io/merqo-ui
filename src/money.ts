// Pure and directive-free so Server Components can import it.

/**
 * Upper bound for any money amount in cents. It is the largest integer that
 * is still exact in a double, which is what MoneyInput always accepted.
 */
export const MAX_MONEY_CENTS = Number.MAX_SAFE_INTEGER;

function groupThousands(whole: string): string {
  const groups: string[] = [];
  for (let end = whole.length; end > 0; end -= 3) {
    groups.unshift(whole.slice(Math.max(0, end - 3), end));
  }
  return groups.join(",");
}

function splitCents(cents: number): {
  negative: boolean;
  whole: string;
  frac: string;
} {
  const rounded = Math.round(cents);
  const abs = Math.abs(rounded);
  const whole = Math.floor(abs / 100);
  const frac = abs - whole * 100;
  return {
    negative: rounded < 0,
    whole: String(whole),
    frac: String(frac).padStart(2, "0"),
  };
}

export interface FormatMoneyOptions {
  /** Show "S$16" instead of "S$16.00" for whole-dollar amounts. */
  trimWholeDollars?: boolean;
}

/**
 * Formats integer SGD cents for display: 1250 -> "S$12.50", -5 -> "-S$0.05".
 * Always an "S$" prefix and two fraction digits, with thousands separators.
 * Non-finite input renders as "-" rather than throwing during render.
 */
export function formatMoney(
  cents: number,
  options: FormatMoneyOptions = {},
): string {
  if (!Number.isFinite(cents)) return "-";
  const { negative, whole, frac } = splitCents(cents);
  const fraction = options.trimWholeDollars && frac === "00" ? "" : `.${frac}`;
  return `${negative ? "-" : ""}S$${groupThousands(whole)}${fraction}`;
}

/** 650 -> "6.50". Plain digits for an input value: no symbol, no grouping. */
export function centsToDollarString(cents: number): string {
  const { negative, whole, frac } = splitCents(cents);
  return `${negative ? "-" : ""}${whole}.${frac}`;
}

export interface ParseMoneyOptions {
  allowNegative?: boolean;
}

export type ParsedMoney =
  | { ok: true; cents: number | undefined }
  | { ok: false };

const DECIMAL = /^(\d*)(?:\.(\d*))?$/;

function stringToCents(raw: string, allowNegative: boolean): number | null {
  let text = raw.trim();
  let negative = false;
  if (text.startsWith("-")) {
    if (!allowNegative) return null;
    negative = true;
    text = text.slice(1);
  }
  text = text.replace(/^S?\$/i, "");
  // Comma grouping is only valid in strict 3-digit groups ("1,234.50").
  if (text.includes(",")) {
    if (!/^\d{1,3}(,\d{3})+(\.\d*)?$/.test(text)) return null;
    text = text.replace(/,/g, "");
  }
  const match = DECIMAL.exec(text);
  if (!match) return null;
  const whole = match[1] ?? "";
  const frac = match[2] ?? "";
  if (whole === "" && frac === "") return null;
  // Round on the decimal digits, not on value * 100, which is wrong for
  // inputs such as 1.005 in binary floating point.
  const padded = `${frac}000`;
  let cents = Number(whole || "0") * 100 + Number(padded.slice(0, 2));
  if (Number(padded[2]) >= 5) cents += 1;
  return negative ? -cents : cents;
}

/**
 * Parses a dollar amount typed by a vendor (string, including FormData
 * values) or held as a number into integer cents. Blank input is a valid
 * "unset" (`cents: undefined`); anything unparseable, negative (unless
 * allowed) or above MAX_MONEY_CENTS is `{ ok: false }`.
 */
export function parseDollarsToCents(
  input: string | number,
  options: ParseMoneyOptions = {},
): ParsedMoney {
  const allowNegative = options.allowNegative ?? false;
  let text: string;
  if (typeof input === "number") {
    if (!Number.isFinite(input)) return { ok: false };
    text = String(input);
  } else {
    text = input;
  }
  if (text.trim() === "") return { ok: true, cents: undefined };
  const cents = stringToCents(text, allowNegative);
  if (cents === null || !Number.isSafeInteger(cents)) return { ok: false };
  if (Math.abs(cents) > MAX_MONEY_CENTS) return { ok: false };
  return { ok: true, cents };
}

/** Like parseDollarsToCents, but collapses blank and invalid input to null. */
export function dollarsToCents(
  input: string | number,
  options?: ParseMoneyOptions,
): number | null {
  const parsed = parseDollarsToCents(input, options);
  return parsed.ok && parsed.cents !== undefined ? parsed.cents : null;
}
