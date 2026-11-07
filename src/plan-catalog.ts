import { z } from "zod";
import { formatMoney } from "./money";

const cents = z.number().int().nonnegative();

// `kind` and `kits` stay free strings: merqo adds plan kinds and kit slugs
// without a release of this package.
const catalogPlanSchema = z.object({
  slug: z.string().min(1),
  kind: z.string(),
  name: z.string().min(1),
  monthly_cents: cents,
  annual_cents: cents,
  kits: z.array(z.string()),
});

const eventPassSchema = z.object({
  per_cup_cents: cents,
  min_cents: cents,
  cap_cents: cents,
  days: z.number().int().positive(),
});

export const planCatalogSchema = z.object({
  plans: z.array(catalogPlanSchema),
  event_pass: eventPassSchema,
});

export type PlanCatalog = z.infer<typeof planCatalogSchema>;
export type CatalogPlan = z.infer<typeof catalogPlanSchema>;
export type EventPass = z.infer<typeof eventPassSchema>;

/**
 * Fetches merqo's public plan catalog. Resolves to `null` on any failure
 * (network error, timeout, non-2xx, bad JSON, unexpected shape) so a plan page
 * can render a fallback instead of crashing the route.
 */
export async function fetchPlanCatalog(
  baseUrl: string,
  init?: RequestInit,
): Promise<PlanCatalog | null> {
  try {
    let base = baseUrl;
    while (base.endsWith("/")) base = base.slice(0, -1);
    const url = `${base}/api/plans`;
    const response = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
      ...init,
    } as RequestInit);
    if (!response.ok) return null;
    const parsed = planCatalogSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** 1600 -> "S$16", 1333 -> "S$13.33", 15 -> "15c". */
export function formatCatalogPrice(valueCents: number): string {
  if (valueCents > 0 && valueCents < 100) return `${valueCents}c`;
  return formatMoney(valueCents, { trimWholeDollars: true });
}
