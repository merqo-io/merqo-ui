import { describe, it, expect } from "vitest";
import {
  CARD_TITLE,
  EYEBROW,
  GROUP,
  PAGE_TITLE,
  SECTION_TITLE,
  SURFACE,
} from "./recipes";

describe("recipes", () => {
  it("has a lifted tier 1 and a flat tier 2", () => {
    expect(SURFACE).toContain("rounded-2xl");
    expect(SURFACE).toContain("shadow-sm");
    expect(GROUP).toContain("rounded-xl");
    expect(GROUP).not.toContain("shadow");
  });

  it("has one eyebrow without mono or alternative trackings", () => {
    expect(EYEBROW).toContain("tracking-wider");
    expect(EYEBROW).not.toMatch(/font-mono|tracking-(wide(st)?(?![a-z])|\[)/);
  });

  it("has no responsive step in the page title", () => {
    expect(PAGE_TITLE).toContain("text-3xl");
    expect(PAGE_TITLE).not.toContain("sm:text-4xl");
    expect(CARD_TITLE).toContain("text-2xl");
    expect(SECTION_TITLE).toContain("text-base");
  });

  it("uses no literal colour, font or radius values", () => {
    for (const c of [SURFACE, GROUP, EYEBROW, PAGE_TITLE, CARD_TITLE, SECTION_TITLE]) {
      expect(c).not.toMatch(/#[0-9a-f]{3,6}|\[/i);
    }
  });
});
