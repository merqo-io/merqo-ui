import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LEGAL_VERSIONS } from "../legal/version";
import { checkLegalAcceptance, type LegalGateClient, type LegalGateOptions } from "./legal-gate";

const NOW = new Date("2026-10-01T12:00:00.000Z");

type Cached = { checked_at: string; is_current: boolean } | null;

function makeClient(cached: Cached, upsert: ReturnType<typeof vi.fn>) {
  const eq = vi.fn(() => ({ maybeSingle: async () => ({ data: cached }) }));
  const client = { from: () => ({ select: () => ({ eq }), upsert }) } as unknown as LegalGateClient;
  return { client, eq };
}

function okFetch(body: unknown, ok = true, status = ok ? 200 : 500) {
  return vi.fn().mockResolvedValue({ ok, status, json: async () => body });
}

function logged(): string {
  const calls = [...vi.mocked(console.error).mock.calls, ...vi.mocked(console.warn).mock.calls];
  return calls.map((args) => args.map((a) => String(a)).join(" ")).join("\n");
}

const CURRENT = { terms: LEGAL_VERSIONS.terms, privacy: LEGAL_VERSIONS.privacy };

function options(
  client: LegalGateClient,
  fetchImpl: ReturnType<typeof vi.fn>,
  extra: Partial<LegalGateOptions> = {},
): LegalGateOptions {
  return {
    createClient: async () => client,
    customerSecret: "secret",
    fetchImpl: fetchImpl as unknown as typeof fetch,
    ...extra,
  };
}

