import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authCookieOptions, type SchemaOf, type SupabaseConfig } from "./types";

/** Browser Supabase client; the kit supplies its own Database type and schema. */
export function createSupabaseBrowserClient<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped kits (no generated Database) must still compile
  TDatabase = any,
  TSchema extends SchemaOf<TDatabase> = SchemaOf<TDatabase>,
>(config: SupabaseConfig): SupabaseClient<TDatabase, TSchema> {
  return createBrowserClient<TDatabase, TSchema>(config.url, config.publishableKey, {
    ...(config.schema ? { db: { schema: config.schema as TSchema } } : {}),
    cookieOptions: authCookieOptions(config.cookieDomain),
  });
}
