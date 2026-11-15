import { NextResponse } from "next/server";
import { safeRedirectPath } from "../safe-redirect";

export const AUTH_CONFIRM_TYPES = [
  "recovery",
  "signup",
  "invite",
  "magiclink",
  "email_change",
  "email",
] as const;

export type AuthConfirmType = (typeof AUTH_CONFIRM_TYPES)[number];

const MAX_TOKEN_HASH_LENGTH = 512;

export function isAuthConfirmType(value: unknown): value is AuthConfirmType {
  return typeof value === "string" && (AUTH_CONFIRM_TYPES as readonly string[]).includes(value);
}

/** The one client method the confirm handler needs, so tests and kits can pass any Supabase client. */
export type AuthConfirmClient = {
  auth: {
    verifyOtp(params: {
      token_hash: string;
      type: AuthConfirmType;
    }): PromiseLike<{ data: unknown; error: unknown }>;
  };
};

export type AuthConfirmOptions<TClient extends AuthConfirmClient> = {
  /** Builds the request-scoped server client that stores the new session cookies. */
  createClient: () => Promise<TClient>;
  /** Where to land when `next` is absent or not a same-origin path, e.g. "/dashboard". */
  defaultNext: string;
  /** Sign-in page that receives `?error=link` on failure. Defaults to "/login". */
  loginPath?: string;
  /** Runs after a successful verification, before the redirect (e.g. creating the vendor row). */
  afterSignIn?: (supabase: TClient) => Promise<void>;
  /**
   * A `recovery` verification goes to `path` instead of `next`, and
   * `onRecovery` may decorate the response (e.g. mint a short recovery-window cookie).
   */
  recovery?: {
    path: string;
    onRecovery?: (context: {
      supabase: TClient;
      data: unknown;
      response: NextResponse;
    }) => Promise<void>;
  };
};

export type AuthConfirmParams = {
  tokenHash: string;
  type: AuthConfirmType;
  next: string | null;
};

function validTokenHash(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_TOKEN_HASH_LENGTH;
}

/**
 * Reads `token_hash`, `type` and `next` from a query string and applies the
 * same validation as `handleAuthConfirm`. Returns null for a missing,
 * oversized or unknown-type link, so a page can show its "link invalid" state.
 */
export function readAuthConfirmParams(searchParams: URLSearchParams): AuthConfirmParams | null {
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  if (!validTokenHash(tokenHash) || !isAuthConfirmType(type)) return null;
  return { tokenHash, type, next: searchParams.get("next") };
}

/**
 * Login-CSRF guard. With an `Origin` header it must equal the request origin;
 * without one, `Sec-Fetch-Site` must be present and exactly "same-origin".
 * A request carrying neither header is rejected, so an attacker cannot make a
 * victim's browser post the attacker's own token and sign them into the
 * attacker's account.
 */
function isSameOriginPost(request: Request, origin: string): boolean {
  const originHeader = request.headers.get("origin");
  if (originHeader !== null) return originHeader === origin;
  return request.headers.get("sec-fetch-site") === "same-origin";
}

/**
 * POST handler body for `/auth/confirm/verify`: verifies the emailed
 * `token_hash` with `verifyOtp`, then redirects (303). The GET page must never
 * verify, because email scanners pre-fetch links; only this POST consumes the
 * token. `next` passes through `safeRedirectPath`. A non-POST, a cross-origin
 * post (Origin must equal the request origin; with no Origin, Sec-Fetch-Site
 * must be "same-origin"), a missing, empty or over-512 character `token_hash`,
 * an unknown `type`, a failed or thrown verification and a throwing
 * `afterSignIn` all go to `loginPath?error=link`.
 */
export async function handleAuthConfirm<TClient extends AuthConfirmClient>(
  request: Request,
  options: AuthConfirmOptions<TClient>,
): Promise<NextResponse> {
  const { origin } = new URL(request.url);
  const loginPath = options.loginPath ?? "/login";
  const redirect = (path: string): NextResponse =>
    NextResponse.redirect(`${origin}${path}`, 303);
  const failure = (): NextResponse => redirect(`${loginPath}?error=link`);

  if (request.method !== "POST" || !isSameOriginPost(request, origin)) return failure();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return failure();
  }
  const tokenHash = form.get("token_hash");
  const type = form.get("type");
  const next = form.get("next");
  if (!validTokenHash(tokenHash) || !isAuthConfirmType(type)) return failure();
  const safeNext = safeRedirectPath(typeof next === "string" ? next : null, options.defaultNext);

  let supabase: TClient;
  let data: unknown;
  try {
    supabase = await options.createClient();
    const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (result.error) return failure();
    data = result.data;
    await options.afterSignIn?.(supabase);
  } catch {
    return failure();
  }

  const { recovery } = options;
  if (!recovery || type !== "recovery") return redirect(safeNext);

  const response = redirect(recovery.path);
  try {
    await recovery.onRecovery?.({ supabase, data, response });
  } catch {
    return failure();
  }
  return response;
}

function parseAbsoluteOrigin(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  const localhost = url.hostname === "localhost";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && localhost)) return null;
  return url.origin;
}

/**
 * For the merqo entry page: a link whose `redirect_to` points at another
 * allowlisted kit origin is forwarded to that kit's own `/auth/confirm`, so the
 * session is verified on the origin that keeps it. Returns the forward URL, or
 * null when this app should handle the link itself (no, unparsable, unlisted or
 * own-origin `redirect_to`, or a missing or invalid `token_hash` / `type`).
 * Origins are compared exactly after `new URL` normalisation; the path of
 * `redirect_to` is ignored and only its `next` query param is carried over.
 */
export function authConfirmForwardUrl(
  requestUrl: string | URL,
  options: { allowedOrigins: readonly string[]; selfOrigin: string },
): string | null {
  let url: URL;
  try {
    url = new URL(requestUrl);
  } catch {
    return null;
  }
  const params = readAuthConfirmParams(url.searchParams);
  const redirectTo = url.searchParams.get("redirect_to");
  if (!params || !redirectTo) return null;

  const target = parseAbsoluteOrigin(redirectTo);
  if (!target || target === options.selfOrigin) return null;
  if (!options.allowedOrigins.includes(target)) return null;

  const forward = new URL("/auth/confirm", target);
  forward.searchParams.set("token_hash", params.tokenHash);
  forward.searchParams.set("type", params.type);
  const next = new URL(redirectTo).searchParams.get("next");
  if (next) forward.searchParams.set("next", next);
  return forward.toString();
}
