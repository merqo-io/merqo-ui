import * as React from "react";
import { ElevatedCard } from "./elevated-card";
import { cn } from "./lib/utils";
import { PAGE_TITLE } from "./recipes";

export type AuthShellProps = {
  /** Kit wordmark, usually wrapped in a link home by the kit. */
  wordmark?: React.ReactNode;
  /** Short line under the wordmark. Rendered only when given. */
  tagline?: React.ReactNode;
  /** Alignment of the title and subtitle inside the card. */
  align?: "start" | "center";
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  /** Legal links or terms copy rendered under the card. */
  footer?: React.ReactNode;
  /**
   * The kit's one identity mark (a small glyph or illustration) anchored to the
   * card's top-end corner. Decorative and `aria-hidden`; it takes the kit's
   * colour through `currentColor`. The library ships no art.
   */
  signature?: React.ReactNode;
  className?: string;
};

/**
 * Centred card for sign-in, MFA and reset pages. Presentational and
 * server-renderable, so it carries no client directive.
 */
export function AuthShell({
  wordmark,
  tagline,
  align = "start",
  title,
  subtitle,
  children,
  footer,
  signature,
  className,
}: AuthShellProps): React.ReactElement {
  const centred = align === "center" ? "text-center" : undefined;
  return (
    <main className={cn("flex min-h-screen items-center justify-center p-5", className)}>
      <div className="w-full max-w-md">
        {wordmark || tagline ? (
          <div className="mb-8 text-center">
            {wordmark}
            {tagline ? <div className="mt-2 text-sm text-muted-foreground">{tagline}</div> : null}
          </div>
        ) : null}
        <ElevatedCard className={cn("px-7 pt-9 pb-8", signature && "relative")}>
          {signature ? (
            <div aria-hidden="true" className="pointer-events-none absolute top-4 end-4 size-10 text-primary [&_img]:size-full [&_img]:object-contain [&_svg]:size-full">
              {signature}
            </div>
          ) : null}
          <h1 className={cn(PAGE_TITLE, centred, signature && (align === "center" ? "px-12" : "pe-12"))}>{title}</h1>
          {subtitle ? (
            <p className={cn("mt-1.5 text-sm text-muted-foreground", centred)}>{subtitle}</p>
          ) : null}
          <div className="mt-7">{children}</div>
        </ElevatedCard>
        {footer ? (
          <footer className="mt-6 text-center text-xs text-muted-foreground">{footer}</footer>
        ) : null}
      </div>
    </main>
  );
}
