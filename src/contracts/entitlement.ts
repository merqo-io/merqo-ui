import { z } from "zod";
import { tierLabel } from "../tier-label";

/**
 * The plan tiers merqo puts on the entitlement wire. paykit and stockkit each
 * kept their own copy of this list.
 */
export const ENTITLEMENT_TIERS = ["free", "starter", "qkit", "paid"] as const;

export const entitlementTierSchema = z.enum(ENTITLEMENT_TIERS);

export type EntitlementTier = z.infer<typeof entitlementTierSchema>;

/**
 * Display label per wire tier, derived from `tierLabel` so the two cannot
 * drift. `qkit` and `paid` both show as "Pro". A kit with its own free/pro
 * vocabulary (stockkit) maps `pro` to `paid` on the wire and `free` to `free`.
 */
export const ENTITLEMENT_TIER_LABELS: Record<EntitlementTier, string> =
  Object.fromEntries(
    ENTITLEMENT_TIERS.map((tier) => [tier, tierLabel(tier)]),
  ) as Record<EntitlementTier, string>;
