import { describe, it, expect } from "vitest";
import { THEME_PROVIDER_PROPS, themeProps } from "./theme-props";
import { buildRobots } from "./robots";
import { readPublicEnv } from "./env";

describe("themeProps", () => {
  it("is the class-based, system-default, no-transition configuration", () => {
    expect(themeProps).toEqual({
      attribute: "class",
      defaultTheme: "system",
      enableSystem: true,
      disableTransitionOnChange: true,
    });
  });

  it("keeps the legacy kit name as an alias", () => {
    expect(THEME_PROVIDER_PROPS).toBe(themeProps);
  });
});

describe("buildRobots", () => {
  it("allows crawling on production", () => {
    expect(buildRobots({ vercelEnv: "production" })).toEqual({
      rules: { userAgent: "*", allow: "/" },
    });
  });

  it.each(["preview", "development", undefined])(
    "disallows crawling when VERCEL_ENV is %s",
    (vercelEnv) => {
      expect(buildRobots({ vercelEnv })).toEqual({
        rules: { userAgent: "*", disallow: "/" },
      });
    },
  );

  it("can stay closed on production for a kit that is not public", () => {
    expect(buildRobots({ vercelEnv: "production", indexable: false })).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
  });
});

describe("readPublicEnv", () => {
  it("returns the Supabase URL and publishable key", () => {
    expect(
      readPublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "pk",
      }),
    ).toEqual({ supabaseUrl: "https://x.supabase.co", supabasePublishableKey: "pk" });
  });

  it("names the missing variable", () => {
    expect(() =>
      readPublicEnv({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "pk" }),
    ).toThrow("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
    expect(() =>
      readPublicEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  });
});
