import { describe, expect, it, vi } from "vitest";
import { createRetryingFetch } from "./retry-fetch";

function socketError() {
  return new TypeError("fetch failed", { cause: { code: "UND_ERR_SOCKET" } });
}

describe("createRetryingFetch", () => {
  it("retries a GET once when the connection drops", async () => {
    const res = new Response("ok");
    const base = vi.fn().mockRejectedValueOnce(socketError()).mockResolvedValueOnce(res);
    const out = await createRetryingFetch(base)("https://x.test/a");
    expect(out).toBe(res);
    expect(base).toHaveBeenCalledTimes(2);
  });

  it("retries a HEAD and reads the method from a Request input", async () => {
    const base = vi.fn().mockRejectedValueOnce(socketError()).mockResolvedValueOnce(new Response());
    await createRetryingFetch(base)(new Request("https://x.test/a", { method: "HEAD" }));
    expect(base).toHaveBeenCalledTimes(2);
  });

  it.each(["POST", "PATCH", "PUT", "DELETE"])("does not retry %s", async (method) => {
    const base = vi.fn().mockRejectedValue(socketError());
    await expect(createRetryingFetch(base)("https://x.test/a", { method })).rejects.toThrow(
      "fetch failed",
    );
    expect(base).toHaveBeenCalledTimes(1);
  });

  it("does not retry a POST Request input", async () => {
    const base = vi.fn().mockRejectedValue(socketError());
    await expect(
      createRetryingFetch(base)(new Request("https://x.test/a", { method: "POST", body: "x" })),
    ).rejects.toThrow();
    expect(base).toHaveBeenCalledTimes(1);
  });

  it("does not retry an abort or timeout", async () => {
    const abort = new DOMException("aborted", "AbortError");
    const timeout = new DOMException("timed out", "TimeoutError");
    for (const err of [abort, timeout]) {
      const base = vi.fn().mockRejectedValue(err);
      await expect(createRetryingFetch(base)("https://x.test/a")).rejects.toBe(err);
      expect(base).toHaveBeenCalledTimes(1);
    }
  });

  it("does not retry when the caller's signal is already aborted", async () => {
    const base = vi.fn().mockRejectedValue(socketError());
    const signal = AbortSignal.abort();
    await expect(createRetryingFetch(base)("https://x.test/a", { signal })).rejects.toThrow();
    expect(base).toHaveBeenCalledTimes(1);
  });

  it("does not retry non-network errors", async () => {
    const base = vi.fn().mockRejectedValue(new RangeError("bad"));
    await expect(createRetryingFetch(base)("https://x.test/a")).rejects.toThrow("bad");
    expect(base).toHaveBeenCalledTimes(1);
  });

  it("does not retry an HTTP 5xx response", async () => {
    const base = vi.fn().mockResolvedValue(new Response("no", { status: 503 }));
    const out = await createRetryingFetch(base)("https://x.test/a");
    expect(out.status).toBe(503);
    expect(base).toHaveBeenCalledTimes(1);
  });

  it("gives up after one retry and rethrows the last error", async () => {
    const base = vi.fn().mockRejectedValue(socketError());
    await expect(createRetryingFetch(base)("https://x.test/a")).rejects.toThrow("fetch failed");
    expect(base).toHaveBeenCalledTimes(2);
  });
});
