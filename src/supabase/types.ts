/** Schema names a `Database` type declares, as `@supabase/ssr` constrains them. */
export type SchemaOf<TDatabase> = string & keyof Omit<TDatabase, "__InternalSupabase">;

/** Public project settings every kit passes to the client factories. */
export type SupabaseConfig = {
  url: string;
  publishableKey: string;
  /** Postgres schema the kit's tables live in, e.g. "qkit". */
  schema?: string;
  /** Shared parent domain (e.g. ".merqo.io") so one sign-in covers every kit. */
  cookieDomain?: string;
};

/** `undefined` keeps the host-only default cookie when no shared domain is set. */
export function authCookieOptions(
  cookieDomain: string | undefined,
): { domain: string } | undefined {
  return cookieDomain ? { domain: cookieDomain } : undefined;
}
