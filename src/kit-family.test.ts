import { describe, it, expect } from "vitest";
import { KIT_FAMILY, getSwitchKits } from "./kit-family";

describe("KIT_FAMILY", () => {
  it("lists all five kits with a slug/name/url", () => {
    expect(KIT_FAMILY.map((k) => k.slug).sort()).toEqual([
      "loopkit",
      "paykit",
      "printkit",
      "qkit",
      "stockkit",
    ]);
    for (const kit of KIT_FAMILY) {
      expect(kit.url).toMatch(/^https:\/\/[a-z]+\.merqo\.io$/);
    }
  });
});

describe("getSwitchKits", () => {
  it("returns the other four kits, excluding the current one", () => {
    const result = getSwitchKits("qkit");
    expect(result).toHaveLength(4);
    expect(result.map((k) => k.label).sort()).toEqual([
      "loopkit",
      "paykit",
      "printkit",
      "stockkit",
    ]);
    expect(result.every((k) => k.href.startsWith("https://"))).toBe(true);
  });

  it("does not list printkit to itself", () => {
    expect(getSwitchKits("printkit").map((k) => k.label)).not.toContain("printkit");
  });

  it("fails open to the full family for an unrecognized slug", () => {
    expect(getSwitchKits("shopkit")).toHaveLength(5);
  });
});
