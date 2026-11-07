import { describe, it, expect, vi } from "vitest";
import { handleAuthCallback, type AuthCallbackClient } from "./callback";

const ORIGIN = "https://kit.example";

function clientWith(result: { data?: unknown; error?: unknown }) {
  const exchangeCodeForSession = vi
    .fn()
    .mockResolvedValue({ data: result.data ?? {}, error: result.error ?? null });
  const client: AuthCallbackClient = { auth: { exchangeCodeForSession } };
  return { client, exchangeCodeForSession };
}

function req(query: string, headers?: Record<string, string>) {
  return new Request(`${ORIGIN}/auth/callback${query}`, { headers });
}

describe("handleAuthCallback", () => {
  it("exchanges the code and lands on the default target", async () => {
    const { client, exchangeCodeForSession } = clientWith({});
    const res = await handleAuthCallback(req("?code=abc"), {
      createClient: async () => client,
      defaultNext: "/dashboard",
    });
    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(res.headers.get("location")).toBe(`${ORIGIN}/dashboard`);
  });

  it("honours a same-origin next path", async () => {
    const { client } = clientWith({});
    const res = await handleAuthCallback(req("?code=abc&next=/reset-password"), {
      createClient: async () => client,
      defaultNext: "/dashboard",
    });
    expect(res.headers.get("location")).toBe(`${ORIGIN}/reset-password`);
  });

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "/%09/x", "/\t/evil.example"])(
    "rejects the open-redirect next %j",
    async (next) => {
      const { client } = clientWith({});
      const res = await handleAuthCallback(req(`?code=abc&next=${encodeURIComponent(next)}`), {
        createClient: async () => client,
        defaultNext: "/post-login",
      });
      const location = res.headers.get("location") ?? "";
      expect(location.startsWith(`${ORIGIN}/`)).toBe(true);
      expect(location).not.toContain("evil.example");
    },
  );

  it("redirects to the login error when the code is missing", async () => {
    const createClient = vi.fn();
    const res = await handleAuthCallback(req(""), { createClient, defaultNext: "/dashboard" });
    expect(createClient).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe(`${ORIGIN}/login?error=oauth`);
  });

  it("redirects to the login error when the exchange fails", async () => {
    const { client } = clientWith({ error: { message: "bad code" } });
    const res = await handleAuthCallback(req("?code=abc"), {
      createClient: async () => client,
      defaultNext: "/dashboard",
      loginPath: "/sign-in",
    });
    expect(res.headers.get("location")).toBe(`${ORIGIN}/sign-in?error=oauth`);
  });

  it("treats a thrown exchange as a failure", async () => {
    const res = await handleAuthCallback(req("?code=abc"), {
      createClient: async () => {
        throw new Error("cookies unavailable");
      },
      defaultNext: "/dashboard",
    });
    expect(res.headers.get("location")).toBe(`${ORIGIN}/login?error=oauth`);
  });

  it("runs afterSignIn on success and fails when it throws", async () => {
    const { client } = clientWith({});
    const afterSignIn = vi.fn().mockResolvedValue(undefined);
    const ok = await handleAuthCallback(req("?code=abc"), {
      createClient: async () => client,
      defaultNext: "/dashboard",
      afterSignIn,
    });
    expect(afterSignIn).toHaveBeenCalledWith(client);
    expect(ok.headers.get("location")).toBe(`${ORIGIN}/dashboard`);

    const bad = await handleAuthCallback(req("?code=abc"), {
      createClient: async () => client,
      defaultNext: "/dashboard",
      afterSignIn: async () => {
        throw new Error("row insert failed");
      },
    });
    expect(bad.headers.get("location")).toBe(`${ORIGIN}/login?error=oauth`);
  });

  describe("nextCookie", () => {
    const nextCookie = { name: "kit_next", path: "/auth/callback" };

    it("falls back to the cookie when the query has no next, and clears it", async () => {
      const { client } = clientWith({});
      const res = await handleAuthCallback(
        req("?code=abc", { cookie: `a=b; kit_next=${encodeURIComponent("/dashboard/orders")}` }),
        { createClient: async () => client, defaultNext: "/dashboard", nextCookie },
      );
      expect(res.headers.get("location")).toBe(`${ORIGIN}/dashboard/orders`);
      expect(res.headers.get("set-cookie")).toContain("kit_next=;");
    });

    it("prefers the query next over the cookie", async () => {
      const { client } = clientWith({});
      const res = await handleAuthCallback(
        req("?code=abc&next=/from-query", { cookie: "kit_next=%2Ffrom-cookie" }),
        { createClient: async () => client, defaultNext: "/dashboard", nextCookie },
      );
      expect(res.headers.get("location")).toBe(`${ORIGIN}/from-query`);
    });

    it("validates the cookie value like the query value", async () => {
      const { client } = clientWith({});
      const res = await handleAuthCallback(
        req("?code=abc", { cookie: `kit_next=${encodeURIComponent("//evil.example")}` }),
        { createClient: async () => client, defaultNext: "/dashboard", nextCookie },
      );
      expect(res.headers.get("location")).toBe(`${ORIGIN}/dashboard`);
    });

    it("ignores a malformed cookie and clears it on failure too", async () => {
      const { client } = clientWith({ error: { message: "x" } });
      const res = await handleAuthCallback(req("?code=abc", { cookie: "kit_next=%E0%A4%A" }), {
        createClient: async () => client,
        defaultNext: "/dashboard",
        nextCookie,
      });
      expect(res.headers.get("location")).toBe(`${ORIGIN}/login?error=oauth`);
      expect(res.headers.get("set-cookie")).toContain("kit_next=;");

      const { client: ok } = clientWith({});
      const res2 = await handleAuthCallback(req("?code=abc", { cookie: "kit_next=%E0%A4%A" }), {
        createClient: async () => ok,
        defaultNext: "/dashboard",
        nextCookie,
      });
      expect(res2.headers.get("location")).toBe(`${ORIGIN}/dashboard`);
    });

    it("uses the default when the cookie is absent", async () => {
      const { client } = clientWith({});
      const res = await handleAuthCallback(req("?code=abc", { cookie: "other=1" }), {
        createClient: async () => client,
        defaultNext: "/dashboard",
        nextCookie,
      });
      expect(res.headers.get("location")).toBe(`${ORIGIN}/dashboard`);
    });
  });

  describe("recovery", () => {
    it("sends a recovery exchange to the reset page and runs onRecovery", async () => {
      const { client } = clientWith({ data: { redirectType: "recovery", session: { x: 1 } } });
      const onRecovery = vi.fn(async ({ response }) => {
        response.cookies.set("window", "1");
      });
      const res = await handleAuthCallback(req("?code=abc&next=/dashboard"), {
        createClient: async () => client,
        defaultNext: "/dashboard",
        recovery: { path: "/reset-password", onRecovery },
      });
      expect(res.headers.get("location")).toBe(`${ORIGIN}/reset-password`);
      expect(onRecovery).toHaveBeenCalledOnce();
      expect(res.headers.get("set-cookie")).toContain("window=1");
    });

    it("sends a recovery exchange to the reset page without a hook", async () => {
      const { client } = clientWith({ data: { redirectType: "recovery" } });
      const res = await handleAuthCallback(req("?code=abc"), {
        createClient: async () => client,
        defaultNext: "/dashboard",
        recovery: { path: "/reset-password" },
      });
      expect(res.headers.get("location")).toBe(`${ORIGIN}/reset-password`);
    });

    it("returns to next for a non-recovery exchange", async () => {
      const { client } = clientWith({ data: { redirectType: "oauth" } });
      const res = await handleAuthCallback(req("?code=abc&next=/dashboard/x"), {
        createClient: async () => client,
        defaultNext: "/dashboard",
        recovery: { path: "/reset-password" },
      });
      expect(res.headers.get("location")).toBe(`${ORIGIN}/dashboard/x`);
    });

    it("treats a missing data object as a non-recovery exchange", async () => {
      const exchangeCodeForSession = vi.fn().mockResolvedValue({ data: null, error: null });
      const res = await handleAuthCallback(req("?code=abc"), {
        createClient: async () => ({ auth: { exchangeCodeForSession } }),
        defaultNext: "/dashboard",
        recovery: { path: "/reset-password" },
      });
      expect(res.headers.get("location")).toBe(`${ORIGIN}/dashboard`);
    });

    it("fails when onRecovery throws", async () => {
      const { client } = clientWith({ data: { redirectType: "recovery" } });
      const res = await handleAuthCallback(req("?code=abc"), {
        createClient: async () => client,
        defaultNext: "/dashboard",
        recovery: {
          path: "/reset-password",
          onRecovery: async () => {
            throw new Error("claims failed");
          },
        },
      });
      expect(res.headers.get("location")).toBe(`${ORIGIN}/login?error=oauth`);
    });
  });
});
