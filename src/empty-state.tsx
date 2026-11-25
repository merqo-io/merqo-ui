import * as React from "react";

import { cn } from "./lib/utils";
import { CARD_TITLE, GROUP } from "./recipes";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";

export interface EmptyStateProps {
  /** Decorative icon shown above the headline. Ignored when `media` is set. */
  icon?: React.ReactNode;
  /**
   * An image, illustration or preview shown in a fixed-aspect frame above the
   * headline. Wins over `icon`.
   */
  media?: React.ReactNode;
  /**
   * Sample rows showing what real content will look like, for example `Item`
   * rows. Rendered faded, inert and hidden from assistive tech, above the title.
   */
  preview?: React.ReactNode;
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
  /**
   * `compact` is a one-line message inside a list or card that already has its
   * own box: no border or background, and the title is a muted paragraph
   * instead of a heading. The default keeps the dashed border, which reads as
   * a slot to fill.
   */
  size?: "default" | "compact";
  /** Forwarded to the root, e.g. `status` for a list that fills in later. */
  role?: React.AriaRole;
}

/**
 * A list or panel with nothing in it yet: optional preview or media, a
 * headline, one muted sentence and up to two next steps.
 */
export function EmptyState({
  icon,
  media,
  preview,
  title,
  description,
  children,
  actions,
  primaryAction,
  secondaryAction,
  className,
  size = "default",
  role,
}: EmptyStateProps): React.ReactElement {
  const compact = size === "compact";
  const body = description ?? children;
  const steps =
    actions ??
    (primaryAction || secondaryAction ? (
      <>
        {primaryAction}
        {secondaryAction}
      </>
    ) : null);
  let lead: React.ReactNode = null;
  if (media) {
    lead = (
      <EmptyMedia className="mb-3 aspect-video w-full max-w-sm overflow-hidden rounded-lg [&_img]:size-full [&_img]:object-cover [&_svg]:size-full">
        {media}
      </EmptyMedia>
    );
  } else if (icon) {
    lead = (
      <EmptyMedia
        aria-hidden="true"
        className={
          compact
            ? "mb-1 text-muted-foreground [&_svg]:size-6"
            : "mb-1 text-muted-foreground [&_svg]:size-8"
        }
      >
        {icon}
      </EmptyMedia>
    );
  }
  return (
    <Empty
      role={role}
      className={cn(
        compact
          ? "flex-none gap-3 border-0 p-4 md:p-4"
          : cn(
              GROUP,
              "flex-none gap-5 border-dashed bg-card/50 px-6 py-10 md:px-6 md:py-10",
            ),
        className,
      )}
    >
      {preview ? (
        <div
          aria-hidden="true"
          inert
          className="pointer-events-none w-full max-w-sm text-left opacity-60 select-none mask-b-from-30% mask-b-to-100%"
        >
          {preview}
        </div>
      ) : null}
      <EmptyHeader className="max-w-md">
        {lead}
        {compact ? (
          <EmptyTitle className="text-sm font-normal tracking-normal">
            <p className="text-sm text-muted-foreground">{title}</p>
          </EmptyTitle>
        ) : (
          <EmptyTitle>
            <h2 className={CARD_TITLE}>{title}</h2>
          </EmptyTitle>
        )}
        {body ? (
          <EmptyDescription className="max-w-md">{body}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {steps ? (
        <EmptyContent
          className={cn(
            "max-w-none flex-row flex-wrap items-center justify-center gap-3",
          )}
        >
          {steps}
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
