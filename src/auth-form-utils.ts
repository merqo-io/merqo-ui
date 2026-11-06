/**
 * The string a kit's `mapError` should translate for a thrown value: an
 * error `code` wins over its `message`, anything else has no usable text.
 */
export function rawErrorText(err: unknown): string | null {
  if (typeof err === "string") return err || null;
  if (typeof err !== "object" || err === null) return null;
  const { code, message } = err as { code?: unknown; message?: unknown };
  if (typeof code === "string" && code) return code;
  if (typeof message === "string" && message) return message;
  return null;
}
