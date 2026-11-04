import * as React from "react";
import { formatCatalogPrice } from "./plan-catalog";
import type { CatalogPlan, PlanCatalog } from "./plan-catalog";

export interface PricingLadderProps {
  catalog: PlanCatalog;
  /** Plan to emphasise. Falls back to the other option when absent. */
  highlight?: "qkit" | "all_access";
  /** Show only these slugs; catalog order is kept. */
  slugs?: string[];
  /** Per-slug description overrides. */
  descriptions?: Partial<Record<string, React.ReactNode>>;
  /** Call-to-action rendered inside each plan card. */
  renderAction?: (plan: CatalogPlan) => React.ReactNode;
  /** Render the Event Pass section below the ladder. Default true. */
  showEventPass?: boolean;
}

// Starter is framed by who it suits, never by price, so it is not read as the
// bargain option.
const DEFAULT_DESCRIPTIONS: Record<string, React.ReactNode> = {
  starter: "For testing the waters as a solo operator.",
};

function resolveHighlight(
  plans: CatalogPlan[],
  preferred: "qkit" | "all_access",
): string | null {
  const other = preferred === "qkit" ? "all_access" : "qkit";
  for (const slug of [preferred, other]) {
    if (plans.some((plan) => plan.slug === slug)) return slug;
  }
  return null;
}

export function PricingLadder({
  catalog,
  highlight = "qkit",
  slugs,
  descriptions,
  renderAction,
  showEventPass = true,
}: PricingLadderProps) {
  const headingId = React.useId();
  const plans = slugs
    ? catalog.plans.filter((plan) => slugs.includes(plan.slug))
    : catalog.plans;
  const highlighted = resolveHighlight(plans, highlight);
  const pass = catalog.event_pass;

  return (
    <div className="space-y-8">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]">
        {plans.map((plan) => {
          const isHighlighted = plan.slug === highlighted;
          const description =
            descriptions?.[plan.slug] ?? DEFAULT_DESCRIPTIONS[plan.slug];
          const isFree = plan.monthly_cents === 0;
          return (
            <li
              key={plan.slug}
              aria-current={isHighlighted ? "true" : undefined}
              className={
                isHighlighted
                  ? "flex flex-col gap-3 rounded-2xl border-2 border-primary bg-card p-5 text-card-foreground"
                  : "flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-card-foreground"
              }
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {isHighlighted ? (
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                    Recommended
                  </span>
                ) : null}
              </div>
              <div>
                {isFree ? (
                  <p className="text-2xl font-bold">Free</p>
                ) : (
                  <>
                    <p className="text-2xl font-bold">
                      {formatCatalogPrice(plan.monthly_cents)}
                      <span className="text-sm font-normal text-muted-foreground">
                        {" a month"}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {`or ${formatCatalogPrice(plan.annual_cents)} a year`}
                    </p>
                  </>
                )}
              </div>
              {description ? (
                <div className="text-sm text-muted-foreground">
                  {description}
                </div>
              ) : null}
              {renderAction ? (
                <div className="mt-auto pt-2">{renderAction(plan)}</div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {showEventPass ? (
        <section
          aria-labelledby={headingId}
          className="rounded-2xl border border-border bg-muted p-5 text-foreground"
        >
          <h3 id={headingId} className="text-lg font-semibold">
            Event Pass
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {`Running a one-off stall? Prepay a minimum of ${formatCatalogPrice(pass.min_cents)}, then pay ${formatCatalogPrice(pass.per_cup_cents)} per cup, never more than ${formatCatalogPrice(pass.cap_cents)}. It covers ${pass.days} ${pass.days === 1 ? "day" : "days"}.`}
          </p>
        </section>
      ) : null}
    </div>
  );
}
