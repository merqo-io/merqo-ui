import * as React from "react";

const KEYFRAMES = [
  { transform: "translateX(0)" },
  { transform: "translateX(-6px)" },
  { transform: "translateX(6px)" },
  { transform: "translateX(-4px)" },
  { transform: "translateX(4px)" },
  { transform: "translateX(-2px)" },
  { transform: "translateX(0)" },
];

/**
 * Brief horizontal shake so a failure registers for someone looking at the
 * keypad rather than the error line. The package ships no CSS, so this uses
 * the Web Animations API; with reduced motion the error text and invalid
 * border remain the only feedback.
 */
export function shake(el: HTMLElement | null): void {
  if (!el || typeof el.animate !== "function") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  el.animate(KEYFRAMES, { duration: 300, easing: "ease-out" });
}

/**
 * Shakes `ref` when an attempt finishes with an error. Keyed on the end of
 * `pending` rather than the message so an identical repeated failure still
 * shakes, while mounting with an error or showing a notice does not.
 */
export function useShakeOnFailure(
  ref: React.RefObject<HTMLElement | null>,
  pending: boolean,
  failed: boolean,
): void {
  const wasPending = React.useRef(false);
  React.useEffect(() => {
    if (wasPending.current && !pending && failed) shake(ref.current);
    wasPending.current = pending;
  }, [pending, failed, ref]);
}
