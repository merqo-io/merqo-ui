// @vitest-environment jsdom
import { useRef } from "react";
import { render, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useFitScale, useWide } from "./use-story-layout";

afterEach(() => vi.restoreAllMocks());

function Fit({ wide, width }: { wide: boolean; width: number }) {
  const host = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLDivElement>(null);
  useFitScale(host, target, wide);
  return (
    <div
      ref={(el) => {
        host.current = el;
        if (el) Object.defineProperty(el, "clientWidth", { value: width, configurable: true });
      }}
    >
      <div ref={target} data-testid="target" />
    </div>
  );
}

describe("useWide", () => {
  it("is false without matchMedia", () => {
    const original = window.matchMedia;
    // @ts-expect-error simulating an environment without matchMedia
    window.matchMedia = undefined;
    expect(renderHook(() => useWide()).result.current).toBe(false);
    window.matchMedia = original;
  });

  it("follows the 960px query", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 960px)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    expect(renderHook(() => useWide()).result.current).toBe(true);
  });
});

describe("useFitScale", () => {
  it("shrinks a narrow column and never scales up", () => {
    const small = render(<Fit wide={false} width={190} />);
    expect(small.getByTestId("target").style.zoom).toBe(String(190 / 380));
    small.unmount();
    const large = render(<Fit wide={false} width={2000} />);
    expect(large.getByTestId("target").style.zoom).toBe("1");
  });

  it("floors the scale at one half", () => {
    const { getByTestId } = render(<Fit wide={false} width={10} />);
    expect(getByTestId("target").style.zoom).toBe("0.5");
  });

  it("also fits the viewport height on a wide page", () => {
    Object.defineProperty(window, "innerHeight", {
      value: 700,
      configurable: true,
    });
    const { getByTestId } = render(<Fit wide width={5000} />);
    expect(Number(getByTestId("target").style.zoom)).toBeCloseTo(
      (700 - 230) / (580 + 28),
    );
  });
});
