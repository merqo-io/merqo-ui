import { describe, it, expect, vi } from "vitest";
import {
  AUTH_CONFIRM_TYPES,
  authConfirmForwardUrl,
  handleAuthConfirm,
  isAuthConfirmType,
  readAuthConfirmParams,
  type AuthConfirmClient,
} from "./confirm";

const ORIGIN = "https://kit.example";

function clientWith(result: { data?: unknown; error?: unknown } = {}) {
  const verifyOtp = vi
    .fn()
    .mockResolvedValue({ data: result.data ?? {}, error: result.error ?? null });
  const client: AuthConfirmClient = { auth: { verifyOtp } };
  return { client, verifyOtp };
}

function post(
  fields: Record<string, string>,
  headers: Record<string, string> = { origin: ORIGIN },
  method = "POST",
) {
  const body = method === "GET" ? undefined : new URLSearchParams(fields);
  return new Request(`${ORIGIN}/auth/confirm/verify`, { method, body, headers });
}

const GOOD = { token_hash: "abc", type: "magiclink" };

async function run(
  request: Request,
  extra: Partial<Parameters<typeof handleAuthConfirm>[1]> = {},
  client = clientWith().client,
) {
  return handleAuthConfirm(request, {
    createClient: async () => client,
    defaultNext: "/dashboard",
    ...extra,
  } as Parameters<typeof handleAuthConfirm>[1]);
}

