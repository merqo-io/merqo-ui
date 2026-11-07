import { describe, it, expect } from "vitest";
import {
  NONCE_PREFIXES,
  THEME_SCRIPT_HASH,
  buildSecurityHeaders,
  needsNonce,
} from "./headers";

describe("needsNonce", () => {
  it.each([
    "/admin",
    "/admin/vendors",
    "/mfa",
    "/dashboard",
    "/dashboard/orders/42",
    "/pay/abc",
    "/inquire",
    "/auth/callback",
    "/login",
    "/reset-password",
    "/legal/accept",
    "/c/shop",
    "/earn",
    "/setup",
    "/profile",
    "/no-access",
    "/post-login",
  ])("nonces the per-request route %s", (pathname) => {
    expect(needsNonce(pathname)).toBe(true);
  });

  it.each([
    "/",
    "/privacy",
    "/legal/terms",
    "/pricing",
    "/contact",
    "/careers",
    "/login-help",
    "/payments",
    "/administrator",
  ])("keeps the static route %s on the static policy", (pathname) => {
    expect(needsNonce(pathname)).toBe(false);
  });

  it("matches whole path segments, so /c does not capture /contact", () => {
    expect(needsNonce("/c")).toBe(true);
    expect(needsNonce("/c/x")).toBe(true);
    expect(needsNonce("/contact")).toBe(false);
  });

  it("accepts a kit-specific prefix list", () => {
    expect(needsNonce("/orders/1", ["/orders"])).toBe(true);
    expect(needsNonce("/dashboard", ["/orders"])).toBe(false);
  });

  it("ships a non-empty default list", () => {
    expect(NONCE_PREFIXES.length).toBeGreaterThan(0);
  });
});

describe("buildSecurityHeaders", () => {
  it("allows the Supabase wildcard hosts and Google avatars", () => {
    const opts = buildSecurityHeaders({ isDev: false, vercelEnv: "production" });
    expect(opts.isDev).toBe(false);
    expect(opts.connectSrc).toEqual([
      "https://*.supabase.co",
      "wss://*.supabase.co",
    ]);
    expect(opts.imgSrc).toEqual([
      "https://*.supabase.co",
      "https://*.googleusercontent.com",
    ]);
    expect(opts.frameSrc).toEqual([]);
    expect(opts.scriptSrc).toEqual([]);
  });

  it("adds the configured project origin and its websocket twin", () => {
    const opts = buildSecurityHeaders({
      isDev: false,
      vercelEnv: "production",
      supabaseUrl: "http://127.0.0.1:54321/rest",
    });
    expect(opts.connectSrc).toContain("http://127.0.0.1:54321");
    expect(opts.connectSrc).toContain("ws://127.0.0.1:54321");
    expect(opts.imgSrc).toContain("http://127.0.0.1:54321");
  });

  it("ignores a missing or malformed Supabase URL", () => {
    const a = buildSecurityHeaders({ isDev: false, supabaseUrl: "nope" });
    const b = buildSecurityHeaders({ isDev: false });
    expect(a.connectSrc).toEqual(b.connectSrc);
    expect(a.connectSrc).not.toContain("nope");
  });

  it("allows the Vercel toolbar everywhere except production", () => {
    const preview = buildSecurityHeaders({ isDev: false, vercelEnv: "preview" });
    expect(preview.connectSrc).toContain("https://vercel.live");
    expect(preview.imgSrc).toContain("https://vercel.live");
    expect(preview.frameSrc).toEqual(["https://vercel.live"]);
    expect(preview.scriptSrc).toEqual(["https://vercel.live"]);
    const local = buildSecurityHeaders({ isDev: true });
    expect(local.frameSrc).toEqual(["https://vercel.live"]);
  });

  it("adds the next-themes script hash only for nonce routes", () => {
    const base = buildSecurityHeaders({ isDev: false, vercelEnv: "production" });
    expect(base.scriptSrc).not.toContain(THEME_SCRIPT_HASH);
    const nonce = buildSecurityHeaders({
      isDev: false,
      vercelEnv: "production",
      nonce: true,
    });
    expect(nonce.scriptSrc).toEqual([THEME_SCRIPT_HASH]);
  });

  it("lets a kit override or drop the theme hash", () => {
    const custom = buildSecurityHeaders({
      isDev: false,
      nonce: true,
      themeScriptHash: "'sha256-x'",
    });
    expect(custom.scriptSrc).toContain("'sha256-x'");
    const none = buildSecurityHeaders({
      isDev: false,
      vercelEnv: "production",
      nonce: true,
      themeScriptHash: null,
    });
    expect(none.scriptSrc).toEqual([]);
  });

  it("pins the theme hash value", () => {
    expect(THEME_SCRIPT_HASH).toBe(
      "'sha256-n46vPwSWuMC0W703pBofImv82Z26xo4LXymv0E9caPk='",
    );
  });
});
