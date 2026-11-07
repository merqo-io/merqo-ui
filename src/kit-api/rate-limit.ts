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

export interface ClientIpOptions {
  /**
   * Header names to read, in priority order. Only list headers that your
   * platform's proxy sets or overwrites: any other header is client-controlled
   * and lets a caller rotate its IP to get a fresh bucket. For
   * `x-forwarded-for` the LAST hop is used (the one a proxy appended); for
   * every other header the first hop. Default: `["x-vercel-forwarded-for"]`,
   * which assumes the app is deployed on Vercel, where the edge overwrites it.
   */
  trustedHeaders?: string[];
}

const DEFAULT_TRUSTED_HEADERS: string[] = ["x-vercel-forwarded-for"];

function headerIp(headers: Headers, name: string): string | undefined {
  const hops = (headers.get(name) ?? "")
    .split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);
  return name.toLowerCase() === "x-forwarded-for" ? hops.at(-1) : hops[0];
}

/**
 * Best-effort client IP read only from the trusted headers (see
 * `ClientIpOptions`). It is only as trustworthy as those headers: behind a
 * proxy that does not overwrite them, a client can forge them. A value that
 * is not an IP address yields null, so a caller cannot mint a fresh bucket per
 * garbage string. Callers decide what null means: a shared strict bucket, or
 * skipping the per-IP check.
 */
export function clientIp(
  headers: Headers,
  options: ClientIpOptions = {},
): string | null {
  for (const name of options.trustedHeaders ?? DEFAULT_TRUSTED_HEADERS) {
    const value = headerIp(headers, name);
    if (value) return isIP(value) === 0 ? null : value;
  }
  return null;
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
