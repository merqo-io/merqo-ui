export interface NavUser {
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface NavAuthUser {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

function text(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function httpsUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    return new URL(value).protocol === "https:" ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The single label chain for an account: vendor name, `full_name`,
 * `display_name`, email local part, then "Account". Plain module (no
 * "use client") so a Server Component layout can compute it and hand the
 * string to a client nav; every kit shows the same label that way.
 */
export function accountLabel(
  authUser: NavAuthUser | null | undefined,
  vendorName?: string | null,
): string {
  const meta = authUser?.user_metadata ?? {};
  return (
    text(vendorName) ??
    text(meta.full_name) ??
    text(meta.display_name) ??
    text(text(authUser?.email)?.split("@")[0]) ??
    "Account"
  );
}

/**
 * Maps a Supabase-style auth user to the shape `LandingAccountNav` takes.
 * Plain module (no "use client") so a Server Component page can call it
 * before handing the result to the client nav. Avatar URLs are limited to
 * https so user-controlled metadata can't inject other schemes into an img.
 */
export function toNavUser(
  authUser: NavAuthUser | null | undefined,
  vendorName?: string | null,
): NavUser | null {
  if (!authUser) return null;
  return {
    name: accountLabel(authUser, vendorName),
    email: text(authUser.email),
    avatarUrl: httpsUrl(authUser.user_metadata?.avatar_url),
  };
}
