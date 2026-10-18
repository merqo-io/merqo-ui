import { describe, it, expect } from "vitest";
import { isRedirectError } from "./redirect-error";

const nextRedirect = (digest: string) =>
  Object.assign(new Error("NEXT_REDIRECT"), { digest });

describe("isRedirectError", () => {
  it("is true for the error Next.js redirect() throws", () => {
    expect(isRedirectError(nextRedirect("NEXT_REDIRECT;replace;/login;307;"))).toBe(true);
    expect(isRedirectError(nextRedirect("NEXT_REDIRECT;push;/dashboard;303;"))).toBe(true);
  });

  it("is true for a plain object carrying a redirect digest", () => {
    expect(isRedirectError({ digest: "NEXT_REDIRECT;replace;/login;307;" })).toBe(true);
  });

  it("is false for an ordinary error", () => {
    expect(isRedirectError(new Error("network unreachable"))).toBe(false);
    expect(isRedirectError(new Error("NEXT_REDIRECT"))).toBe(false);
  });

  it("is false for notFound() and other non-redirect digests", () => {
    expect(isRedirectError(nextRedirect("NEXT_HTTP_ERROR_FALLBACK;404"))).toBe(false);
    expect(isRedirectError(nextRedirect("NEXT_NOT_FOUND"))).toBe(false);
    expect(isRedirectError(nextRedirect("1234567890"))).toBe(false);
    expect(isRedirectError(nextRedirect("X-NEXT_REDIRECT;replace;/login;307;"))).toBe(false);
  });

  it("is false for values that are not error objects", () => {
    expect(isRedirectError(null)).toBe(false);
    expect(isRedirectError(undefined)).toBe(false);
    expect(isRedirectError("NEXT_REDIRECT;replace;/login;307;")).toBe(false);
    expect(isRedirectError({ digest: 307 })).toBe(false);
  });
});
