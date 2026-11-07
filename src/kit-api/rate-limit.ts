import { createHash } from "node:crypto";
import { isIP } from "node:net";

/**
 * Counter store behind the limiter. Each kit backs it with its own database
 * function (for example a `check_rate_limit` RPC); this package never talks
 * to a database. `hit` counts one call and resolves true while the caller is
 * still within `limit` for the current fixed window. It may throw or reject
 * when the store is unreachable.
 */
export interface RateLimitStore {
  hit(key: string, limit: number, windowSeconds: number): Promise<boolean>;
}

export type RateLimitVerdict = "ok" | "limited" | "error";

/**
 * Counts one hit and tells a denied call ("limited") apart from a store that
 * could not answer ("error"), so a caller that fails closed can say which.
 */
export async function rateLimitCheck(
  store: RateLimitStore,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitVerdict> {
  try {
    return (await store.hit(key, limit, windowSeconds)) ? "ok" : "limited";
  } catch (err) {
    // The name only: a store error message can quote the key it was given.
    console.error(
      "rateLimit unavailable",
      err instanceof Error ? err.name : "unknown error",
    );
    return "error";
  }
}

/**
 * True when the call is allowed. Fails open: a store outage never blocks a
 * legitimate caller. Use `rateLimitStrict` where the limiter is the only
 * brake on guessing a secret or claiming a payment.
 */
export async function rateLimit(
  store: RateLimitStore,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  return (await rateLimitCheck(store, key, limit, windowSeconds)) !== "limited";
}

/** Same check as `rateLimit` but a store error denies the call. */
export async function rateLimitStrict(
  store: RateLimitStore,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  return (await rateLimitCheck(store, key, limit, windowSeconds)) === "ok";
}

/**
 * Best-effort client IP without trusting spoofable input. Order: first hop of
 * `x-vercel-forwarded-for` (set by Vercel's edge), `x-real-ip`, then the LAST
 * `x-forwarded-for` hop (the one a proxy appended; earlier hops are whatever
 * the client claimed). A value that is not an IP address yields null, so a
 * caller cannot mint a fresh bucket per garbage string. Callers decide what
 * null means: a shared strict bucket, or skipping the per-IP check.
 */
export function clientIp(headers: Headers): string | null {
  const vercel = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  const real = headers.get("x-real-ip")?.trim();
  const hops = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);
  const chosen = vercel || real || hops[hops.length - 1];
  if (!chosen || isIP(chosen) === 0) return null;
  return chosen;
}

/** Counter keys carry digests only, so the store holds no raw IPs or ids. */
export function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/**
 * Fixed-window in-process store for tests and single-instance tools. State is
 * per process, so on a serverless host it limits nothing across instances.
 */
export function createMemoryRateLimitStore(
  now: () => number = Date.now,
): RateLimitStore {
  const windows = new Map<string, { start: number; count: number }>();
  return {
    hit(key, limit, windowSeconds) {
      const current = now();
      const entry = windows.get(key);
      if (!entry || current - entry.start >= windowSeconds * 1000) {
        windows.set(key, { start: current, count: 1 });
        return Promise.resolve(limit >= 1);
      }
      entry.count += 1;
      return Promise.resolve(entry.count <= limit);
    },
  };
}
