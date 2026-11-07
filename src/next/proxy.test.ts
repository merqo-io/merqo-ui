import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { THEME_SCRIPT_HASH } from "../security/headers";
import { createProxy } from "./proxy";

const CSP = "Content-Security-Policy";
const url = (path: string) => `https://example.test${path}`;

describe("createProxy", () => {
  it("gives a per-request route a nonce CSP and the theme hash", async () => {
    const updateSession = vi.fn(async () => NextResponse.next());
    const proxy = createProxy({ updateSession, isDev: false, vercelEnv: "production" });
    const request = new NextRequest(url("/dashboard"));
    const response = await proxy(request);

    const nonce = request.headers.get("x-nonce");
    expect(nonce).toBeTruthy();
    const csp = response.headers.get(CSP);
    expect(csp).toContain(`'nonce-${nonce}' 'strict-dynamic'`);
    expect(csp).toContain(THEME_SCRIPT_HASH);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(updateSession).toHaveBeenCalledWith(request);
  });

  it("builds the nonce before updateSession runs", async () => {
    let seen: string | null = null;
    const proxy = createProxy({
      isDev: false,
      updateSession: async (req) => {
        seen = req.headers.get("x-nonce");
        return NextResponse.next();
      },
    });
    await proxy(new NextRequest(url("/login")));
    expect(seen).toBeTruthy();
  });

  it("keeps a static route on the unsafe-inline policy without a nonce", async () => {
    const proxy = createProxy({
      updateSession: async () => NextResponse.next(),
      isDev: false,
      vercelEnv: "production",
    });
    const request = new NextRequest(url("/privacy"));
    const csp = (await proxy(request)).headers.get(CSP);
    expect(request.headers.get("x-nonce")).toBeNull();
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("nonce-");
    expect(csp).not.toContain(THEME_SCRIPT_HASH);
  });

  it("uses the static policy in dev, without frame-ancestors, even on a nonce route", async () => {
    const proxy = createProxy({
      updateSession: async () => NextResponse.next(),
      isDev: true,
    });
    const request = new NextRequest(url("/dashboard"));
    const csp = (await proxy(request)).headers.get(CSP);
    expect(request.headers.get("x-nonce")).toBeNull();
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).not.toContain("frame-ancestors");
  });

  it("honours a kit-specific nonce prefix list", async () => {
    const proxy = createProxy({
      updateSession: async () => NextResponse.next(),
      isDev: false,
      noncePrefixes: ["/orders"],
    });
    const hit = new NextRequest(url("/orders/1"));
    await proxy(hit);
    expect(hit.headers.get("x-nonce")).toBeTruthy();
    const miss = new NextRequest(url("/dashboard"));
    await proxy(miss);
    expect(miss.headers.get("x-nonce")).toBeNull();
  });

  it("passes the Supabase URL through to the CSP", async () => {
    const proxy = createProxy({
      updateSession: async () => NextResponse.next(),
      isDev: false,
      supabaseUrl: "http://127.0.0.1:54321",
    });
    const csp = (await proxy(new NextRequest(url("/privacy")))).headers.get(CSP);
    expect(csp).toContain("ws://127.0.0.1:54321");
  });

  it("marks non-production deployments noindex and leaves production alone", async () => {
    const make = (vercelEnv: string) =>
      createProxy({
        updateSession: async () => NextResponse.next(),
        isDev: false,
        vercelEnv,
      });
    const preview = await make("preview")(new NextRequest(url("/")));
    expect(preview.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    const prod = await make("production")(new NextRequest(url("/")));
    expect(prod.headers.get("X-Robots-Tag")).toBeNull();
  });

  it("reads NODE_ENV and VERCEL_ENV per request when not given", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    try {
      const proxy = createProxy({ updateSession: async () => NextResponse.next() });
      const response = await proxy(new NextRequest(url("/mfa")));
      expect(response.headers.get(CSP)).toContain("'strict-dynamic'");
      expect(response.headers.get("X-Robots-Tag")).toBeNull();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
