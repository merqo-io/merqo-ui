import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, robotsHeaderFor, withNonceCsp } from "../security/csp";
import { buildSecurityHeaders, needsNonce } from "../security/headers";

const CSP = "Content-Security-Policy";

export type ProxyOptions = {
  /** The kit's Supabase session refresh. It builds the response the headers are added to. */
  updateSession: (request: NextRequest) => Promise<NextResponse> | NextResponse;
  /** Route prefixes that get a nonce; defaults to `NONCE_PREFIXES`. */
  noncePrefixes?: readonly string[];
  /** Pass the literal `process.env.NEXT_PUBLIC_SUPABASE_URL` so Next inlines it. */
  supabaseUrl?: string;
  /** Defaults to `NODE_ENV !== "production"`, read per request. */
  isDev?: boolean;
  /** Defaults to `VERCEL_ENV`, read per request. */
  vercelEnv?: string;
};

// Browsers enforce frame-ancestors on localhost too, which blocks IDE preview panes.
const devCsp = (csp: string) => csp.replace("; frame-ancestors 'none'", "");

/**
 * Builds the kit's `proxy` (Next 16 middleware): a nonce CSP on per-request
 * routes, the static CSP elsewhere, and `noindex` off production. Dev always
 * keeps the static policy because React needs eval there and next-themes
 * renders its script differently.
 *
 * A kit wraps it in `src/proxy.ts` and still exports its own `config.matcher`,
 * which Next must read statically.
 */
export function createProxy(
  options: ProxyOptions,
): (request: NextRequest) => Promise<NextResponse> {
  const { updateSession, noncePrefixes, supabaseUrl } = options;

  return async function proxy(request: NextRequest): Promise<NextResponse> {
    const isDev = options.isDev ?? process.env.NODE_ENV !== "production";
    const vercelEnv = options.vercelEnv ?? process.env.VERCEL_ENV;

    let csp: string | null;
    if (isDev || !needsNonce(request.nextUrl.pathname, noncePrefixes)) {
      const built = buildCsp(
        buildSecurityHeaders({ isDev, supabaseUrl, vercelEnv }),
      );
      csp = isDev ? devCsp(built) : built;
    } else {
      // The nonce must be on the request before updateSession builds its response.
      csp = withNonceCsp(
        request,
        NextResponse.next(),
        buildSecurityHeaders({ isDev, nonce: true, supabaseUrl, vercelEnv }),
      ).headers.get(CSP);
    }

    const response = await updateSession(request);
    if (csp) response.headers.set(CSP, csp);
    const robots = robotsHeaderFor(vercelEnv);
    if (robots) response.headers.set(robots.key, robots.value);
    return response;
  };
}
