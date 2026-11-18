import * as React from "react";
import { cn } from "./lib/utils";

export interface StatusBadgeConfig {
  label: string;
  className: string;
}

export interface StatusBadgeProps<T extends string> {
  status: T;
  /** Caller supplies the per-status label/color map — same contract AuditLogTable's formatAction already established, so each kit keeps its own status set and colors. */
  config: Record<T, StatusBadgeConfig>;
}

/**
 * The dot + bordered-pill status chip shared across every
 * kit — qkit's original shape, chosen as the extraction target over
 * printkit's/paykit's plain shadcn `Badge` uses since it's the one built on
 * real semantic status tokens rather than raw Tailwind literals mixed in ad
 * hoc. Deliberately not a `Badge` wrapper — this shape carries its own
 * treatment (dot, border, tint) that `Badge`'s variants don't offer.
 */
export function StatusBadge<T extends string>({
  status,
  config,
}: StatusBadgeProps<T>): React.JSX.Element {
  const { label, className } = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
