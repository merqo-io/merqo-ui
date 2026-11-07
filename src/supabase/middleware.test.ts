import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type SetAll = (c: { name: string; value: string; options?: object }[]) => void;
type SsrOptions = { cookies: { getAll(): unknown; setAll: SetAll }; db?: unknown; cookieOptions?: unknown };

const { getUser, createServerClient, state } = vi.hoisted(() => {
  const state: { captured?: SsrOptions } = {};
  const getUser = vi.fn();
  const createServerClient = vi.fn((_u: string, _k: string, opts: SsrOptions) => {
    state.captured = opts;
    return { auth: { getUser } };
  });
  return { getUser, createServerClient, state };
});
vi.mock("@supabase/ssr", () => ({ createServerClient }));

import { updateSupabaseSession, type UpdateSessionOptions } from "./middleware";

const base: UpdateSessionOptions = {
  url: "u",
  publishableKey: "pk",
  schema: "qkit",
  protectedPrefixes: ["/dashboard", "/admin"],
};

function req(path: string, cookie?: string) {
  return new NextRequest(`https://kit.example${path}`, cookie ? { headers: { cookie } } : undefined);
}

describe("updateSupabaseSession", () => {
  beforeEach(() => {
    getUser.mockReset();
    createServerClient.mockClear();
    state.captured = undefined;
  });

  it("skips the auth call on public paths by default", async () => {
    const res = await updateSupabaseSession(req("/o/menu"), base);
    expect(getUser).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(state.captured?.db).toEqual({ schema: "qkit" });
  });

  it("lets a signed-in user through a protected path", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const res = await updateSupabaseSession(req("/dashboard/orders"), base);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects an anonymous visitor to the login path", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await updateSupabaseSession(req("/admin/x"), { ...base, loginPath: "/sign-in" });
    expect(new URL(res.headers.get("location") ?? "").pathname).toBe("/sign-in");
  });

  it("defaults the login path to /login", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await updateSupabaseSession(req("/dashboard"), base);
    expect(new URL(res.headers.get("location") ?? "").pathname).toBe("/login");
  });

  it("treats a getUser error as signed out", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "stale" } }, error: { message: "jwt" } });
    const res = await updateSupabaseSession(req("/dashboard"), base);
    expect(res.headers.get("location")).not.toBeNull();
  });

  it("degrades to signed out when auth is unreachable", async () => {
    getUser.mockRejectedValue(new Error("offline"));
    const res = await updateSupabaseSession(req("/dashboard"), base);
    expect(res.headers.get("location")).not.toBeNull();
  });

  it("refreshes the session on public paths without gating them when asked", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await updateSupabaseSession(req("/"), { ...base, refreshPublicRoutes: true });
    expect(getUser).toHaveBeenCalledOnce();
    expect(res.headers.get("location")).toBeNull();
  });

  it("copies refreshed cookies onto the response", async () => {
    getUser.mockImplementation(async () => {
      state.captured?.cookies.setAll([{ name: "sb-x-auth-token", value: "new", options: { path: "/" } }]);
      return { data: { user: { id: "u1" } }, error: null };
    });
    const res = await updateSupabaseSession(req("/dashboard"), base);
    expect(res.cookies.get("sb-x-auth-token")?.value).toBe("new");
  });

  it("expires a duplicated host-only auth cookie when a shared domain is set", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const res = await updateSupabaseSession(
      req("/dashboard", "sb-x-auth-token=a; sb-x-auth-token=b; other=1"),
      { ...base, cookieDomain: ".merqo.io" },
    );
    expect(res.cookies.get("sb-x-auth-token")?.value).toBe("");
    expect(state.captured?.cookieOptions).toEqual({ domain: ".merqo.io" });
  });

  it("clears duplicates on public and redirect responses too", async () => {
    const dup = "sb-x-auth-token=a; sb-x-auth-token=b";
    const pub = await updateSupabaseSession(req("/", dup), { ...base, cookieDomain: ".merqo.io" });
    expect(pub.cookies.get("sb-x-auth-token")?.value).toBe("");

    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const redirect = await updateSupabaseSession(req("/dashboard", dup), {
      ...base,
      cookieDomain: ".merqo.io",
    });
    expect(redirect.cookies.get("sb-x-auth-token")?.value).toBe("");
  });

  it("does not clear a cookie it just rewrote, nor without a shared domain", async () => {
    getUser.mockImplementation(async () => {
      state.captured?.cookies.setAll([{ name: "sb-x-auth-token", value: "fresh" }]);
      return { data: { user: { id: "u1" } }, error: null };
    });
    const dup = "sb-x-auth-token=a; sb-x-auth-token=b";
    const kept = await updateSupabaseSession(req("/dashboard", dup), {
      ...base,
      cookieDomain: ".merqo.io",
    });
    expect(kept.cookies.get("sb-x-auth-token")?.value).toBe("fresh");

    const noDomain = await updateSupabaseSession(req("/", dup), base);
    expect(noDomain.cookies.get("sb-x-auth-token")).toBeUndefined();
  });

  it("carries a cleared dead session onto the login redirect", async () => {
    getUser.mockImplementation(async () => {
      state.captured?.cookies.setAll([
        { name: "sb-x-auth-token", value: "", options: { path: "/", maxAge: 0 } },
      ]);
      return { data: { user: null }, error: { message: "jwt expired" } };
    });
    const res = await updateSupabaseSession(req("/dashboard", "sb-x-auth-token=dead"), base);
    expect(res.headers.get("location")).not.toBeNull();
    const cleared = res.cookies.get("sb-x-auth-token");
    expect(cleared?.value).toBe("");
    expect(cleared?.maxAge).toBe(0);
  });

  it("omits the schema when none is configured", async () => {
    await updateSupabaseSession(req("/"), { url: "u", publishableKey: "pk", protectedPrefixes: [] });
    expect(state.captured?.db).toBeUndefined();
  });

  it("exposes the request cookies to the Supabase adapter", async () => {
    await updateSupabaseSession(req("/", "a=1"), base);
    expect(state.captured?.cookies.getAll()).toEqual([{ name: "a", value: "1" }]);
  });
});
