import type { CspOptions } from "./csp";

// Routes that always render per request, so they can carry a CSP nonce. The
// list is the union of what paykit, loopkit, printkit, stockkit and merqo
// nonce today; a prefix a kit has no route for is harmless.
export const NONCE_PREFIXES: readonly string[] = [
  "/admin",
  "/mfa",
  "/dashboard",
  "/pay",
  "/inquire",
  "/auth",
  "/login",
  "/reset-password",
  "/legal/accept",
  "/c",
  "/earn",
  "/setup",
  "/profile",
  "/no-access",
  "/post-login",
];

/**
 * True for routes that render per request and so can carry a CSP nonce. A
 * nonce on a statically prerendered page leaves its scripts unstamped and
 * blocked, so every other route keeps the static policy. Matches whole path
 * segments: `/c` covers `/c/shop` but not `/contact`.
 */
export function needsNonce(
  pathname: string,
  prefixes: readonly string[] = NONCE_PREFIXES,
): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Hash of next-themes' minified inline bootstrap in a production build. A
// next-themes bump can change it; each kit's CSP e2e fails on any violation.
export const THEME_SCRIPT_HASH: string =
  "'sha256-n46vPwSWuMC0W703pBofImv82Z26xo4LXymv0E9caPk='";

const SUPABASE = "https://*.supabase.co";
const SUPABASE_WS = "wss://*.supabase.co";
const GOOGLE_AVATARS = "https://*.googleusercontent.com";
const VERCEL_TOOLBAR = "https://vercel.live";

export type SecurityHeadersOptions = {
  isDev: boolean;
  /** Build the options for a per-request nonce route (adds the theme script hash). */
  nonce?: boolean;
  /** `NEXT_PUBLIC_SUPABASE_URL`; its origin is allowed too so a local stack works in a production build. */
  supabaseUrl?: string;
  /** `VERCEL_ENV`; the Vercel toolbar is allowed on every deployment except `production`. */
  vercelEnv?: string;
  /** Overrides the next-themes hash; `null` omits it. */
  themeScriptHash?: string | null;
};

function configuredOrigin(supabaseUrl: string | undefined): {
  http: string[];
  ws: string[];
} {
  try {
    const { origin } = new URL(supabaseUrl ?? "");
    return { http: [origin], ws: [origin.replace(/^http/, "ws")] };
  } catch {
    return { http: [], ws: [] };
  }
}

/**
 * The source lists every kit passes to `buildCsp`. Pure: it reads no
 * environment, so each kit passes its own literal `process.env.*` values.
 */
export function buildSecurityHeaders({
  isDev,
  nonce = false,
  supabaseUrl,
  vercelEnv,
  themeScriptHash = THEME_SCRIPT_HASH,
}: SecurityHeadersOptions): Omit<CspOptions, "nonce"> {
  const configured = configuredOrigin(supabaseUrl);
  const preview = vercelEnv === "production" ? [] : [VERCEL_TOOLBAR];
  return {
    isDev,
    connectSrc: [
      SUPABASE,
      SUPABASE_WS,
      ...configured.http,
      ...configured.ws,
      ...preview,
    ],
    imgSrc: [SUPABASE, GOOGLE_AVATARS, ...configured.http, ...preview],
    frameSrc: preview,
    scriptSrc: [
      ...preview,
      ...(nonce && themeScriptHash ? [themeScriptHash] : []),
    ],
  };
}
