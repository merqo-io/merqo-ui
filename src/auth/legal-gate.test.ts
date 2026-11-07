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

function okFetch(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({ ok, json: async () => body });
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
    expect(await checkLegalAcceptance("a@b.co", options(client, okFetch(CURRENT, false)))).toBe(false);
  });

  it("fails closed without a secret, without calling merqo", async () => {
    const fetchImpl = okFetch(CURRENT);
    const { client } = makeClient(null, vi.fn());
    expect(
      await checkLegalAcceptance("a@b.co", options(client, fetchImpl, { customerSecret: undefined })),
    ).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fails closed when merqo is unreachable and does not cache it", async () => {
    const upsert = vi.fn();
    const { client } = makeClient(null, upsert);
    const fetchImpl = vi.fn().mockRejectedValue(new Error("offline"));
    expect(await checkLegalAcceptance("a@b.co", options(client, fetchImpl))).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
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
