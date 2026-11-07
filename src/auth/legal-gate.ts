import { LEGAL_VERSIONS } from "../legal/version";

const TTL_MS = 5 * 60 * 1000;
const DEFAULT_MERQO_BASE_URL = "https://www.merqo.io";
const CACHE_TABLE = "legal_check_state";

type CacheRow = { checked_at: string; is_current: boolean };

/** The table shape the cache needs: email, checked_at and is_current columns. */
type LegalCacheTable = {
  select(columns: string): {
    eq(column: string, value: string): { maybeSingle(): PromiseLike<{ data: CacheRow | null; error?: unknown }> };
  };
  upsert(row: {
    email: string;
    checked_at: string;
    is_current: boolean;
  }): PromiseLike<{ error: unknown }>;
};

/**
 * A service-role Supabase client scoped to the kit's schema. Typed loosely on
 * purpose: matching the real client's generic query builder structurally
 * overflows the compiler, so the cache table's shape is asserted internally.
 */
export type LegalGateClient = { from(table: never): unknown };

export type LegalGateOptions = {
  /** Service-role client scoped to the kit's schema. */
  createClient: () => Promise<LegalGateClient> | LegalGateClient;
  /** `MERQO_CUSTOMER_SECRET`. Without it the gate cannot ask merqo and fails closed. */
  customerSecret: string | undefined;
  /** `MERQO_BASE_URL`; defaults to https://www.merqo.io. */
  merqoBaseUrl?: string;
  /** Overridable for tests. */
  fetchImpl?: typeof fetch;
};

function isCurrent(status: { terms?: unknown; privacy?: unknown }): boolean {
  const { terms, privacy } = status;
  if (typeof terms !== "string" || typeof privacy !== "string" || !terms || !privacy) return false;
  return terms >= LEGAL_VERSIONS.terms && privacy >= LEGAL_VERSIONS.privacy;
}

async function readLegalAcceptance(email: string, options: LegalGateOptions): Promise<boolean> {
  const normalized = email.toLowerCase();
  const client = await options.createClient();
  const supabase = client as unknown as { from(table: string): LegalCacheTable };

  const { data: cached, error: cacheError } = await supabase
    .from(CACHE_TABLE)
    .select("checked_at, is_current")
    .eq("email", normalized)
    .maybeSingle();

  // A failed read is only a cache miss; merqo stays the source of truth.
  if (cacheError) console.error("checkLegalAcceptance: cache select failed", cacheError);

  if (cached) {
    const age = Date.now() - new Date(cached.checked_at).getTime();
    // A future-dated row (clock skew) would otherwise look fresh forever.
    if (age >= 0 && age < TTL_MS) return cached.is_current;
  }

  if (!options.customerSecret) return false;

  let current = false;
  try {
    const url = new URL("/api/merqo/legal-status", options.merqoBaseUrl ?? DEFAULT_MERQO_BASE_URL);
    url.searchParams.set("email", normalized);
    const res = await (options.fetchImpl ?? fetch)(url, {
      headers: { Authorization: `Bearer ${options.customerSecret}` },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) current = isCurrent((await res.json()) as { terms?: unknown; privacy?: unknown });
  } catch (err) {
    console.error("checkLegalAcceptance: merqo legal-status call failed", err);
    return false;
  }

  // Persisting the cache must never override the authoritative answer: a
  // vendor merqo says is current stays current when the upsert errors or throws.
  try {
    const { error } = await supabase.from(CACHE_TABLE).upsert({
      email: normalized,
      checked_at: new Date().toISOString(),
      is_current: current,
    });
    if (error) console.error("checkLegalAcceptance: cache upsert failed", error);
  } catch (err) {
    console.error("checkLegalAcceptance: cache upsert threw", err);
  }

  return current;
}

/**
 * Is this vendor's terms and privacy acceptance current with `LEGAL_VERSIONS`?
 *
 * The kit does not own the acceptance record; merqo does, so the check is an
 * HTTP call to merqo's `/api/merqo/legal-status`. It runs on every gated
 * dashboard render, so the answer is cached per email in the kit's
 * `legal_check_state` table for 5 minutes.
 *
 * Fails closed: a missing secret, an unreachable merqo, a non-2xx response, a
 * malformed body or a client error all resolve to `false`, which sends the
 * vendor to the accept page. Only the cache write fails open.
 */
export async function checkLegalAcceptance(
  email: string,
  options: LegalGateOptions,
): Promise<boolean> {
  try {
    return await readLegalAcceptance(email, options);
  } catch {
    return false;
  }
}
