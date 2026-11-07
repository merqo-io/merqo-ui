export type PublicEnv = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

export type PublicEnvSource = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
};

function req(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/**
 * Fails fast with the name of the missing variable instead of a cryptic error
 * inside supabase-js. The kit passes the values in because Next only inlines
 * `process.env.NEXT_PUBLIC_*` references written literally in its own source:
 *
 *   readPublicEnv({
 *     NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
 *     NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
 *   })
 *
 * Holds `NEXT_PUBLIC_*` values only, so a kit may use the result from client
 * code. Secrets stay out of it.
 */
export function readPublicEnv(source: PublicEnvSource): PublicEnv {
  return {
    supabaseUrl: req("NEXT_PUBLIC_SUPABASE_URL", source.NEXT_PUBLIC_SUPABASE_URL),
    supabasePublishableKey: req(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  };
}
