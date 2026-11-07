import { describe, expect, it } from "vitest";
import { DEFAULT_MERQO_BASE_URL, merqoBaseUrl } from "./merqo-client";

// Next's global.d.ts augments NodeJS.ProcessEnv with required-looking keys;
// an env typed that way must still be accepted.
interface AugmentedEnv {
  [key: string]: string | undefined;
  readonly NODE_ENV: "development" | "production" | "test";
}

describe("merqoBaseUrl env parameter", () => {
  it("accepts an augmented ProcessEnv-like type", () => {
    const env: AugmentedEnv = {
      NODE_ENV: "test",
      MERQO_BASE_URL: "https://merqo.test",
    };
    expect(merqoBaseUrl(env)).toBe("https://merqo.test");
  });

  it("accepts a readonly record and falls back for missing or empty values", () => {
    const empty: Readonly<Record<string, string | undefined>> = {
      MERQO_BASE_URL: "",
    };
    expect(merqoBaseUrl(empty)).toBe(DEFAULT_MERQO_BASE_URL);
    expect(merqoBaseUrl({})).toBe(DEFAULT_MERQO_BASE_URL);
  });

  it("still accepts process.env", () => {
    expect(typeof merqoBaseUrl(process.env)).toBe("string");
  });
});