describe("handleAuthConfirm", () => {
  it.each(AUTH_CONFIRM_TYPES.filter((t) => t !== "recovery"))(
    "verifies a %s token and lands on the default target with a 303",
    async (type) => {
      const { client, verifyOtp } = clientWith();
      const res = await run(post({ token_hash: "abc", type }), {}, client);
      expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "abc", type });
      expect(res.status).toBe(303);
      expect(res.headers.get("location")).toBe(`${ORIGIN}/dashboard`);
    },
  );

  it("honours a same-origin next path", async () => {
    const res = await run(post({ ...GOOD, next: "/reset-password" }));
    expect(res.headers.get("location")).toBe(`${ORIGIN}/reset-password`);
  });

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "/\t/evil.example", ""])(
    "falls back to defaultNext for next %j",
    async (next) => {
      const res = await run(post({ ...GOOD, next }));
      expect(res.headers.get("location")).toBe(`${ORIGIN}/dashboard`);
    },
  );

  it("sends a recovery token to recovery.path and runs onRecovery", async () => {
    const { client } = clientWith({ data: { session: 1 } });
    const onRecovery = vi.fn(async ({ response }) => {
      response.cookies.set("rec", "1");
    });
    const res = await run(
      post({ token_hash: "abc", type: "recovery", next: "/elsewhere" }),
      { recovery: { path: "/reset-password", onRecovery } },
      client,
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`${ORIGIN}/reset-password`);
    expect(res.cookies.get("rec")?.value).toBe("1");
    expect(onRecovery).toHaveBeenCalledWith(
      expect.objectContaining({ supabase: client, data: { session: 1 } }),
    );
  });

  it("uses next for recovery when no recovery option is set", async () => {
    const res = await run(post({ token_hash: "abc", type: "recovery", next: "/reset-password" }));
    expect(res.headers.get("location")).toBe(`${ORIGIN}/reset-password`);
  });

  it("fails when onRecovery throws", async () => {
    const res = await run(post({ token_hash: "abc", type: "recovery" }), {
      recovery: {
        path: "/reset-password",
        onRecovery: async () => {
          throw new Error("boom");
        },
      },
    });
    expect(res.headers.get("location")).toBe(`${ORIGIN}/login?error=link`);
  });

  it("runs afterSignIn after verifying and fails when it throws, as the callback does", async () => {
    const { client, verifyOtp } = clientWith();
    const afterSignIn = vi.fn().mockRejectedValue(new Error("boom"));
    const res = await run(post(GOOD), { afterSignIn }, client);
    expect(verifyOtp).toHaveBeenCalled();
    expect(afterSignIn).toHaveBeenCalledWith(client);
    expect(res.headers.get("location")).toBe(`${ORIGIN}/login?error=link`);
  });

  it("uses a custom loginPath for failures", async () => {
    const res = await run(post({ token_hash: "", type: "magiclink" }), { loginPath: "/signin" });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`${ORIGIN}/signin?error=link`);
  });

  describe("rejections", () => {
    async function expectFailure(request: Request, client = clientWith()) {
      const res = await run(request, {}, client.client);
      expect(res.status).toBe(303);
      expect(res.headers.get("location")).toBe(`${ORIGIN}/login?error=link`);
      expect(client.verifyOtp).not.toHaveBeenCalled();
    }

    it("rejects a non-POST", async () => {
      await expectFailure(post(GOOD, { origin: ORIGIN }, "GET"));
    });
    it("rejects a missing token_hash", async () => {
      await expectFailure(post({ type: "magiclink" }));
    });
    it("rejects an empty token_hash", async () => {
      await expectFailure(post({ token_hash: "", type: "magiclink" }));
    });
    it("rejects a token_hash over 512 characters", async () => {
      await expectFailure(post({ token_hash: "a".repeat(513), type: "magiclink" }));
    });
    it("accepts a token_hash of exactly 512 characters", async () => {
      const { client, verifyOtp } = clientWith();
      await run(post({ token_hash: "a".repeat(512), type: "magiclink" }), {}, client);
      expect(verifyOtp).toHaveBeenCalled();
    });
    it("rejects an unknown type", async () => {
      await expectFailure(post({ token_hash: "abc", type: "admin" }));
    });
    it("rejects a missing type", async () => {
      await expectFailure(post({ token_hash: "abc" }));
    });
    it("rejects a body that is not a form", async () => {
      const request = new Request(`${ORIGIN}/auth/confirm/verify`, {
        method: "POST",
        body: "x",
        headers: { origin: ORIGIN, "content-type": "application/json" },
      });
      await expectFailure(request);
    });
  });

  it("fails when verifyOtp returns an error", async () => {
    const res = await run(post(GOOD), {}, clientWith({ error: { message: "expired" } }).client);
    expect(res.headers.get("location")).toBe(`${ORIGIN}/login?error=link`);
  });

  it("fails when verifyOtp throws or createClient rejects", async () => {
    const throwing: AuthConfirmClient = {
      auth: { verifyOtp: vi.fn().mockRejectedValue(new Error("net")) },
    };
    expect((await run(post(GOOD), {}, throwing)).headers.get("location")).toBe(
      `${ORIGIN}/login?error=link`,
    );
    const res = await handleAuthConfirm(post(GOOD), {
      createClient: async () => {
        throw new Error("cfg");
      },
      defaultNext: "/dashboard",
    });
    expect(res.headers.get("location")).toBe(`${ORIGIN}/login?error=link`);
  });

  it("never puts the token in the redirect", async () => {
    const res = await run(post({ ...GOOD, token_hash: "secret-hash" }));
    expect(res.headers.get("location")).not.toContain("secret-hash");
  });

  describe("origin rule", () => {
    it("accepts a matching Origin", async () => {
      const { client, verifyOtp } = clientWith();
      await run(post(GOOD, { origin: ORIGIN }), {}, client);
      expect(verifyOtp).toHaveBeenCalled();
    });

    it("accepts same-origin Sec-Fetch-Site when Origin is absent", async () => {
      const { client, verifyOtp } = clientWith();
      await run(post(GOOD, { "sec-fetch-site": "same-origin" }), {}, client);
      expect(verifyOtp).toHaveBeenCalled();
    });

    it("accepts a null Origin with same-origin Sec-Fetch-Site", async () => {
      const { client, verifyOtp } = clientWith();
      await run(post(GOOD, { origin: "null", "sec-fetch-site": "same-origin" }), {}, client);
      expect(verifyOtp).toHaveBeenCalled();
    });

    it.each([
      ["a different Origin", { origin: "https://evil.example" }],
      ["a different Origin even with same-origin Sec-Fetch-Site", {
        origin: "https://evil.example",
        "sec-fetch-site": "same-origin",
      }],
      ["a sibling subdomain Origin", { origin: "https://a.kit.example" }],
      ["a null Origin with cross-site Sec-Fetch-Site", { origin: "null", "sec-fetch-site": "cross-site" }],
      ["a null Origin without Sec-Fetch-Site", { origin: "null" }],
      ["cross-site Sec-Fetch-Site without Origin", { "sec-fetch-site": "cross-site" }],
      ["same-site Sec-Fetch-Site without Origin", { "sec-fetch-site": "same-site" }],
      ["none Sec-Fetch-Site without Origin", { "sec-fetch-site": "none" }],
      ["neither header", {}],
    ])("rejects %s", async (_label, headers) => {
      const { client, verifyOtp } = clientWith();
      const res = await run(post(GOOD, headers), {}, client);
      expect(verifyOtp).not.toHaveBeenCalled();
      expect(res.headers.get("location")).toBe(`${ORIGIN}/login?error=link`);
    });
  });
});

