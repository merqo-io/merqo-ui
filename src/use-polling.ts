"use client";

import { useEffect, useRef } from "react";

// Focus and visibilitychange land within a few ms of each other on a tab return.
const FOCUS_DEDUPE_MS = 500;

/**
 * Run `tick` every `intervalMs` while the tab is visible and `enabled` is true.
 *
 * Pauses when the tab is hidden (phone pocketed) so a backgrounded page doesn't
 * hammer the server, and fires an immediate tick on return so the view refreshes
 * the instant the user looks back, also catching any change between SSR and
 * hydration.
 *
 * `tick` is held in a ref, so passing a fresh closure each render does NOT
 * re-subscribe the interval; only intervalMs/enabled do. To stop on a
 * condition, flip `enabled` to false when the condition is met.
 *
 * `refetchOnFocus` also ticks when the window regains focus. Focus and
 * visibilitychange usually arrive together on a return, so a second fire within
 * the same moment is dropped and a return makes one call.
 */
export function usePolling(
  tick: () => void | Promise<void>,
  {
    intervalMs,
    enabled,
    refetchOnFocus = false,
  }: { intervalMs: number; enabled: boolean; refetchOnFocus?: boolean },
) {
  const tickRef = useRef(tick);
  const inFlight = useRef(false);
  useEffect(() => {
    tickRef.current = tick;
  });

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | undefined;

    // Only return-to-tab fires (visibility or focus) are recorded, not interval
    // ticks: the pair arrives in either order (focus first on Safari/iOS), and
    // an interval tick just before a return should not swallow the refresh.
    let lastReturn = Number.NEGATIVE_INFINITY;
    const run = () => {
      if (document.hidden || inFlight.current) return;
      inFlight.current = true;
      try {
        const result = tickRef.current();
        if (result) {
          result.then(
            () => {
              inFlight.current = false;
            },
            () => {
              inFlight.current = false;
            },
          );
        } else {
          inFlight.current = false;
        }
      } catch {
        // A failed refresh is retried on the next visible interval.
        inFlight.current = false;
      }
    };
    const start = () => {
      if (!timer) timer = setInterval(run, intervalMs);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
    };
    const runOnReturn = () => {
      if (Date.now() - lastReturn < FOCUS_DEDUPE_MS) return;
      lastReturn = Date.now();
      run();
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else {
        runOnReturn();
        start();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    if (refetchOnFocus) window.addEventListener("focus", runOnReturn);
    if (!document.hidden) {
      run();
      start();
    }
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", runOnReturn);
    };
  }, [intervalMs, enabled, refetchOnFocus]);
}
