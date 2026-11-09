import { createHash, timingSafeEqual } from "node:crypto";
import { clientIp, rateLimitCheck, type RateLimitStore } from "./rate-limit";

// Longer than any real kit slug; rejecting early keeps junk out of the lookup
// and out of the failure log.
const MAX_KIT_SLUG_LENGTH = 64;
const DEFAULT_ATTEMPT_LIMIT = 300;
const DEFAULT_WINDOW_SECONDS = 60;
const BEARER_PREFIX = "Bearer ";
// Compared when the slug is unknown so a miss costs the same as a mismatch.
const DECOY_HASH = createHash("sha256").update("decoy").digest("hex");

export interface KitAuthFailure {
  kitSlug: string | null;
  reason: string;
  ip: string | null;
}

/**
 * Where a kit's API-key hashes live. Each kit backs it with its own
 * `kit_api_keys` table. Every method may reject; verifyKitAuth treats that as
 * a failed login, never as an exception for the caller.
 */
export interface KitKeyStore {
  /** The stored sha256 hex of the kit's secret, or null for an unknown slug. */
  getSecretHash(kitSlug: string): Promise<string | null>;
  /** Records a successful use. Best effort. */
  touch?(kitSlug: string): Promise<void>;
  /**
   * Appends an audit row for a failed attempt. Best effort. `kitSlug` comes
   * from the request and is untrusted: sanitise it before logging.
   */
  logFailure?(failure: KitAuthFailure): Promise<void>;
}

export interface KitAuthRateLimit {
  store: RateLimitStore;
  /** Attempts per client IP per window, failed or not. Default 300. */
  limit?: number;
  /**
   * Failures per kit slug per window, across all IPs, that are written to
   * `logFailure`. Defaults to `limit`. It does not throttle guessing (only
   * `limit`, per IP, does) and a valid key always succeeds regardless.
   */
  slugLimit?: number;
  /** Window length in seconds. Default 60. */
  windowSeconds?: number;
  /** Allow requests when the store is down. Default false (fail closed). */
  failOpen?: boolean;
}

export interface VerifyKitAuthOptions {
  store: KitKeyStore;
  rateLimit?: KitAuthRateLimit;
  /** Forwarded to `clientIp`; see `ClientIpOptions.trustedHeaders`. */
  trustedHeaders?: string[];
}

export function hashApiKey(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

// Constant-time for the fixed-length hex digests the store holds; the length
// check only short-circuits on a malformed stored value, never on the secret.
function hashesMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function reject(
  store: KitKeyStore,
  failure: KitAuthFailure,
): Promise<null> {
  console.warn(`verifyKitAuth failed: ${failure.reason}`);
  try {
    await store.logFailure?.(failure);
  } catch {
    console.error("verifyKitAuth: could not log the failure");
  }
  return null;
}

function parseBearer(
  request: Request,
): { kitSlug: string; secret: string } | null {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith(BEARER_PREFIX)) return null;
  const token = header.slice(BEARER_PREFIX.length);
  const sep = token.indexOf(":");
  if (sep <= 0) return null;
  const kitSlug = token.slice(0, sep);
  const secret = token.slice(sep + 1);
  if (!secret || kitSlug.length > MAX_KIT_SLUG_LENGTH) return null;
  return { kitSlug, secret };
}

async function underAttemptLimit(
  limiter: KitAuthRateLimit,
  key: string,
  limit: number | undefined,
): Promise<boolean> {
  const verdict = await rateLimitCheck(
    limiter.store,
    key,
    limit ?? DEFAULT_ATTEMPT_LIMIT,
    limiter.windowSeconds ?? DEFAULT_WINDOW_SECONDS,
  );
  if (verdict === "limited") return false;
  return verdict === "ok" || limiter.failOpen === true;
}

async function lookupHash(
  store: KitKeyStore,
  kitSlug: string,
): Promise<string | null> {
  try {
    return await store.getSecretHash(kitSlug);
  } catch {
    console.error("verifyKitAuth: key lookup failed");
    return null;
  }
}

/**
 * Authenticates a kit-to-kit request carrying `Authorization: Bearer
 * <kit_slug>:<secret>`. The secret is hashed and compared in constant time
 * with the stored hash. Resolves to the caller's slug, or null for any
 * failure (malformed header, unknown slug, wrong secret, rate limited, store
 * outage); it never throws.
 */
export async function verifyKitAuth(
  request: Request,
  options: VerifyKitAuthOptions,
): Promise<{ kitSlug: string } | null> {
  const { store, rateLimit, trustedHeaders } = options;
  const ip = clientIp(request.headers, { trustedHeaders });

  if (
    rateLimit &&
    !(await underAttemptLimit(
      rateLimit,
      `kit-auth:${ip ?? "unknown"}`,
      rateLimit.limit,
    ))
  ) {
    console.warn("verifyKitAuth rate limited");
    return null;
  }

  const parsed = parseBearer(request);
  if (!parsed) {
    return reject(store, {
      kitSlug: null,
      reason: "missing or malformed Authorization header",
      ip,
    });
  }

  const { kitSlug, secret } = parsed;
  const stored = await lookupHash(store, kitSlug);
  const matches = hashesMatch(hashApiKey(secret), stored ?? DECOY_HASH);

  if (stored !== null && matches) {
    try {
      await store.touch?.(kitSlug);
    } catch {
      console.warn("verifyKitAuth: last_used_at update failed");
    }
    return { kitSlug };
  }

  // Slugs are public, so a valid key must never be blocked by someone else's
  // junk tokens: this bucket is checked only after the secret failed. It does
  // not throttle guessing (that is the per-IP limit alone; rotating IPs are
  // bounded by the key's entropy). It only caps how many failures per slug
  // reach logFailure per window, so a flood cannot fill the audit log. The
  // lookup above now runs before this bucket, so junk tokens naming a slug
  // reach the store; the per-IP limit bounds that.
  if (
    rateLimit &&
    !(await underAttemptLimit(
      rateLimit,
      `kit-auth-slug:${kitSlug}`,
      rateLimit.slugLimit ?? rateLimit.limit,
    ))
  ) {
    console.warn("verifyKitAuth slug failure limit reached, not logging");
    return null;
  }
  return reject(store, {
    kitSlug,
    reason: stored === null ? "unknown kit_slug" : "secret mismatch",
    ip,
  });
}
