import * as React from "react";
import { ElevatedCard } from "./elevated-card";
import { cn } from "./lib/utils";
import { CARD_TITLE, LABEL } from "./recipes";

export interface StatusCardProps {
  wordmark?: React.ReactNode;
  eyebrow?: React.ReactNode;
  code?: React.ReactNode;
  /**
   * An image or illustration in a fixed-aspect frame above the eyebrow, for a
   * page that should show something other than text.
   */
  media?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /**
   * The kit's one identity mark (a small glyph or illustration) anchored to the
   * card's top-end corner. Decorative and `aria-hidden`; it takes the kit's
   * colour through `currentColor`. The library ships no art.
   */
  signature?: React.ReactNode;
  className?: string;
}

// Shared frame for ErrorPage and NotFound so both read as the same surface.
export function StatusCard({
  wordmark,
  eyebrow,
  code,
  media,
  title,
  description,
  children,
  signature,
  className,
}: StatusCardProps): React.ReactElement {
  return (
    <main className={cn("flex min-h-screen items-center justify-center p-5", className)}>
      <div className="w-full max-w-md">
        {wordmark ? <div className="mb-8">{wordmark}</div> : null}
        <ElevatedCard className={cn("px-7 py-10 text-left", signature && "relative")}>
          {signature ? (
            <div aria-hidden="true" className="pointer-events-none absolute top-4 end-4 size-10 text-primary [&_img]:size-full [&_img]:object-contain [&_svg]:size-full">
              {signature}
            </div>
          ) : null}
          {media ? (
            <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg [&_img]:size-full [&_img]:object-cover [&_svg]:size-full">
              {media}
            </div>
          ) : null}
          {eyebrow ? (
            <p className={cn("mb-2", LABEL)}>
              {eyebrow}
            </p>
          ) : null}
          {code ? <p className="mb-1 font-mono text-5xl font-bold text-primary">{code}</p> : null}
          <h1 className={cn(CARD_TITLE, signature && "pe-12")}>{title}</h1>
          {description ? (
            <p className="mt-3 text-sm text-muted-foreground">{description}</p>
          ) : null}
          {children ? <div className="mt-7 flex flex-col gap-2.5">{children}</div> : null}
        </ElevatedCard>
      </div>
    </main>
  );
}
