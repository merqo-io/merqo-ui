import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { authCookieOptions, type SchemaOf, type SupabaseConfig } from "./types";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

// The setAll catch covers the read-only Server Component context; middleware
// refreshes the session there instead.
function cookieMethods(cookieStore: CookieStore): CookieMethodsServer {
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      } catch {
        // Read-only context: middleware owns the session refresh.
      }
    },
  };
}

/** Per-request server client that reads and writes the user's session cookies. */
export async function createSupabaseServerClient<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped kits (no generated Database) must still compile
  TDatabase = any,
  TSchema extends SchemaOf<TDatabase> = SchemaOf<TDatabase>,
>(config: SupabaseConfig): Promise<SupabaseClient<TDatabase, TSchema>> {
  const cookieStore = await cookies();
  return createServerClient<TDatabase, TSchema>(config.url, config.publishableKey, {
    cookies: cookieMethods(cookieStore),
    ...(config.schema ? { db: { schema: config.schema as TSchema } } : {}),
    cookieOptions: authCookieOptions(config.cookieDomain),
  });
}

export type SupabaseServiceConfig = {
  url: string;
  /** The secret (service-role) key. Never expose it to the browser bundle. */
  secretKey: string | undefined;
  schema?: string;
};

/**
 * Service-role client that bypasses RLS: use it only in Server Actions and
 * Route Handlers. It deliberately attaches no request cookies. If the user's
 * auth cookies were passed, @supabase/ssr would hydrate their session and run
 * every query as that user (RLS applies), silently breaking admin writes. An
 * empty cookie adapter lets the secret key drive auth.
 */
export function createSupabaseServiceClient<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped kits (no generated Database) must still compile
  TDatabase = any,
  TSchema extends SchemaOf<TDatabase> = SchemaOf<TDatabase>,
>(config: SupabaseServiceConfig): SupabaseClient<TDatabase, TSchema> {
  if (!config.secretKey) {
    throw new Error("Missing required environment variable: SUPABASE_SECRET_KEY");
  }
  return createServerClient<TDatabase, TSchema>(config.url, config.secretKey, {
    cookies: { getAll: () => [], setAll: () => {} },
    auth: { autoRefreshToken: false, persistSession: false },
    ...(config.schema ? { db: { schema: config.schema as TSchema } } : {}),
  });
}
