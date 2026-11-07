import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerClient, store } = vi.hoisted(() => ({
  createServerClient: vi.fn((..._args: unknown[]) => ({ kind: "server" })),
  store: {
    getAll: vi.fn(() => [{ name: "a", value: "1" }]),
    set: vi.fn(),
  },
}));
vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("next/headers", () => ({ cookies: async () => store }));

import { createSupabaseServerClient, createSupabaseServiceClient } from "./server";

type Adapter = {
  getAll(): unknown;
  setAll(c: { name: string; value: string; options?: object }[]): void;
};

describe("createSupabaseServerClient", () => {
  beforeEach(() => {
    createServerClient.mockClear();
    store.set.mockReset();
  });

  it("wires the cookie store, schema and shared cookie domain", async () => {
    await createSupabaseServerClient({
      url: "u",
      publishableKey: "pk",
      schema: "paykit",
      cookieDomain: ".merqo.io",
    });
    const [url, key, opts] = createServerClient.mock.calls[0] as [string, string, Record<string, unknown>];
    expect([url, key]).toEqual(["u", "pk"]);
    expect(opts.db).toEqual({ schema: "paykit" });
    expect(opts.cookieOptions).toEqual({ domain: ".merqo.io" });
    const adapter = opts.cookies as Adapter;
    expect(adapter.getAll()).toEqual([{ name: "a", value: "1" }]);
    adapter.setAll([{ name: "s", value: "v", options: { path: "/" } }]);
    expect(store.set).toHaveBeenCalledWith("s", "v", { path: "/" });
  });

  it("swallows a read-only cookie store write", async () => {
    await createSupabaseServerClient({ url: "u", publishableKey: "pk" });
    const opts = createServerClient.mock.calls[0][2] as { cookies: Adapter; db?: unknown };
    expect(opts.db).toBeUndefined();
    store.set.mockImplementation(() => {
      throw new Error("read-only");
    });
    expect(() => opts.cookies.setAll([{ name: "s", value: "v" }])).not.toThrow();
  });
});

describe("createSupabaseServiceClient", () => {
  beforeEach(() => createServerClient.mockClear());

  it("uses the secret key with no request cookies and no session", () => {
    createSupabaseServiceClient({ url: "u", secretKey: "sk", schema: "stockkit" });
    const [, key, opts] = createServerClient.mock.calls[0] as [string, string, Record<string, unknown>];
    expect(key).toBe("sk");
    const adapter = opts.cookies as Adapter;
    expect(adapter.getAll()).toEqual([]);
    expect(() => adapter.setAll([{ name: "x", value: "y" }])).not.toThrow();
    expect(opts.auth).toEqual({ autoRefreshToken: false, persistSession: false });
    expect(opts.db).toEqual({ schema: "stockkit" });
  });

  it("omits the schema when none is given", () => {
    createSupabaseServiceClient({ url: "u", secretKey: "sk" });
    expect((createServerClient.mock.calls[0][2] as { db?: unknown }).db).toBeUndefined();
  });

  it("throws when the secret key is missing", () => {
    expect(() => createSupabaseServiceClient({ url: "u", secretKey: undefined })).toThrow(
      "SUPABASE_SECRET_KEY",
    );
  });
});
