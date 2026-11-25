import * as React from "react";

import { cn } from "./lib/utils";
import { EYEBROW, GROUP, PAGE_TITLE } from "./recipes";

export interface FaqItem {
  question: React.ReactNode;
  answer: React.ReactNode;
}

export interface FaqProps {
  items: FaqItem[];
  /** Anchor id on the section, for a `#faq` link. */
  id?: string;
  /** Small-caps line above the title. */
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  className?: string;
}

/**
 * Accordion-style FAQ built on native `<details>`, so it opens by touch,
 * keyboard and screen reader with no script. The questions and answers are
 * the kit's own data; this owns only the shell.
 */
export function Faq({ items, id, eyebrow, title, className }: FaqProps): React.ReactElement | null {
  if (items.length === 0) return null;
  return (
    <section id={id} className={cn("border-t", className)}>
      <div className="mx-auto max-w-3xl px-5 py-16">
        {eyebrow && (
          <p className={cn("text-left", EYEBROW)}>
            {eyebrow}
          </p>
        )}
        {title && (
          <h2 className={cn("mt-3 text-left", PAGE_TITLE)}>
            {title}
          </h2>
        )}
        <div className="mt-10 space-y-3">
          {items.map((item, i) => (
            <details
              key={i}
              className={cn(
                GROUP, "group overflow-hidden border-border open:border-primary/50",
                // The height animation needs ::details-content and interpolate-size; without them the toggle stays instant.
                "[interpolate-size:allow-keywords] details-content:h-0 details-content:overflow-clip",
                "details-content:transition-[height,content-visibility] details-content:duration-180 details-content:ease-[cubic-bezier(0.16,1,0.3,1)] details-content:[transition-behavior:allow-discrete]",
                "open:details-content:h-auto open:details-content:duration-250 motion-reduce:details-content:transition-none",
              )}
            >
              <summary className="flex min-h-11 cursor-pointer list-none [&::-webkit-details-marker]:hidden items-start justify-between gap-4 px-5 py-4 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset">
                <span className="text-base font-semibold leading-snug text-foreground">
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-border text-lg leading-none text-muted-foreground transition-transform duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-open:rotate-45 group-open:duration-250"
                >
                  +
                </span>
              </summary>
              <div className="px-5 pb-5 text-sm leading-relaxed text-foreground/80">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
