import * as React from "react";

import { cn } from "./lib/utils";

export interface PageHeaderProps
  extends Omit<React.ComponentProps<"header">, "title"> {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  /** Muted line under the title. Wins over `children`. */
  description?: React.ReactNode;
  /** Same slot as `description`, for callers that pass the line as children. */
  children?: React.ReactNode;
  /** A button or control beside the title from `sm` up, below it on a phone. */
  action?: React.ReactNode;
  /** Slot above the header, typically a back link or `BackButton`. */
  back?: React.ReactNode;
  /** One size down on a phone, for a page whose title shares its row with a button. */
  responsive?: boolean;
}

/**
 * The top of a dashboard or admin page: an optional way back, a small-caps
 * eyebrow naming the area, the one h1 in the display font, an optional muted
 * line and an optional action on the right.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  action,
  back,
  responsive = false,
  className,
  ...rest
}: PageHeaderProps): React.ReactElement {
  const line = description ?? children;
  return (
    <header className={cn("mb-7", className)} {...rest}>
      {back && <div className="mb-3">{back}</div>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h1
            className={cn(
              "font-display font-semibold leading-none break-words",
              responsive ? "text-3xl sm:text-4xl" : "text-4xl",
            )}
          >
            {title}
          </h1>
          {line && (
            <div className="mt-2 text-sm text-muted-foreground">{line}</div>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
