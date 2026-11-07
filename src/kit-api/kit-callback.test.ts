import { afterEach, describe, expect, it, vi } from "vitest";
import { postKitCallback } from "./kit-callback";

const target = { url: "https://kit.example.com/hook", secret: "s3cret" };

function okFetch(status = 200) {
  return vi.fn().mockResolvedValue(new Response("{}", { status }));
}

afterEach(() => vi.restoreAllMocks());

describe("postKitCallback", () => {
  it("posts JSON with a bearer secret and refuses redirects", async () => {
    const fetchImpl = okFetch();
    const result = await postKitCallback(target, { a: 1 }, { fetch: fetchImpl });
    expect(result).toEqual({ ok: true });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toBe("https://kit.example.com/hook");
    expect(init.method).toBe("POST");
    expect(init.redirect).toBe("error");
    expect(init.headers.Authorization).toBe("Bearer s3cret");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe('{"a":1}');
  });

  it.each([
    "http://kit.example.com/hook",
    "http://localhost:3000/hook",
    "ftp://kit.example.com/hook",
    "not a url",
    "https://user:pw@kit.example.com/hook",
  ])("refuses %s without sending", async (url) => {
    const fetchImpl = okFetch();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await postKitCallback({ ...target, url }, {}, { fetch: fetchImpl });
    expect(result).toEqual({ ok: false, reason: "invalid_url" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("allows http://localhost only when development is set", async () => {
    const fetchImpl = okFetch();
    const local = { ...target, url: "http://localhost:3001/hook" };
    expect(
      await postKitCallback(local, {}, { fetch: fetchImpl, development: true }),
    ).toEqual({ ok: true });
    const remote = { ...target, url: "http://example.com/hook" };
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      await postKitCallback(remote, {}, { fetch: fetchImpl, development: true }),
    ).toEqual({ ok: false, reason: "invalid_url" });
  });

  it("refuses a missing secret", async () => {
    const fetchImpl = okFetch();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await postKitCallback(
      { ...target, secret: "" },
      {},
      { fetch: fetchImpl },
    );
    expect(result).toEqual({ ok: false, reason: "invalid_url" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns http_error on a non-2xx and does not throw", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await postKitCallback(target, {}, { fetch: okFetch(500) });
    expect(result).toEqual({ ok: false, reason: "http_error", status: 500 });
    expect(JSON.stringify(err.mock.calls)).not.toContain("s3cret");
  });

  it("returns network_error without leaking the secret", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchImpl = vi
      .fn()
      .mockRejectedValue(new TypeError("fail Bearer s3cret https://x"));
    const result = await postKitCallback(target, {}, { fetch: fetchImpl });
    expect(result).toEqual({ ok: false, reason: "network_error" });
    expect(JSON.stringify(err.mock.calls)).not.toContain("s3cret");
  });

  it("returns timeout when the request is aborted", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchImpl = vi.fn(
      (_url: unknown, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );
    const result = await postKitCallback(
      target,
      {},
      { fetch: fetchImpl as unknown as typeof fetch, timeoutMs: 5 },
    );
    expect(result).toEqual({ ok: false, reason: "timeout" });
  });

  it("returns network_error for an unserialisable body", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const body: Record<string, unknown> = {};
    body.self = body;
    const result = await postKitCallback(target, body, { fetch: okFetch() });
    expect(result).toEqual({ ok: false, reason: "network_error" });
  });
});
