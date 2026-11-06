import * as React from "react";

import { ElevatedCard } from "./elevated-card";
import { cn } from "./lib/utils";
import { StatTile, type StatTileProps } from "./stat-tile";

export interface StatCardProps extends Omit<StatTileProps, "className"> {
  /** Class names for the card shell; `StatTile` itself takes none here. */
  className?: string;
  /** Icon shown in the label row where the delta pill would sit. Ignored when `delta` or `deltaSlot` is given. */
  icon?: React.ReactNode;
  /** Highlights the card as the lead figure on the page: tinted card, primary-coloured value. */
  featured?: boolean;
}

/**
 * A stat tile wrapped in the family's card shell. Takes every `StatTile` prop;
 * adds an `icon` and a `featured` treatment.
 */
export function StatCard({
  className,
  icon,
  featured,
  valueClassName,
  deltaSlot,
  ...tile
}: StatCardProps): React.ReactElement {
  const slot =
    deltaSlot ??
    (icon && tile.delta === undefined ? (
      <span aria-hidden="true" className="text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>
    ) : undefined);
  return (
    <ElevatedCard
      className={cn(
        "p-4",
        featured && "border-primary/30 bg-primary/[0.05]",
        className,
      )}
    >
      <StatTile
        {...tile}
        deltaSlot={slot}
        valueClassName={cn(featured && "text-primary", valueClassName)}
      />
    </ElevatedCard>
  );
}
