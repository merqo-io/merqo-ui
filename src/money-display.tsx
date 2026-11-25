import type { ReactElement } from "react";

import { cn } from "./lib/utils";
import { formatMoney } from "./money";

export interface MoneyProps {
  cents: number;
  trimWholeDollars?: boolean;
  className?: string;
}

// Server-safe on purpose. Colour by sign is left to each kit.
export function Money({ cents, trimWholeDollars, className }: MoneyProps): ReactElement {
  return (
    <span className={cn("tabular-nums whitespace-nowrap", className)}>
      {formatMoney(cents, { trimWholeDollars })}
    </span>
  );
}
