import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { authCookieOptions, type SupabaseConfig } from "./types";

export type UpdateSessionOptions = SupabaseConfig & {
  /** Path prefixes that need a session. Matched with `startsWith`, so "/admin" covers "/admin/x". */
  protectedPrefixes: readonly string[];
  /** Where an unauthenticated visitor to a protected path is sent. Defaults to "/login". */
  loginPath?: string;
  /**
   * Resolve the user on public paths too. The auth cookies rotate as a side
   * effect of `getUser()`, so skipping it lets the access token age out and
   * logs a returning visitor out. Off by default because it adds an auth
   * round-trip to hot anonymous routes.
   */
  refreshPublicRoutes?: boolean;
};

function isAuthTokenCookieName(name: string): boolean {
  return name.startsWith("sb-") && name.includes("-auth-token");
}

// Names that appear twice in the raw Cookie header: a host-only cookie from
// before the shared domain, plus the domain-scoped one. The parsed cookie jar
// keeps one per name, so only the raw header shows the pair.
function duplicatedAuthCookieNames(request: NextRequest): string[] {
  const seen = new Set<string>();
  const duplicated = new Set<string>();
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const name = part.split("=")[0].trim();
    if (!isAuthTokenCookieName(name)) continue;
    if (seen.has(name)) duplicated.add(name);
    seen.add(name);
  }
  return [...duplicated];
}

// A Set-Cookie with no Domain expires only the host-only copy, leaving the
// domain-scoped one. Runs on every request until the duplicate is gone.
// `writtenThisPass` holds names @supabase/ssr just wrote: ResponseCookies keys
// by name, so clearing one would overwrite the fresh session; the next
// request retries instead.
function clearHostOnlyDuplicates(
  request: NextRequest,
  response: NextResponse,
  writtenThisPass: ReadonlySet<string>,
  cookieDomain: string | undefined,
): void {
  if (!cookieDomain) return;
  for (const name of duplicatedAuthCookieNames(request)) {
    if (writtenThisPass.has(name)) continue;
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
}

/** Refreshes the Supabase session cookies and gates protected paths. Call it from the kit's middleware/proxy. */
export async function updateSupabaseSession(
  request: NextRequest,
  options: UpdateSessionOptions,
): Promise<NextResponse> {
  const loginPath = options.loginPath ?? "/login";
  let supabaseResponse = NextResponse.next({ request });
  const written = new Set<string>();

  const supabase = createServerClient(options.url, options.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
          written.add(name);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options: cookieOptions }) =>
          supabaseResponse.cookies.set(name, value, cookieOptions),
        );
      },
    },
    ...(options.schema ? { db: { schema: options.schema } } : {}),
    cookieOptions: authCookieOptions(options.cookieDomain),
  });

  const pathname = request.nextUrl.pathname;
  const isProtected = options.protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected && !options.refreshPublicRoutes) {
    clearHostOnlyDuplicates(request, supabaseResponse, written, options.cookieDomain);
    return supabaseResponse;
  }

  let user: User | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    user = error ? null : data.user;
  } catch {
    // Auth unreachable: degrade to unauthenticated instead of a 500.
    user = null;
  }

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = loginPath;
    const redirectResponse = NextResponse.redirect(url);
    // Carry over what @supabase/ssr wrote (a cleared dead session) so the
    // redirect does not leave the stale cookie in the browser. Names the
    // duplicate cleanup below overwrites are replaced by it.
    supabaseResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    clearHostOnlyDuplicates(request, redirectResponse, written, options.cookieDomain);
    return redirectResponse;
  }

  clearHostOnlyDuplicates(request, supabaseResponse, written, options.cookieDomain);
  return supabaseResponse;
}
