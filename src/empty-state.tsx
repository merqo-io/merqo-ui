import * as React from "react";

import { cn } from "./lib/utils";

export interface EmptyStateProps {
  /** Decorative icon shown above the headline. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  /** One muted sentence saying what to do next. Wins over `children`. */
  description?: React.ReactNode;
  /** Same slot as `description`, for callers that pass the sentence as children. */
  children?: React.ReactNode;
  /** Up to two links or buttons; the first may be the primary one. */
  actions?: React.ReactNode;
  /** Separate slots for kits that name the two steps; ignored when `actions` is set. */
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

/**
 * Dashed card for a list or panel with nothing in it yet: a headline, one
 * muted sentence and up to two next steps.
 */
export function EmptyState({
  icon,
  title,
  description,
  children,
  actions,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps): React.ReactElement {
  const body = description ?? children;
  const steps =
    actions ??
    (primaryAction || secondaryAction ? (
      <>
        {primaryAction}
        {secondaryAction}
      </>
    ) : null);
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed bg-card/50 px-6 py-10 text-center",
        className,
      )}
    >
      {icon && (
        <div
          aria-hidden="true"
          className="mx-auto mb-3 flex justify-center text-muted-foreground [&_svg]:size-8"
        >
          {icon}
        </div>
      )}
      <h2 className="font-display text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      {body && (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {body}
        </p>
      )}
      {steps && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {steps}
        </div>
      )}
    </div>
  );
}
