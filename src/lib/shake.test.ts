import { describe, expect, it, vi } from "vitest";
import { shake } from "./shake";

function stubMotion(reduced: boolean) {
  window.matchMedia = vi
    .fn()
    .mockImplementation(() => ({ matches: reduced })) as unknown as typeof window.matchMedia;
}

describe("shake", () => {
  it("animates translateX with a short ease-out", () => {
    stubMotion(false);
    const el = document.createElement("div");
    const animate = vi.fn();
    el.animate = animate;
    shake(el);
    expect(animate).toHaveBeenCalledTimes(1);
    const [frames, options] = animate.mock.calls[0] as [Keyframe[], KeyframeAnimationOptions];
    expect(frames.every((f) => Object.keys(f).join() === "transform")).toBe(true);
    expect(frames[0]).toEqual({ transform: "translateX(0)" });
    expect(frames.at(-1)).toEqual({ transform: "translateX(0)" });
    expect(options).toEqual({ duration: 300, easing: "ease-out" });
  });

  it("does nothing for null", () => {
    expect(() => shake(null)).not.toThrow();
  });

  it("does nothing when animate is unavailable", () => {
    stubMotion(false);
    const el = document.createElement("div");
    Object.defineProperty(el, "animate", { value: undefined });
    expect(() => shake(el)).not.toThrow();
  });

  it("does nothing under reduced motion", () => {
    stubMotion(true);
    const el = document.createElement("div");
    const animate = vi.fn();
    el.animate = animate;
    shake(el);
    expect(animate).not.toHaveBeenCalled();
  });
});
