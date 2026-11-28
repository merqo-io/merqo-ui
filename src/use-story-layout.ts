"use client";

import { useLayoutEffect, useSyncExternalStore, type RefObject } from "react";

const WIDE_QUERY = "(min-width: 960px)";

const GAP = 24;
const LABEL = 28;
const CHROME_BELOW = 230;
const MIN_SCALE = 0.5;

/** Design sizes in px that `useFitScale` shrinks as a whole. */
export type FitDesign = {
  phone: { w: number; h: number };
  tabletWide: { w: number; h: number };
  tabletNarrow: { w: number; h: number };
};

const DEFAULT_DESIGN: FitDesign = {
  phone: { w: 270, h: 580 },
  tabletWide: { w: 540, h: 430 },
  tabletNarrow: { w: 380, h: 520 },
};

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const mq = window.matchMedia(WIDE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function snapshot() {
  return typeof window.matchMedia === "function"
    ? window.matchMedia(WIDE_QUERY).matches
    : false;
}

/** True from 960px, where both screens sit side by side. False on the server. */
export function useWide(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}

/**
 * Scales the device pair to its column, and on a wide page also to the
 * viewport height so the sticky pair never outgrows the window. The devices
 * keep one design size and `zoom` shrinks them as a whole, which keeps real
 * screen markup at its real proportions instead of re-sizing each part.
 */
export function useFitScale(
  host: RefObject<HTMLElement | null>,
  target: RefObject<HTMLElement | null>,
  wide: boolean,
  design: FitDesign = DEFAULT_DESIGN,
) {
  useLayoutEffect(() => {
    const hostEl = host.current;
    const targetEl = target.current;
    if (!hostEl || !targetEl) return;
    const { phone, tabletWide, tabletNarrow } = design;
    const designW = wide
      ? phone.w + GAP + tabletWide.w
      : Math.max(phone.w, tabletNarrow.w);
    const designH =
      Math.max(phone.h, wide ? tabletWide.h : tabletNarrow.h) + LABEL;
    const fit = () => {
      let scale = Math.min(1, hostEl.clientWidth / designW);
      if (wide) {
        scale = Math.min(scale, (window.innerHeight - CHROME_BELOW) / designH);
      }
      const next = Number.isFinite(scale) && scale > 0 ? scale : 1;
      targetEl.style.setProperty("zoom", String(Math.max(MIN_SCALE, next)));
    };
    fit();
    window.addEventListener("resize", fit);
    const observer =
      typeof ResizeObserver === "function" ? new ResizeObserver(fit) : null;
    observer?.observe(hostEl);
    return () => {
      window.removeEventListener("resize", fit);
      observer?.disconnect();
    };
  }, [host, target, wide, design]);
}
