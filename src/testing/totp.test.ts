import { describe, expect, it } from "vitest";
import { totpCode } from "./totp";

// RFC 6238 appendix B, SHA-1 seed "12345678901234567890", base32-encoded at
// runtime so no secret-looking literal sits in the source.
function base32Encode(text: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits = [...text]
    .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");
  return (bits.match(/.{1,5}/g) ?? [])
    .map((chunk) => alphabet[Number.parseInt(chunk.padEnd(5, "0"), 2)])
    .join("");
}
const RFC_SECRET = base32Encode("12345678901234567890");

describe("totpCode", () => {
  it.each([
    [59, "287082"],
    [1111111109, "081804"],
    [1111111111, "050471"],
    [1234567890, "005924"],
    [2000000000, "279037"],
  ])("matches the RFC 6238 vector at t=%i", (seconds, expected) => {
    expect(totpCode(RFC_SECRET, seconds * 1000)).toBe(expected);
  });

  it("ignores padding and case in the secret", () => {
    expect(totpCode(`${RFC_SECRET.toLowerCase()}====`, 59_000)).toBe("287082");
  });

  it("accepts an authenticator-style grouped secret", () => {
    const grouped = RFC_SECRET.replace(/(.{4})/g, "$1 ").trim();
    expect(totpCode(grouped, 59_000)).toBe("287082");
    expect(totpCode(RFC_SECRET.replace(/(.{8})/g, "$1-"), 59_000)).toBe("287082");
  });

  it("defaults to the current time", () => {
    expect(totpCode(RFC_SECRET)).toMatch(/^\d{6}$/);
  });

  it("rejects a secret that is not base32", () => {
    expect(() => totpCode("not-base32!")).toThrow("Invalid base32");
  });
});
