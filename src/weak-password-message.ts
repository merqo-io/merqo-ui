export type WeakPasswordReason = "length" | "characters" | "pwned";

const KNOWN_REASONS: readonly string[] = ["length", "characters", "pwned"];

// Supabase lists the required character sets in its message; matching each
// set lets the copy name only the classes that apply.
const CLASS_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/abcdefghijklmnopqrstuvwxyz/, "a lowercase letter"],
  [/ABCDEFGHIJKLMNOPQRSTUVWXYZ/, "an uppercase letter"],
  [/0123456789/, "a number"],
  [/!@#/, "a symbol"],
];

const PWNED_SENTENCE = "This password has appeared in a data breach. Choose a different one.";
const GENERIC_SENTENCE = "That password is too weak. Choose a longer, less common one.";

/** Reads Supabase's `reasons` off an auth error without trusting its shape. */
export function errorReasons(error: unknown): string[] | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const { reasons } = error as Record<string, unknown>;
  if (!Array.isArray(reasons)) return undefined;
  return reasons.filter((r): r is string => typeof r === "string");
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function lengthSentence(message: string): string {
  const match = /at least (\d+) characters/i.exec(message);
  return match
    ? `Password is too short. Use at least ${match[1]} characters.`
    : "Password is too short. Use a longer one.";
}

function charactersSentence(message: string): string {
  const classes = CLASS_PATTERNS.filter(([pattern]) => pattern.test(message)).map(
    ([, name]) => name,
  );
  return classes.length > 0
    ? `Password must include ${joinList(classes)}.`
    : "Password needs a wider mix of characters, such as upper and lower case letters, numbers and symbols.";
}

function knownReasons(
  reasons: readonly string[] | undefined,
  message: string,
): WeakPasswordReason[] {
  const known = (reasons ?? []).filter((r): r is WeakPasswordReason => KNOWN_REASONS.includes(r));
  if (known.length > 0) return known;
  const inferred: WeakPasswordReason[] = [];
  if (/at least \d+ characters/i.test(message)) inferred.push("length");
  if (/contain at least one character/i.test(message)) inferred.push("characters");
  return inferred;
}

/**
 * User-facing copy for a Supabase `weak_password` error. Policy numbers come
 * from the server message, never hardcoded, and raw provider text is not echoed.
 */
export function weakPasswordMessage({
  reasons,
  message,
}: {
  reasons?: readonly string[];
  message?: string | null;
}): string {
  const text = message ?? "";
  const found = knownReasons(reasons, text);
  if (found.length === 0) return GENERIC_SENTENCE;
  return found
    .map((reason) => {
      if (reason === "length") return lengthSentence(text);
      if (reason === "characters") return charactersSentence(text);
      return PWNED_SENTENCE;
    })
    .join(" ");
}
