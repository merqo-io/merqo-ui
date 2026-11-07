import * as React from "react";

import { cn } from "./lib/utils";
import { StatTile, type StatTileProps } from "./stat-tile";

export interface StatCardProps extends Omit<StatTileProps, "card"> {
  /** Icon shown in the label row where the delta pill would sit. Ignored when `delta` or `deltaSlot` is given. */
  icon?: React.ReactNode;
  /** Highlights the card as the lead figure on the page: tinted card, primary-coloured value. */
  featured?: boolean;
}

/**
 * @deprecated Use `<StatTile card />`. Kept so existing kits keep working;
 * adds `icon` and `featured` on top of the card shell.
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
    <StatTile
      {...tile}
      card
      className={cn(featured && "border-primary/30 bg-primary/[0.05]", className)}
      deltaSlot={slot}
      valueClassName={cn(featured && "text-primary", valueClassName)}
    />
  );
}