describe("checkLegalAcceptance", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns a fresh cached value without calling merqo", async () => {
    const upsert = vi.fn();
    const fetchImpl = okFetch(CURRENT);
    const { client, eq } = makeClient(
      { checked_at: new Date(NOW.getTime() - 60_000).toISOString(), is_current: true },
      upsert,
    );
    expect(await checkLegalAcceptance("Vendor@Example.com", options(client, fetchImpl))).toBe(true);
    expect(eq).toHaveBeenCalledWith("email", "vendor@example.com");
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("returns a cached not-current value as false", async () => {
    const { client } = makeClient(
      { checked_at: new Date(NOW.getTime() - 1000).toISOString(), is_current: false },
      vi.fn(),
    );
    const fetchImpl = okFetch(CURRENT);
    expect(await checkLegalAcceptance("a@b.co", options(client, fetchImpl))).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("asks merqo on a cache miss and stores the answer", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const fetchImpl = okFetch(CURRENT);
    const { client } = makeClient(null, upsert);
    expect(
      await checkLegalAcceptance(
        "A@B.co",
        options(client, fetchImpl, { merqoBaseUrl: "https://merqo.test" }),
      ),
    ).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toBe("https://merqo.test/api/merqo/legal-status?email=a%40b.co");
    expect(init.headers).toEqual({ Authorization: "Bearer secret" });
    expect(upsert).toHaveBeenCalledWith({
      email: "a@b.co",
      checked_at: NOW.toISOString(),
      is_current: true,
    });
  });

  it("refreshes a stale entry", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const fetchImpl = okFetch(CURRENT);
    const { client } = makeClient(
      { checked_at: new Date(NOW.getTime() - 5 * 60_000).toISOString(), is_current: false },
      upsert,
    );
    expect(await checkLegalAcceptance("a@b.co", options(client, fetchImpl))).toBe(true);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("does not trust a future-dated or invalid cache timestamp", async () => {
    for (const checked_at of [new Date(NOW.getTime() + 3_600_000).toISOString(), "garbage"]) {
      const fetchImpl = okFetch(CURRENT);
      const { client } = makeClient({ checked_at, is_current: false }, vi.fn().mockResolvedValue({ error: null }));
      expect(await checkLegalAcceptance("a@b.co", options(client, fetchImpl))).toBe(true);
      expect(fetchImpl).toHaveBeenCalledOnce();
    }
  });

  it("fails open for a current vendor when the upsert returns an error", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: "rls" } });
    const { client } = makeClient(null, upsert);
    expect(await checkLegalAcceptance("a@b.co", options(client, okFetch(CURRENT)))).toBe(true);
    expect(console.error).toHaveBeenCalledWith(
      "checkLegalAcceptance: cache upsert failed",
      { message: "rls" },
    );
  });

  it("fails open for a current vendor when the upsert throws", async () => {
    const upsert = vi.fn().mockRejectedValue(new Error("network"));
    const { client } = makeClient(null, upsert);
    expect(await checkLegalAcceptance("a@b.co", options(client, okFetch(CURRENT)))).toBe(true);
    expect(console.error).toHaveBeenCalled();
  });

  it("logs a failed cache read and still asks merqo", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const eq = vi.fn(() => ({
      maybeSingle: async () => ({ data: null, error: { message: "relation missing" } }),
    }));
    const client = { from: () => ({ select: () => ({ eq }), upsert }) } as unknown as LegalGateClient;
    const fetchImpl = okFetch(CURRENT);
    expect(await checkLegalAcceptance("a@b.co", options(client, fetchImpl))).toBe(true);
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(console.error).toHaveBeenCalledWith("checkLegalAcceptance: cache select failed", {
      message: "relation missing",
    });
  });

  it("is false for an outdated acceptance and caches that", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const { client } = makeClient(null, upsert);
    const stale = okFetch({ terms: "2020-01-01", privacy: LEGAL_VERSIONS.privacy });
    expect(await checkLegalAcceptance("a@b.co", options(client, stale))).toBe(false);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ is_current: false }));
  });

  it("is false for a missing or non-string version", async () => {
    for (const body of [{ terms: null, privacy: null }, { terms: 5, privacy: 5 }, {}]) {
      const { client } = makeClient(null, vi.fn().mockResolvedValue({ error: null }));
      expect(await checkLegalAcceptance("a@b.co", options(client, okFetch(body)))).toBe(false);
    }
  });

  it("is false for a non-2xx response", async () => {
    const { client } = makeClient(null, vi.fn().mockResolvedValue({ error: null }));
    expect(await checkLegalAcceptance("a@b.co", options(client, okFetch(CURRENT, false, 503)))).toBe(false);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(logged()).toContain("HTTP 503");
  });

  it("logs once with the accepted and required versions when not current", async () => {
    const { client } = makeClient(null, vi.fn().mockResolvedValue({ error: null }));
    const stale = okFetch({ terms: "2020-01-01", privacy: LEGAL_VERSIONS.privacy });
    await checkLegalAcceptance("vendor@example.com", options(client, stale));
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.error).not.toHaveBeenCalled();
    const msg = logged();
    expect(msg).toContain("2020-01-01");
    expect(msg).toContain(LEGAL_VERSIONS.terms);
    expect(msg).not.toContain("vendor@example.com");
    expect(msg).not.toContain("secret");
  });

  it("logs a malformed body once", async () => {
    const { client } = makeClient(null, vi.fn().mockResolvedValue({ error: null }));
    await checkLegalAcceptance("a@b.co", options(client, okFetch({ terms: 5 })));
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(logged()).toContain("malformed");
  });

  it("logs a non-JSON body once", async () => {
    const { client } = makeClient(null, vi.fn().mockResolvedValue({ error: null }));
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    });
    expect(await checkLegalAcceptance("a@b.co", options(client, fetchImpl))).toBe(false);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(logged()).toContain("not valid JSON");
  });

  it.each([500, 401, 400])("does not cache an HTTP %i answer", async (status) => {
    const upsert = vi.fn();
    const { client } = makeClient(null, upsert);
    const fetchImpl = okFetch({ error: "x" }, false, status);
    expect(await checkLegalAcceptance("a@b.co", options(client, fetchImpl))).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("does not cache a non-JSON or malformed body", async () => {
    const upsert = vi.fn();
    const { client } = makeClient(null, upsert);
    const badJson = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    });
    expect(await checkLegalAcceptance("a@b.co", options(client, badJson))).toBe(false);
    for (const body of [{ terms: 5 }, { terms: "", privacy: "" }, null]) {
      expect(await checkLegalAcceptance("a@b.co", options(client, okFetch(body)))).toBe(false);
    }
    expect(upsert).not.toHaveBeenCalled();
  });

  it("caches a well-formed not-current answer", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const { client } = makeClient(null, upsert);
    const stale = okFetch({ terms: "2020-01-01", privacy: "2020-01-01" });
    expect(await checkLegalAcceptance("a@b.co", options(client, stale))).toBe(false);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ is_current: false }));
  });

  it("retries once when the connection drops, then succeeds and caches", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const { client } = makeClient(null, upsert);
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => CURRENT });
    expect(await checkLegalAcceptance("a@b.co", options(client, fetchImpl))).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ is_current: true }));
  });

  it.each([502, 503, 504])("retries once on HTTP %i", async (status) => {
    const { client } = makeClient(null, vi.fn().mockResolvedValue({ error: null }));
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => CURRENT });
    expect(await checkLegalAcceptance("a@b.co", options(client, fetchImpl))).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("gives up after one retry without caching", async () => {
    const upsert = vi.fn();
    const { client } = makeClient(null, upsert);
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    expect(await checkLegalAcceptance("a@b.co", options(client, fetchImpl))).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("does not retry a timeout", async () => {
    const { client } = makeClient(null, vi.fn());
    const fetchImpl = vi.fn().mockRejectedValue(new DOMException("timed out", "TimeoutError"));
    expect(await checkLegalAcceptance("a@b.co", options(client, fetchImpl))).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("logs nothing on the true path or a cache hit", async () => {
    const { client } = makeClient(null, vi.fn().mockResolvedValue({ error: null }));
    expect(await checkLegalAcceptance("a@b.co", options(client, okFetch(CURRENT)))).toBe(true);
    const hit = makeClient(
      { checked_at: new Date(NOW.getTime() - 1000).toISOString(), is_current: false },
      vi.fn(),
    );
    await checkLegalAcceptance("a@b.co", options(hit.client, okFetch(CURRENT)));
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("fails closed without a secret, without calling merqo", async () => {
    const fetchImpl = okFetch(CURRENT);
    const { client } = makeClient(null, vi.fn());
    expect(
      await checkLegalAcceptance("a@b.co", options(client, fetchImpl, { customerSecret: undefined })),
    ).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(logged()).toContain("MERQO_CUSTOMER_SECRET is not set");
  });

  it("fails closed when merqo is unreachable and does not cache it", async () => {
    const upsert = vi.fn();
    const { client } = makeClient(null, upsert);
    const fetchImpl = vi.fn().mockRejectedValue(new Error("offline"));
    expect(await checkLegalAcceptance("vendor@example.com", options(client, fetchImpl))).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(logged()).not.toContain("vendor@example.com");
    expect(logged()).not.toContain("Bearer");
  });

  it("fails closed when the client cannot be created", async () => {
    expect(
      await checkLegalAcceptance("a@b.co", {
        createClient: async () => {
          throw new Error("no secret key");
        },
        customerSecret: "secret",
      }),
    ).toBe(false);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(logged()).toContain("unexpected failure");
  });

  it("uses the global fetch and default base URL when none is injected", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => CURRENT });
    vi.stubGlobal("fetch", fetchSpy);
    const { client } = makeClient(null, vi.fn().mockResolvedValue({ error: null }));
    const result = await checkLegalAcceptance("a@b.co", {
      createClient: () => client,
      customerSecret: "secret",
    });
    vi.unstubAllGlobals();
    expect(result).toBe(true);
    expect(String(fetchSpy.mock.calls[0][0])).toContain("https://www.merqo.io/api/merqo/legal-status");
  });
});
