import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clientIp,
  createMemoryRateLimitStore,
  digest,
  rateLimit,
  rateLimitCheck,
  rateLimitStrict,
  type RateLimitStore,
} from "./rate-limit";

afterEach(() => vi.restoreAllMocks());

const failing: RateLimitStore = {
  hit: () => Promise.reject(new Error("db down")),
};

describe("createMemoryRateLimitStore", () => {
  it("allows up to the limit then denies inside the window", async () => {
    const store = createMemoryRateLimitStore(() => 1000);
    expect(await store.hit("k", 2, 60)).toBe(true);
    expect(await store.hit("k", 2, 60)).toBe(true);
    expect(await store.hit("k", 2, 60)).toBe(false);
  });

  it("starts a fresh window once the old one has elapsed", async () => {
    let now = 0;
    const store = createMemoryRateLimitStore(() => now);
    await store.hit("k", 1, 60);
    expect(await store.hit("k", 1, 60)).toBe(false);
    now = 60_000;
    expect(await store.hit("k", 1, 60)).toBe(true);
  });

  it("keeps keys independent", async () => {
    const store = createMemoryRateLimitStore(() => 0);
    await store.hit("a", 1, 60);
    expect(await store.hit("b", 1, 60)).toBe(true);
  });
});

describe("rateLimitCheck", () => {
  it("separates limited from error", async () => {
    const store = createMemoryRateLimitStore(() => 0);
    expect(await rateLimitCheck(store, "k", 1, 60)).toBe("ok");
    expect(await rateLimitCheck(store, "k", 1, 60)).toBe("limited");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await rateLimitCheck(failing, "k", 1, 60)).toBe("error");
  });
});

describe("rateLimit and rateLimitStrict", () => {
  it("fail open and closed on a store error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await rateLimit(failing, "k", 1, 60)).toBe(true);
    expect(await rateLimitStrict(failing, "k", 1, 60)).toBe(false);
  });

  it("deny past the limit in both modes", async () => {
    const store = createMemoryRateLimitStore(() => 0);
    await rateLimit(store, "k", 1, 60);
    expect(await rateLimit(store, "k", 1, 60)).toBe(false);
    await rateLimitStrict(store, "s", 1, 60);
    expect(await rateLimitStrict(store, "s", 1, 60)).toBe(false);
  });
});

describe("clientIp", () => {
  const h = (init: Record<string, string>) => new Headers(init);

  it("prefers the Vercel header, first hop", () => {
    expect(
      clientIp(
        h({ "x-vercel-forwarded-for": "1.1.1.1, 2.2.2.2", "x-real-ip": "3.3.3.3" }),
      ),
    ).toBe("1.1.1.1");
  });

  it("ignores x-real-ip and x-forwarded-for by default", () => {
    expect(clientIp(h({ "x-real-ip": "3.3.3.3" }))).toBeNull();
    expect(clientIp(h({ "x-forwarded-for": "9.9.9.9, 4.4.4.4" }))).toBeNull();
  });

  it("reads only the named trusted headers, in order", () => {
    const opts = { trustedHeaders: ["x-real-ip", "x-forwarded-for"] };
    expect(clientIp(h({ "x-real-ip": "3.3.3.3" }), opts)).toBe("3.3.3.3");
    expect(
      clientIp(h({ "x-forwarded-for": "9.9.9.9, 4.4.4.4" }), opts),
    ).toBe("4.4.4.4");
    expect(
      clientIp(
        h({ "x-real-ip": "3.3.3.3", "x-vercel-forwarded-for": "1.1.1.1" }),
        opts,
      ),
    ).toBe("3.3.3.3");
  });

  it("returns null for missing or non-IP values", () => {
    expect(clientIp(h({}))).toBeNull();
    expect(clientIp(h({ "x-vercel-forwarded-for": "not-an-ip" }))).toBeNull();
    expect(
      clientIp(h({ "x-real-ip": "not-an-ip" }), { trustedHeaders: ["x-real-ip"] }),
    ).toBeNull();
  });
});

describe("digest", () => {
  it("is a stable sha256 hex", () => {
    expect(digest("a")).toBe(digest("a"));
    expect(digest("a")).toMatch(/^[0-9a-f]{64}$/);
    expect(digest("a")).not.toBe(digest("b"));
  });
});
