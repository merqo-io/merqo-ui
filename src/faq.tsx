import * as React from "react";

import { cn } from "./lib/utils";

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
          <p className="text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </p>
        )}
        {title && (
          <h2 className="mt-3 text-balance text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
        )}
        <div className="mt-10 space-y-3">
          {items.map((item, i) => (
            <details
              key={i}
              className="group overflow-hidden rounded-lg border border-border bg-card open:border-primary/50"
            >
              <summary className="flex min-h-11 cursor-pointer list-none [&::-webkit-details-marker]:hiddenitems-start justify-between gap-4 px-5 py-4 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset">
                <span className="text-base font-semibold leading-snug text-foreground">
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-border text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45"
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
