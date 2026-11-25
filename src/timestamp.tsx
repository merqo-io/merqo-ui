import type { ReactElement } from "react";

import { cn } from "./lib/utils";
import { formatDate, formatDateTime } from "./time";
import type { DateInput } from "./time";
import { RelativeTimestamp } from "./timestamp-relative";

export interface TimestampProps {
  value: DateInput;
  variant?: "relative" | "date" | "datetime";
  now?: DateInput;
  className?: string;
}

function toIso(value: DateInput): string | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// Only the relative variant needs client code, so date and datetime stay
// usable from a Server Component.
export function Timestamp({ value, variant = "relative", now, className }: TimestampProps): ReactElement {
  const iso = toIso(value);
  if (iso === null) return <span className={className}>-</span>;
  if (variant === "relative") {
    return <RelativeTimestamp value={value} isoString={iso} now={now} className={className} />;
  }
  return (
    <time dateTime={iso} className={cn("tabular-nums", className)}>
      {variant === "date" ? formatDate(value) : formatDateTime(value)}
    </time>
  );
}
