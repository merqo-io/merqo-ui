import * as React from "react";
import { DefaultAppLink, type AppLinkComponent } from "./app-link";
import { cn } from "./lib/utils";

export type WordmarkSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<WordmarkSize, string> = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

export interface WordmarkProps {
  /** The kit's own letters, with its accent span wherever it wants one. */
  children: React.ReactNode;
  size?: WordmarkSize;
  /** Wraps the mark in a link, usually home. */
  href?: string;
  /** Accessible name when the children are split or aria-hidden. */
  label?: string;
  /** Pass `next/link`'s `Link` for client-side navigation. */
  LinkComponent?: AppLinkComponent;
  className?: string;
}

/**
 * Layout shell for a kit wordmark: weight, tracking, size and optional link.
 * The kit supplies the text and any accent colour classes.
 */
export function Wordmark({
  children,
  size = "md",
  href,
  label,
  LinkComponent = DefaultAppLink,
  className,
}: WordmarkProps): React.ReactElement {
  const classes = cn("font-display font-semibold tracking-tight", SIZE_CLASS[size], className);
  if (href) {
    return (
      <LinkComponent
        href={href}
        aria-label={label}
        className={cn("inline-flex min-h-11 items-center", classes)}
      >
        {children}
      </LinkComponent>
    );
  }
  return (
    <span aria-label={label} className={classes}>
      {children}
    </span>
  );
}
