// Kept out of account-menu.tsx ("use client") so Server Components can call
// tierLabel; a function imported from a client module is an opaque reference.
const TIER_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  qkit: "Pro",
  paid: "Pro",
};

/**
 * Maps a raw plan tier (case-insensitive) to its display label. Known tiers
 * use their canonical label; any other non-empty value gets its first letter
 * upper-cased, so an already-formatted label such as "Pro" is unchanged.
 */
export function tierLabel(tier: string): string {
  const known = TIER_LABELS[tier.toLowerCase()];
  if (known) return known;
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
