import * as React from "react";

import { ArrowLeft } from "lucide-react";

import { cn } from "./lib/utils";

function isBackLink(
  back: PageHeaderProps["back"],
): back is { href: string; label: string } {
  return (
    typeof back === "object" &&
    back !== null &&
    !React.isValidElement(back) &&
    "href" in back &&
    "label" in back
  );
}

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
  /** Alias of `action`, for callers that name the slot in the plural. `action` wins. */
  actions?: React.ReactNode;
  /** Slot above the header: a node such as `BackButton`, or `{href, label}` for a plain back link. */
  back?: React.ReactNode | { href: string; label: string };
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
  actions,
  back,
  responsive = false,
  className,
  ...rest
}: PageHeaderProps): React.ReactElement {
  const line = description ?? children;
  const trailing = action ?? actions;
  return (
    <header className={cn("mb-7", className)} {...rest}>
      {back && (
        <div className="mb-3">
          {isBackLink(back) ? (
            <a
              href={back.href}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {back.label}
            </a>
          ) : (
            back
          )}
        </div>
      )}
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
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
    </header>
  );
}
