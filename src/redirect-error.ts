/**
 * Next.js implements `redirect()` by throwing an error whose `digest` starts
 * with "NEXT_REDIRECT". A server action that ends in a redirect therefore
 * rejects on the client after the router has already started navigating, so
 * the rejection is navigation, not a failure to show the user. Matched by
 * digest so this package never imports Next.js internals. `notFound()` and
 * the other HTTP fallbacks render an error page instead of navigating, so
 * they stay errors.
 */
export function isRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT;");
}
