import { describe, it, expect } from "vitest";
import {
  CARD_TITLE,
  EYEBROW,
  GROUP,
  INTERACTIVE_SURFACE,
  LABEL,
  MOTION_FEEDBACK,
  MOTION_OVERLAY,
  MOTION_STATE,
  OVERLAY_ELEVATION,
  OVERLAY_TRANSITION,
  PAGE_TITLE,
  POPUP_TRANSITION,
  PRESS,
  REDUCED_MOTION,
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

  it("has a sentence-case label with no uppercase or tracking", () => {
    expect(LABEL).toContain("font-medium");
    expect(LABEL).toContain("text-muted-foreground");
    expect(LABEL).not.toMatch(/uppercase|tracking|font-mono/);
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

describe("motion tokens", () => {
  it("steps feedback, state and overlay timings on one ease-out curve", () => {
    expect(MOTION_FEEDBACK).toBe("duration-150 ease-out");
    expect(MOTION_STATE).toBe("duration-200 ease-out");
    expect(MOTION_OVERLAY).toBe("duration-300 ease-out");
  });

  it("exits faster than it enters", () => {
    expect(OVERLAY_TRANSITION).toContain("duration-300");
    expect(OVERLAY_TRANSITION).toContain("data-[state=closed]:duration-200");
    expect(POPUP_TRANSITION).toContain("duration-200");
    expect(POPUP_TRANSITION).toContain("data-[state=closed]:duration-150");
  });

  it("keeps animations alive at near-zero duration and drops transforms under reduced motion", () => {
    expect(REDUCED_MOTION).toContain("motion-reduce:duration-1!");
    expect(REDUCED_MOTION).not.toContain("animate-none");
    expect(REDUCED_MOTION).not.toContain("transition-none");
    for (const axis of ["enter", "exit"]) {
      expect(REDUCED_MOTION).toContain(`motion-reduce:[--tw-${axis}-scale:1]!`);
      expect(REDUCED_MOTION).toContain(`motion-reduce:[--tw-${axis}-translate-x:0]!`);
      expect(REDUCED_MOTION).toContain(`motion-reduce:[--tw-${axis}-translate-y:0]!`);
    }
    expect(OVERLAY_TRANSITION).toContain(REDUCED_MOTION);
    expect(POPUP_TRANSITION).toContain(REDUCED_MOTION);
  });

  it("presses with a scale that reduced motion removes, keeping the colour step", () => {
    expect(PRESS).toContain("active:scale-[0.98]");
    expect(PRESS).toContain("motion-reduce:active:scale-100");
    expect(PRESS).toContain(MOTION_FEEDBACK);
  });
});

describe("elevation by meaning", () => {
  it("lifts only the tappable surface, with an active twin for every hover", () => {
    expect(INTERACTIVE_SURFACE).toContain(SURFACE);
    expect(INTERACTIVE_SURFACE).toContain("hover:shadow-md");
    expect(INTERACTIVE_SURFACE).toContain("active:shadow-xs");
    expect(INTERACTIVE_SURFACE).toContain("active:scale-[0.98]");
    expect(INTERACTIVE_SURFACE).toContain("motion-reduce:active:scale-100");
    expect(INTERACTIVE_SURFACE).toContain(MOTION_FEEDBACK);
    expect(INTERACTIVE_SURFACE).not.toMatch(/translate|-translate-y/);
    expect(SURFACE).not.toContain("hover:");
    expect(GROUP).not.toContain("hover:");
  });

  it("gives floating layers the largest shadow", () => {
    expect(OVERLAY_ELEVATION).toBe("shadow-lg");
  });
});
