/**
 * Discriminated result returned by Server Actions. The success branch carries
 * any extra payload via T (e.g. `{ boothId }`); the failure branch always
 * carries a user-facing `error` string.
 */
export type ActionResult<T = object> =
  | ({ success: true } & T)
  | { success: false; error: string };

/** Narrowing helper for the failure branch. */
export function isActionError<T>(
  result: ActionResult<T>,
): result is { success: false; error: string } {
  return result.success === false;
}
