import { afterEach, describe, expect, it, vi } from "vitest";
import {
  callMerqoRpc,
  createMerqoClient,
  DEFAULT_MERQO_BASE_URL,
  merqoBaseUrl,
  merqoUrl,
} from "./merqo-client";

afterEach(() => vi.restoreAllMocks());

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe("merqoBaseUrl", () => {
  it("defaults to the production site", () => {
    expect(merqoBaseUrl({})).toBe(DEFAULT_MERQO_BASE_URL);
    expect(merqoBaseUrl({ MERQO_BASE_URL: "" })).toBe(DEFAULT_MERQO_BASE_URL);
  });

  it("honours MERQO_BASE_URL", () => {
    expect(merqoBaseUrl({ MERQO_BASE_URL: "https://staging.merqo.io" })).toBe(
      "https://staging.merqo.io",
    );
  });
});

describe("merqoUrl", () => {
  it("builds a URL with encoded query params and skips undefined", () => {
    const url = merqoUrl("/api/merqo/legal-status", { email: "a+b@x.io", n: undefined }, "https://m.test");
    expect(url?.toString()).toBe(
      "https://m.test/api/merqo/legal-status?email=a%2Bb%40x.io",
    );
  });

  it("refuses a path that would leave the merqo origin", () => {
    expect(merqoUrl("//evil.test/x", undefined, "https://m.test")).toBeNull();
    expect(merqoUrl("https://evil.test/x", undefined, "https://m.test")).toBeNull();
    expect(merqoUrl("relative", undefined, "https://m.test")).toBeNull();
  });

  it("refuses plain http except localhost in development", () => {
    expect(merqoUrl("/a", undefined, "http://m.test")).toBeNull();
    expect(merqoUrl("/a", undefined, "http://localhost:3000")).toBeNull();
    expect(
      merqoUrl("/a", undefined, "http://localhost:3000", { development: true })?.href,
    ).toBe("http://localhost:3000/a");
    expect(merqoUrl("/a", undefined, "not a url")).toBeNull();
  });
});

describe("createMerqoClient", () => {
  const base = { baseUrl: "https://m.test", secret: "sek" };

  it("GETs with a bearer token, timeout signal and no redirects", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ terms: "1" }));
    const client = createMerqoClient({ ...base, fetch: fetchImpl });
    const out = await client.get<{ terms: string }>("/api/merqo/legal-status", { email: "a@b.c" });
    expect(out).toEqual({ ok: true, status: 200, data: { terms: "1" } });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toBe("https://m.test/api/merqo/legal-status?email=a%40b.c");
    expect(init.method).toBe("GET");
    expect(init.redirect).toBe("error");
    expect(init.headers.Authorization).toBe("Bearer sek");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("POSTs a JSON body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ ok: 1 }));
    const client = createMerqoClient({ ...base, fetch: fetchImpl });
    await client.post("/api/merqo/legal-accept", { a: 1 });
    const init = fetchImpl.mock.calls[0][1];
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe('{"a":1}');
  });

  it("returns missing_secret without calling fetch", async () => {
    const fetchImpl = vi.fn();
    const client = createMerqoClient({ baseUrl: "https://m.test", secret: undefined, fetch: fetchImpl });
    expect(await client.get("/x")).toEqual({ ok: false, status: null, error: "missing_secret" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns invalid_url for a bad base or path", async () => {
    const fetchImpl = vi.fn();
    const client = createMerqoClient({ baseUrl: "http://m.test", secret: "s", fetch: fetchImpl });
    expect(await client.get("/x")).toEqual({ ok: false, status: null, error: "invalid_url" });
    const ok = createMerqoClient({ ...base, fetch: fetchImpl });
    expect(await ok.get("//evil.test")).toMatchObject({ error: "invalid_url" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reports non-2xx as http_error with the status", async () => {
    const client = createMerqoClient({ ...base, fetch: vi.fn().mockResolvedValue(json({}, 503)) });
    expect(await client.get("/x")).toEqual({ ok: false, status: 503, error: "http_error" });
  });

  it("reports a non-JSON 2xx body as invalid_json", async () => {
    const client = createMerqoClient({
      ...base,
      fetch: vi.fn().mockResolvedValue(new Response("<html>", { status: 200 })),
    });
    expect(await client.get("/x")).toEqual({ ok: false, status: 200, error: "invalid_json" });
  });

  it("reports network failures without throwing or leaking the secret", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = createMerqoClient({
      ...base,
      fetch: vi.fn().mockRejectedValue(new TypeError("boom Bearer sek")),
    });
    expect(await client.post("/x", {})).toEqual({ ok: false, status: null, error: "network_error" });
    expect(JSON.stringify(err.mock.calls)).not.toContain("sek");
  });

  it("reports an aborted request as timeout", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchImpl = vi.fn(
      (_u: unknown, init: { signal: AbortSignal }) =>
        new Promise((_r, reject) => {
          init.signal.addEventListener("abort", () =>
            reject(new DOMException("t", "TimeoutError")),
          );
        }),
    );
    const client = createMerqoClient({
      ...base,
      timeoutMs: 5,
      fetch: fetchImpl as unknown as typeof fetch,
    });
    expect(await client.get("/x")).toEqual({ ok: false, status: null, error: "timeout" });
  });
});

describe("callMerqoRpc", () => {
  const clientWith = (result: { data: unknown; error: { message: string } | null }) => {
    const rpc = vi.fn().mockResolvedValue(result);
    const schema = vi.fn().mockReturnValue({ rpc });
    return { client: { schema }, rpc, schema };
  };

  it("calls the merqo schema and returns data", async () => {
    const { client, rpc, schema } = clientWith({ data: { id: "1" }, error: null });
    const out = await callMerqoRpc<{ a: number }, { id: string }>(client, "fn", { a: 1 });
    expect(out).toEqual({ id: "1" });
    expect(schema).toHaveBeenCalledWith("merqo");
    expect(rpc).toHaveBeenCalledWith("fn", { a: 1 });
  });

  it("throws with the function name on an RPC error", async () => {
    const { client } = clientWith({ data: null, error: { message: "denied" } });
    await expect(callMerqoRpc(client, "fn", {})).rejects.toThrow("fn failed: denied");
  });
});
