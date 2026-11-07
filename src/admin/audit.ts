/** Smallest slice of a Supabase client the audit writers use. */
export type AuditClient = {
  from(table: string): {
    insert(row: Record<string, unknown>): PromiseLike<{
      error: { message?: string; code?: string } | null;
    }>;
  };
};

/** A client, or the (possibly async) factory a kit already has for it. */
export type AuditClientSource<C extends AuditClient = AuditClient> =
  | C
  | (() => C | Promise<C>);

export type AuditEntry<A extends string = string> = {
  /** `auth.users.id` of whoever acted; the column is a plain FK, not admin-only. */
  actorId: string;
  action: A;
  targetId: string | null;
  detail: unknown;
};

export type OpsEventInput<K extends string = string> = {
  vendorId: string;
  kind: K;
  ref: string;
  code: string;
};

/** Longest `ref` / `code` stored; matches the kits' `ops_events` columns. */
export const OPS_EVENT_MAX_FIELD = 64;

async function resolveClient<C extends AuditClient>(
  source: AuditClientSource<C>,
): Promise<C> {
  return typeof source === "function" ? await source() : source;
}

function failureCode(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: unknown }).code);
  }
  return err instanceof Error ? err.name : "unknown";
}

function failureMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "unknown";
}

function logFailure(table: string, err: unknown): void {
  console.error(`${table} insert failed`, failureMessage(err), failureCode(err));
}

/**
 * Appends a row to `admin_audit`. The trail is best-effort: a failure is
 * logged (message and code, never the row) and swallowed, so it can never fail
 * the action it records. The table has no INSERT policy for authenticated or
 * anon users, so pass a service-role client. `A` keeps each kit's own action
 * names type-checked locally.
 */
export async function recordAudit<A extends string = string>(
  source: AuditClientSource,
  entry: AuditEntry<A>,
): Promise<void> {
  try {
    const client = await resolveClient(source);
    const { error } = await client.from("admin_audit").insert({
      admin_id: entry.actorId,
      action: entry.action,
      target_id: entry.targetId,
      detail: entry.detail,
    });
    if (error) logFailure("admin_audit", error);
  } catch (err) {
    logFailure("admin_audit", err);
  }
}

/**
 * Appends one failure row to `ops_events`. Never throws, so the failing
 * request keeps its own error. `ref` and `code` are cut to 64 characters to
 * satisfy the table's length checks; the row itself is never logged.
 */
export async function recordOpsEvent<K extends string = string>(
  source: AuditClientSource,
  event: OpsEventInput<K>,
): Promise<void> {
  try {
    const client = await resolveClient(source);
    const { error } = await client.from("ops_events").insert({
      vendor_id: event.vendorId,
      kind: event.kind,
      ref: event.ref.slice(0, OPS_EVENT_MAX_FIELD),
      code: event.code.slice(0, OPS_EVENT_MAX_FIELD),
    });
    if (error) logFailure("ops_events", error);
  } catch (err) {
    logFailure("ops_events", err);
  }
}
