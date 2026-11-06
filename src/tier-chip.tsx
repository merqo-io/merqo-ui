import * as React from "react";

import { tierLabel } from "./account-menu";
import { cn } from "./lib/utils";

export interface TierChipProps {
  /** Raw plan value ("free", "starter", "pro", "qkit") or a display label. */
  tier: string;
  className?: string;
}

// Free reads as a quiet muted chip, Starter borrows the primary tint, and any
// paid tier beyond that is filled so a full plan is legible at a glance.
function toneFor(tier: string): string {
  switch (tier.toLowerCase()) {
    case "free":
      return "bg-muted text-muted-foreground ring-border";
    case "starter":
      return "bg-primary/12 text-primary ring-primary/25";
    default:
      return "bg-secondary text-secondary-foreground ring-secondary";
  }
}

/**
 * The small plan badge a kit passes to `AccountMenu`'s (or `DashboardNav`'s)
 * `tierBadge` slot. The label comes from `tierLabel`, so it always matches
 * the "Plan · X" menu item.
 */
export function TierChip({
  tier,
  className,
}: TierChipProps): React.ReactElement {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-wider ring-1 ring-inset",
        toneFor(tier),
        className,
      )}
    >
      {tierLabel(tier)}
    </span>
  );
}
