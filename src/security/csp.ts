import type { NextRequest, NextResponse } from "next/server";

export type CspOptions = {
  /** Per-request nonce. Without one, scripts fall back to `'unsafe-inline'` (static routes). */
  nonce?: string;
  isDev: boolean;
  connectSrc?: string[];
  imgSrc?: string[];
  frameSrc?: string[];
  scriptSrc?: string[];
};

const join = (parts: (string | undefined | false)[]) => parts.filter(Boolean).join(" ");

/**
 * Builds the Content-Security-Policy value. `style-src` keeps
 * `'unsafe-inline'` because React `style={}` attributes are not covered by nonces.
 */
export function buildCsp({
  nonce,
  isDev,
  connectSrc = [],
  imgSrc = [],
  frameSrc = [],
  scriptSrc = [],
}: CspOptions): string {
  const script = join([
    "script-src 'self'",
    nonce ? `'nonce-${nonce}' 'strict-dynamic'` : "'unsafe-inline'",
    isDev && "'unsafe-eval'",
    ...scriptSrc,
  ]);
  return [
    "default-src 'self'",
    script,
    "style-src 'self' 'unsafe-inline'",
    join(["img-src 'self' data: blob:", ...imgSrc]),
    "font-src 'self' data:",
    join(["connect-src 'self'", ...connectSrc]),
    join(["frame-src 'self'", ...frameSrc]),
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export function createNonce(): string {
  return btoa(crypto.randomUUID());
}

/** `noindex` for every deployment except production. */
export function robotsHeaderFor(
  vercelEnv: string | undefined,
): { key: "X-Robots-Tag"; value: "noindex, nofollow" } | null {
  return vercelEnv === "production"
    ? null
    : { key: "X-Robots-Tag", value: "noindex, nofollow" };
}

/**
 * Mints a nonce and sets it as `x-nonce` plus the CSP on the request (so
 * Next.js can stamp its scripts) and on the response. Returns `response`.
 */
export function withNonceCsp(
  request: NextRequest,
  response: NextResponse,
  opts: Omit<CspOptions, "nonce">,
): NextResponse {
  const nonce = createNonce();
  const csp = buildCsp({ ...opts, nonce });
  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy", csp);
  response.headers.set("Content-Security-Policy", csp);
  return response;
}
