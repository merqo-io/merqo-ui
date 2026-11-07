import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hashApiKey,
  verifyKitAuth,
  type KitAuthFailure,
  type KitKeyStore,
} from "./kit-auth";
import { createMemoryRateLimitStore } from "./rate-limit";

afterEach(() => vi.restoreAllMocks());

function makeStore(overrides: Partial<KitKeyStore> = {}) {
  const failures: KitAuthFailure[] = [];
  const store: KitKeyStore = {
    getSecretHash: async (slug) =>
      slug === "qkit" ? hashApiKey("good-secret") : null,
    touch: vi.fn().mockResolvedValue(undefined),
    logFailure: async (f) => {
      failures.push(f);
    },
    ...overrides,
  };
  return { store, failures };
}

const req = (authorization?: string, headers: Record<string, string> = {}) =>
  new Request("https://x.test/api", {
    headers: { ...(authorization ? { authorization } : {}), ...headers },
  });

describe("hashApiKey", () => {
  it("is sha256 hex of the secret", () => {
    expect(hashApiKey("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("verifyKitAuth", () => {
  it("accepts a correct slug:secret and touches the key", async () => {
    const { store } = makeStore();
    const out = await verifyKitAuth(req("Bearer qkit:good-secret"), { store });
    expect(out).toEqual({ kitSlug: "qkit" });
    expect(store.touch).toHaveBeenCalledWith("qkit");
  });

  it("keeps colons inside the secret", async () => {
    const store: KitKeyStore = {
      getSecretHash: async () => hashApiKey("a:b"),
    };
    expect(await verifyKitAuth(req("Bearer qkit:a:b"), { store })).toEqual({
      kitSlug: "qkit",
    });
  });

  it("rejects a wrong secret and logs it", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { store, failures } = makeStore();
    const out = await verifyKitAuth(req("Bearer qkit:bad", { "x-real-ip": "1.2.3.4" }), { store });
    expect(out).toBeNull();
    expect(failures).toEqual([
      { kitSlug: "qkit", reason: "secret mismatch", ip: "1.2.3.4" },
    ]);
  });

  it("rejects an unknown slug", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { store, failures } = makeStore();
    expect(await verifyKitAuth(req("Bearer nope:x"), { store })).toBeNull();
    expect(failures[0].reason).toBe("unknown kit_slug");
  });

  it.each([
    [undefined],
    ["Basic abc"],
    ["Bearer noseparator"],
    ["Bearer :secret"],
    ["Bearer slug:"],
    [`Bearer ${"a".repeat(65)}:x`],
  ])("rejects malformed header %s", async (header) => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { store } = makeStore();
    expect(await verifyKitAuth(req(header), { store })).toBeNull();
  });

  it("rejects when the stored hash has the wrong length", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const store: KitKeyStore = { getSecretHash: async () => "short" };
    expect(await verifyKitAuth(req("Bearer qkit:x"), { store })).toBeNull();
  });

  it("treats a store error as a failure and never throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { store } = makeStore({
      getSecretHash: () => Promise.reject(new Error("db")),
    });
    expect(await verifyKitAuth(req("Bearer qkit:good-secret"), { store })).toBeNull();
  });

  it("survives a failing logFailure and touch", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { store } = makeStore({
      logFailure: () => Promise.reject(new Error("x")),
      touch: () => Promise.reject(new Error("x")),
    });
    expect(await verifyKitAuth(req("Bearer qkit:bad"), { store })).toBeNull();
    expect(await verifyKitAuth(req("Bearer qkit:good-secret"), { store })).toEqual({
      kitSlug: "qkit",
    });
  });

  it("rate limits attempts per IP, failed or not", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { store } = makeStore();
    const rateLimit = {
      store: createMemoryRateLimitStore(() => 0),
      limit: 1,
      windowSeconds: 60,
    };
    const r = () => req("Bearer qkit:good-secret", { "x-real-ip": "1.2.3.4" });
    expect(await verifyKitAuth(r(), { store, rateLimit })).toEqual({ kitSlug: "qkit" });
    expect(await verifyKitAuth(r(), { store, rateLimit })).toBeNull();
  });

  it("fails closed on a limiter outage unless told otherwise", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { store } = makeStore();
    const down = { hit: () => Promise.reject(new Error("down")) };
    const rateLimit = { store: down, limit: 1, windowSeconds: 60 };
    const r = req("Bearer qkit:good-secret");
    expect(await verifyKitAuth(r, { store, rateLimit })).toBeNull();
    expect(
      await verifyKitAuth(r, { store, rateLimit: { ...rateLimit, failOpen: true } }),
    ).toEqual({ kitSlug: "qkit" });
  });
});