describe("isAuthConfirmType", () => {
  it("accepts the six types and nothing else", () => {
    for (const type of AUTH_CONFIRM_TYPES) expect(isAuthConfirmType(type)).toBe(true);
    expect(AUTH_CONFIRM_TYPES).toHaveLength(6);
    for (const bad of ["", "Recovery", "admin", null, undefined, 1]) {
      expect(isAuthConfirmType(bad)).toBe(false);
    }
  });
});

describe("readAuthConfirmParams", () => {
  it("reads a Next searchParams object", () => {
    expect(readAuthConfirmParams({ token_hash: "abc", type: "invite", next: "/x" })).toEqual({
      tokenHash: "abc",
      type: "invite",
      next: "/x",
    });
  });

  it.each([
    [{ token_hash: ["a", "b"], type: "invite" }],
    [{ token_hash: "a", type: ["invite", "signup"] }],
    [{ token_hash: undefined, type: "invite" }],
  ])("returns null for object %j", (input) => {
    expect(readAuthConfirmParams(input)).toBeNull();
  });

  it("returns null for repeated token_hash or type in a query string", () => {
    expect(readAuthConfirmParams(new URLSearchParams("token_hash=a&token_hash=b&type=signup"))).toBeNull();
    expect(readAuthConfirmParams(new URLSearchParams("token_hash=a&type=signup&type=invite"))).toBeNull();
  });

  it("treats a repeated next as absent", () => {
    expect(readAuthConfirmParams(new URLSearchParams("token_hash=a&type=signup&next=/a&next=/b"))?.next).toBeNull();
    expect(readAuthConfirmParams({ token_hash: "a", type: "signup", next: ["/a", "/b"] })?.next).toBeNull();
  });

  it("returns the validated params", () => {
    expect(
      readAuthConfirmParams(new URLSearchParams("token_hash=abc&type=recovery&next=/x")),
    ).toEqual({ tokenHash: "abc", type: "recovery", next: "/x" });
  });

  it("returns a null next when absent", () => {
    expect(readAuthConfirmParams(new URLSearchParams("token_hash=abc&type=signup"))?.next).toBeNull();
  });

  it.each([
    "type=signup",
    "token_hash=&type=signup",
    `token_hash=${"a".repeat(513)}&type=signup`,
    "token_hash=abc",
    "token_hash=abc&type=nope",
  ])("returns null for %s", (query) => {
    expect(readAuthConfirmParams(new URLSearchParams(query))).toBeNull();
  });
});

