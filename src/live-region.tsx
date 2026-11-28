import type { Key, ReactNode } from "react";

export interface LiveRegionProps {
  message: ReactNode;
  politeness?: "polite" | "assertive";
  /** Change it to announce an identical message again. */
  announceKey?: Key;
}

// Screen readers only announce a change, so an identical repeat is silent.
// Keying the element remounts it, which announces the message afresh. The
// region renders even when empty: one inserted together with its text is often
// skipped, so it has to be in the DOM before the first message.
export function LiveRegion({
  message,
  politeness = "polite",
  announceKey,
}: LiveRegionProps) {
  return (
    <span
      key={announceKey}
      role={politeness === "assertive" ? "alert" : "status"}
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </span>
  );
}
