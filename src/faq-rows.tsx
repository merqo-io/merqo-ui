import type { ReactElement } from "react";

export type FaqRow = { q: string; a: string };

// Native details keep the rows operable by keyboard and touch with no script.
export function FaqRows({ rows }: { rows: readonly FaqRow[] }): ReactElement {
  return (
    <div className="border-t border-border">
      {rows.map((row) => (
        <details
          key={row.q}
          data-faq-row
          className={[
            "group border-b border-border",
            "[interpolate-size:allow-keywords] details-content:h-0 details-content:overflow-clip",
            "details-content:transition-[height,content-visibility] details-content:duration-200 details-content:ease-out details-content:[transition-behavior:allow-discrete]",
            "open:details-content:h-auto motion-reduce:details-content:duration-1",
          ].join(" ")}
        >
          <summary className="flex min-h-11 cursor-pointer list-none [&::-webkit-details-marker]:hidden items-center justify-between gap-3 py-3 font-semibold outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <span>{row.q}</span>
            <span
              aria-hidden
              className="font-mono after:content-['+'] group-open:after:content-['-']"
            />
          </summary>
          <p className="max-w-[52ch] pb-4 text-muted-foreground">{row.a}</p>
        </details>
      ))}
    </div>
  );
}
