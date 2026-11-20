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
  const meta = authUser.user_metadata ?? {};
  const email = text(authUser.email);
  const name =
    text(vendorName) ??
    text(meta.full_name) ??
    text(meta.display_name) ??
    text(email?.split("@")[0]) ??
    "Account";
  return {
    name,
    email: authUser.email ?? undefined,
    avatarUrl: httpsUrl(meta.avatar_url),
  };
}
