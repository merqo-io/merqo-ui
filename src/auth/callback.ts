import { NextResponse } from "next/server";
import { safeRedirectPath } from "../safe-redirect";

/** The one client method the callback needs, so tests and kits can pass any Supabase client. */
export type AuthCallbackClient = {
  auth: {
    exchangeCodeForSession(code: string): PromiseLike<{ data: unknown; error: unknown }>;
  };
};

export type AuthCallbackOptions<TClient extends AuthCallbackClient> = {
  /** Builds the request-scoped server client that stores the new session cookies. */
  createClient: () => Promise<TClient>;
  /** Where to land when `next` is absent or not a same-origin path, e.g. "/dashboard". */
  defaultNext: string;
  /** Sign-in page that receives `?error=oauth` on failure. Defaults to "/login". */
  loginPath?: string;
  /**
   * Cookie the sign-in page uses to carry `next` through an OAuth round-trip.
   * Read when the query has no `next`, and cleared on every redirect.
   */
  nextCookie?: { name: string; path: string };
  /** Runs after a successful exchange, before the redirect (e.g. creating the vendor row). */
  afterSignIn?: (supabase: TClient) => Promise<void>;
  /**
   * A password-reset link's exchange reports `redirectType: "recovery"`. When
   * set, that exchange goes to `path` instead of `next`, and `onRecovery` may
   * decorate the response (e.g. mint a short recovery-window cookie).
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

function readNextCookie(request: Request, cookieName: string): string | null {
  const entry = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));
  if (!entry) return null;
  try {
    return decodeURIComponent(entry.slice(cookieName.length + 1));
  } catch {
    return null;
  }
}

function isRecoveryExchange(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { redirectType?: unknown }).redirectType === "recovery"
  );
}

/**
 * GET handler body for `/auth/callback`: exchanges the OAuth or recovery code
 * for a session, then redirects. `next` passes through `safeRedirectPath`, so
 * only a same-origin relative path is honoured; anything else (an absolute
 * URL, "//host", a control character) lands on `defaultNext`. Any failure,
 * including a thrown exchange, goes to the login page with `?error=oauth`.
 */
export async function handleAuthCallback<TClient extends AuthCallbackClient>(
  request: Request,
  options: AuthCallbackOptions<TClient>,
): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const loginPath = options.loginPath ?? "/login";
  const { nextCookie } = options;

  const redirect = (path: string): NextResponse => {
    const response = NextResponse.redirect(`${origin}${path}`);
    if (nextCookie) {
      response.cookies.set(nextCookie.name, "", { path: nextCookie.path, maxAge: 0 });
    }
    return response;
  };
  const failure = (): NextResponse => redirect(`${loginPath}?error=oauth`);

  const code = searchParams.get("code");
  if (!code) return failure();

  const requestedNext =
    searchParams.get("next") ?? (nextCookie ? readNextCookie(request, nextCookie.name) : null);
  const safeNext = safeRedirectPath(requestedNext, options.defaultNext);

  let supabase: TClient;
  let data: unknown;
  try {
    supabase = await options.createClient();
    const result = await supabase.auth.exchangeCodeForSession(code);
    if (result.error) return failure();
    data = result.data;
    await options.afterSignIn?.(supabase);
  } catch {
    return failure();
  }

  const { recovery } = options;
  if (!recovery || !isRecoveryExchange(data)) return redirect(safeNext);

  const response = redirect(recovery.path);
  try {
    await recovery.onRecovery?.({ supabase, data, response });
  } catch {
    return failure();
  }
  return response;
}
