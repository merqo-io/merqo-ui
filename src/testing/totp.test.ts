import { describe, expect, it } from "vitest";
import { totpCode } from "./totp";

// RFC 6238 appendix B, SHA-1 secret "12345678901234567890" in base32.
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

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

  it("defaults to the current time", () => {
    expect(totpCode(RFC_SECRET)).toMatch(/^\d{6}$/);
  });

  it("rejects a secret that is not base32", () => {
    expect(() => totpCode("not-base32!")).toThrow("Invalid base32");
  });
});
