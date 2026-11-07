import { beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserClient } = vi.hoisted(() => ({
  createBrowserClient: vi.fn((..._args: unknown[]) => ({ kind: "browser" })),
}));
vi.mock("@supabase/ssr", () => ({ createBrowserClient }));

import { createSupabaseBrowserClient } from "./index";

describe("createSupabaseBrowserClient", () => {
  beforeEach(() => createBrowserClient.mockClear());

  it("passes the schema and shared cookie domain", () => {
    createSupabaseBrowserClient({
      url: "https://p.supabase.co",
      publishableKey: "pk",
      schema: "qkit",
      cookieDomain: ".merqo.io",
    });
    expect(createBrowserClient).toHaveBeenCalledWith("https://p.supabase.co", "pk", {
      db: { schema: "qkit" },
      cookieOptions: { domain: ".merqo.io" },
    });
  });

  it("omits the schema and cookie domain when not configured", () => {
    createSupabaseBrowserClient({ url: "u", publishableKey: "pk" });
    expect(createBrowserClient).toHaveBeenCalledWith("u", "pk", { cookieOptions: undefined });
  });
});
