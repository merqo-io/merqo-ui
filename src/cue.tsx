import type { ReactNode } from "react";
import { cn } from "./lib/utils";

/**
 * A ring that pulses around whatever the visitor should tap next. It is a
 * sibling layer rather than an outline on the child, because a child that
 * clips its own overflow would cut a ring drawn on it. Reduced motion keeps
 * the ring and drops the pulse, so the cue still reads.
 */
export function Cue({
  active,
  tone = "primary",
  className,
  children,
}: {
  active: boolean;
  tone?: "foreground" | "primary";
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn("relative block", className)}>
      {children}
      {active && (
        <span
          aria-hidden="true"
          data-cue=""
          className={cn(
            "pointer-events-none absolute -inset-1 rounded-xl ring-2 motion-safe:animate-pulse",
            tone === "foreground" ? "ring-foreground" : "ring-primary",
          )}
        />
      )}
    </span>
  );
}