describe("authConfirmForwardUrl", () => {
  const options = {
    allowedOrigins: ["https://qkit.merqo.io", "https://paykit.merqo.io", "http://localhost:3001"],
    selfOrigin: "https://merqo.io",
  };
  const base = "https://merqo.io/auth/confirm?token_hash=abc&type=recovery";
  const withRedirect = (redirect: string) => `${base}&redirect_to=${encodeURIComponent(redirect)}`;

  it("forwards to an allowlisted kit and carries next from redirect_to", () => {
    const url = authConfirmForwardUrl(
      withRedirect("https://qkit.merqo.io/auth/callback?next=/reset-password"),
      options,
    );
    expect(url).toBe(
      "https://qkit.merqo.io/auth/confirm?token_hash=abc&type=recovery&next=%2Freset-password",
    );
  });

  it("forwards without next when redirect_to has none, ignoring its path", () => {
    expect(authConfirmForwardUrl(withRedirect("https://paykit.merqo.io/anything"), options)).toBe(
      "https://paykit.merqo.io/auth/confirm?token_hash=abc&type=recovery",
    );
  });

  it("accepts a URL object", () => {
    expect(
      authConfirmForwardUrl(new URL(withRedirect("https://qkit.merqo.io/")), options),
    ).toContain("https://qkit.merqo.io/auth/confirm?");
  });

  it("allows http for localhost only when allowlisted", () => {
    expect(authConfirmForwardUrl(withRedirect("http://localhost:3001/x"), options)).toBe(
      "http://localhost:3001/auth/confirm?token_hash=abc&type=recovery",
    );
    expect(authConfirmForwardUrl(withRedirect("http://localhost:9/x"), options)).toBeNull();
  });

  it("normalises a mixed case host to the allowlisted origin", () => {
    expect(authConfirmForwardUrl(withRedirect("https://QKit.Merqo.IO/x"), options)).toBe(
      "https://qkit.merqo.io/auth/confirm?token_hash=abc&type=recovery",
    );
  });

  it.each([
    "https://evil.com",
    "https://qkit.merqo.io.evil.com",
    "https://qkit.merqo.io@evil.com",
    "https://user:pw@qkit.merqo.io",
    "https://evil.com@qkit.merqo.io",
    "//evil.com",
    "//qkit.merqo.io",
    "/auth/callback",
    "javascript:alert(1)",
    "https:\\\\evil.com",
    "https://qkit.merqo.io.",
    "https://qkit.merqo.io:8443",
    "http://qkit.merqo.io",
    "ftp://qkit.merqo.io",
    "not a url",
    "",
  ])("returns null for redirect_to %j", (redirect) => {
    expect(authConfirmForwardUrl(withRedirect(redirect), options)).toBeNull();
  });

  it("treats a backslash as a path separator, so the host stays the allowlisted one", () => {
    expect(authConfirmForwardUrl(withRedirect("https://qkit.merqo.io\\@evil.com"), options)).toBe(
      "https://qkit.merqo.io/auth/confirm?token_hash=abc&type=recovery",
    );
  });

  it("returns null for selfOrigin", () => {
    expect(authConfirmForwardUrl(withRedirect("https://merqo.io/auth/callback"), options)).toBeNull();
  });

  it("returns null when redirect_to is absent", () => {
    expect(authConfirmForwardUrl(base, options)).toBeNull();
  });

  it.each([
    "https://merqo.io/auth/confirm?type=recovery",
    "https://merqo.io/auth/confirm?token_hash=abc",
    "https://merqo.io/auth/confirm?token_hash=abc&type=bogus",
    `https://merqo.io/auth/confirm?token_hash=${"a".repeat(513)}&type=recovery`,
  ])("returns null for invalid token params %s", (url) => {
    expect(
      authConfirmForwardUrl(`${url}&redirect_to=${encodeURIComponent("https://qkit.merqo.io")}`, options),
    ).toBeNull();
  });

  it("accepts a searchParams object and URLSearchParams", () => {
    const query = { token_hash: "abc", type: "recovery", redirect_to: "https://qkit.merqo.io/auth/callback?next=/reset-password" };
    const expected = "https://qkit.merqo.io/auth/confirm?token_hash=abc&type=recovery&next=%2Freset-password";
    expect(authConfirmForwardUrl(query, options)).toBe(expected);
    expect(authConfirmForwardUrl(new URLSearchParams(query), options)).toBe(expected);
  });

  it("returns null for a repeated redirect_to", () => {
    expect(
      authConfirmForwardUrl(
        { token_hash: "abc", type: "recovery", redirect_to: ["https://qkit.merqo.io", "https://paykit.merqo.io"] },
        options,
      ),
    ).toBeNull();
  });

  it("normalises allowedOrigins and selfOrigin entries before comparing", () => {
    const url = withRedirect("https://qkit.merqo.io/x");
    const expected = "https://qkit.merqo.io/auth/confirm?token_hash=abc&type=recovery";
    const self = "https://merqo.io";
    expect(authConfirmForwardUrl(url, { selfOrigin: self, allowedOrigins: ["https://qkit.merqo.io/"] })).toBe(expected);
    expect(authConfirmForwardUrl(url, { selfOrigin: self, allowedOrigins: ["https://QKIT.merqo.io"] })).toBe(expected);
    expect(authConfirmForwardUrl(url, { selfOrigin: self, allowedOrigins: ["https://qkit.merqo.io:443"] })).toBe(expected);
    expect(authConfirmForwardUrl(url, { selfOrigin: self, allowedOrigins: ["::bad::", "https://qkit.merqo.io"] })).toBe(expected);
    expect(authConfirmForwardUrl(url, { selfOrigin: self, allowedOrigins: ["::bad::"] })).toBeNull();
    expect(authConfirmForwardUrl(url, { selfOrigin: "https://QKit.merqo.io/", allowedOrigins: ["https://qkit.merqo.io"] })).toBeNull();
  });

  it("returns null for an unparsable request URL", () => {
    expect(authConfirmForwardUrl("not a url", options)).toBeNull();
  });
});
