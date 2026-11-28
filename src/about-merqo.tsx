import * as React from "react";
import { cn } from "./lib/utils";

export interface AboutMerqoProps {
  /** The kit this page renders on (e.g. "qkit"), used to phrase the closing
   *  line naturally. Omit when rendering on merqo itself. */
  kitName?: string;
  className?: string;
  /** Rendered below the story, inside the same container — typically a
   *  CTA button. The component intentionally has no Button/Link dependency
   *  of its own, so each app supplies its own (matching its own routing). */
  children?: React.ReactNode;
}

export function AboutMerqo({ kitName, className, children }: AboutMerqoProps) {
  return (
    <article className={cn("mx-auto max-w-2xl px-5 py-16 text-sm sm:py-20", className)}>
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Why Merqo
      </h1>

      <div className="space-y-4 leading-relaxed text-foreground/90">
        <p>Merqo started at a wedding, in the queue for a coffee cart.</p>
        <p>
          There was no queue number, no order system, just a crowd pressing
          in on the vendor, people cutting in to order faster, and the
          vendor taking it because there was nothing else to do. Finished
          drinks went onto a table with a name scrawled on the cup, and
          guests wandered up to pick through them looking for theirs, not
          exactly hygienic, and the hot drinks were going cold and the iced
          ones watery by the time anyone claimed them.
        </p>
        <p>
          That mess is where <span className="font-medium text-foreground">qkit</span> came
          from: a queue and order system a small vendor can run with no
          app for the customer and no extra hardware to buy. It is
          running in a pilot.
        </p>
        <p>
          Merqo is the shared home for the rest of the family, all still
          in build (built, not yet tried with vendors): <span className="font-medium text-foreground">loopkit</span> for
          stamp-card loyalty, <span className="font-medium text-foreground">paykit</span> for PayNow and payment
          tracking, <span className="font-medium text-foreground">stockkit</span> for stock, and <span className="font-medium text-foreground">printkit</span> for
          printing qkit orders on a Bluetooth printer.
        </p>
        <p>
          Merqo is a personal software project built and run by Clarence Lee. Merqo is not registered with ACRA or incorporated as a company.
          Every kit is built
          for the same kind of vendor as that coffee cart: small, busy,
          and better off spending time on the product, not the queue.
          {kitName && (
            <>
              {" "}You&rsquo;re reading this on {kitName}, one kit in that
              family.
            </>
          )}
        </p>
      </div>

      {children && <div className="mt-10">{children}</div>}
    </article>
  );
}
