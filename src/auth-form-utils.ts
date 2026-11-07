import { isRedirectError } from "./redirect-error";

/**
 * Starts `run(job)` unless a previous call is still in flight. A ref, not
 * `pending`, because two taps in one frame both see `pending` as false.
 * A redirect leaves the guard set so the leaving page cannot resubmit.
 */
export function runOnce<Job>(
  inflight: { current: boolean },
  run: (job: Job) => Promise<void>,
  job: Job,
): void {
  if (inflight.current) return;
  inflight.current = true;
  run(job).then(
    () => {
      inflight.current = false;
    },
    (err: unknown) => {
      if (!isRedirectError(err)) inflight.current = false;
    },
  );
}

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
