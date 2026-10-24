import { describe, it, expect } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { buildCsp, createNonce, robotsHeaderFor, withNonceCsp } from "./csp";

describe("buildCsp", () => {
  it("allows only the nonce and strict-dynamic for scripts", () => {
    const csp = buildCsp({ nonce: "abc", isDev: false });
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it("keeps style-src unsafe-inline and locks framing, objects and base", () => {
    const csp = buildCsp({ nonce: "abc", isDev: false });
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  it("adds unsafe-eval in dev only", () => {
    expect(buildCsp({ nonce: "abc", isDev: true })).toContain("'unsafe-eval'");
  });

  it("falls back to unsafe-inline scripts without a nonce (static routes)", () => {
    expect(buildCsp({ isDev: false })).toContain("script-src 'self' 'unsafe-inline'");
  });

  it("appends caller sources to their directives", () => {
    const csp = buildCsp({
      nonce: "abc",
      isDev: false,
      connectSrc: ["https://api.example.test"],
      imgSrc: ["https://img.example.test"],
      frameSrc: ["https://frame.example.test"],
      scriptSrc: ["https://js.example.test"],
    });
    expect(csp).toMatch(/connect-src [^;]*https:\/\/api\.example\.test/);
    expect(csp).toMatch(/img-src [^;]*https:\/\/img\.example\.test/);
    expect(csp).toMatch(/frame-src [^;]*https:\/\/frame\.example\.test/);
    expect(csp).toMatch(/script-src [^;]*https:\/\/js\.example\.test/);
  });
});

describe("createNonce", () => {
  it("returns a fresh base64 value each call", () => {
    const a = createNonce();
    expect(a).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(createNonce()).not.toBe(a);
  });
});

describe("robotsHeaderFor", () => {
  it("returns null only for production", () => {
    expect(robotsHeaderFor("production")).toBeNull();
    const noindex = { key: "X-Robots-Tag", value: "noindex, nofollow" };
    expect(robotsHeaderFor("preview")).toEqual(noindex);
    expect(robotsHeaderFor(undefined)).toEqual(noindex);
  });
});

describe("withNonceCsp", () => {
  it("sets the same nonce on x-nonce and both CSP headers", () => {
    const request = new NextRequest("https://example.test/dashboard");
    const response = NextResponse.next();
    const result = withNonceCsp(request, response, { isDev: false });

    expect(result).toBe(response);
    const nonce = request.headers.get("x-nonce");
    expect(nonce).toBeTruthy();
    const csp = response.headers.get("Content-Security-Policy");
    expect(csp).toContain(`'nonce-${nonce}'`);
    expect(request.headers.get("Content-Security-Policy")).toBe(csp);
  });
});
