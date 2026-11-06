import { describe, expect, it } from "vitest";
import {
  ENTITLEMENT_TIERS,
  ENTITLEMENT_TIER_LABELS,
  entitlementTierSchema,
} from "./entitlement";
import * as contracts from "./vendor-activity";

describe("entitlement contract", () => {
  it("accepts exactly the wire tiers", () => {
    for (const tier of ["free", "starter", "qkit", "paid"]) {
      expect(entitlementTierSchema.safeParse(tier).success).toBe(true);
    }
    expect(entitlementTierSchema.safeParse("pro").success).toBe(false);
    expect(entitlementTierSchema.safeParse("").success).toBe(false);
    expect(ENTITLEMENT_TIERS).toEqual(["free", "starter", "qkit", "paid"]);
  });

  it("labels every tier, with qkit and paid both Pro", () => {
    expect(ENTITLEMENT_TIER_LABELS).toEqual({
      free: "Free",
      starter: "Starter",
      qkit: "Pro",
      paid: "Pro",
    });
  });

  it("is re-exported from the contracts entry module", () => {
    expect(contracts.entitlementTierSchema).toBe(entitlementTierSchema);
  });
});
