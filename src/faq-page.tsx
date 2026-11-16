import type { ReactElement, ReactNode } from "react";

import { FaqRows, type FaqRow } from "./faq-rows";
import { cn } from "./lib/utils";

export type FaqGroup = {
  /** Anchor for in-page links; the section clears a sticky nav. */
  id?: string;
  heading?: string;
  rows: readonly FaqRow[];
};

export interface FaqPageProps {
  title: string;
  intro?: string;
  groups: readonly FaqGroup[];
  /** The kit's own contact line or call to action, after the groups. */
  closing?: ReactNode;
  /** Emit schema.org FAQPage JSON-LD for the rows. Defaults to true. */
  jsonLd?: boolean;
  className?: string;
}

type FaqJsonLd = {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: {
    "@type": "Question";
    name: string;
    acceptedAnswer: { "@type": "Answer"; text: string };
  }[];
};

/** schema.org FAQPage object for every row, in order. Server-safe. */
export function faqJsonLd(groups: readonly FaqGroup[]): FaqJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((group) =>
      group.rows.map((row) => ({
        "@type": "Question" as const,
        name: row.q,
        acceptedAnswer: { "@type": "Answer" as const, text: row.a },
      })),
    ),
  };
}

/** Page body for a kit's `/faq`. The kit renders its own nav and footer. */
export function FaqPage({
  title,
  intro,
  groups,
  closing,
  jsonLd = true,
  className,
}: FaqPageProps): ReactElement {
  const filled = groups.filter((group) => group.rows.length > 0);
  // A "<" in a question or answer must not be able to close the script.
  const json = JSON.stringify(faqJsonLd(filled)).replace(/</g, "\\u003c");

  return (
    <div className={cn("mx-auto max-w-2xl px-5 py-16 sm:py-20", className)}>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
        {title}
      </h1>
      {intro ? (
        <p className="mt-4 max-w-[60ch] text-muted-foreground">{intro}</p>
      ) : null}
      {filled.map((group, i) => (
        <section
          key={group.id ?? `${group.heading ?? "group"}-${i}`}
          id={group.id}
          className="mt-12 scroll-mt-24"
        >
          {group.heading ? (
            <h2 className="mb-4 font-display text-xl font-bold tracking-tight">
              {group.heading}
            </h2>
          ) : null}
          <FaqRows rows={group.rows} />
        </section>
      ))}
      {closing ? (
        <div className="mt-12 border-t border-border pt-8">{closing}</div>
      ) : null}
      {jsonLd && filled.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: json }}
        />
      ) : null}
    </div>
  );
}
