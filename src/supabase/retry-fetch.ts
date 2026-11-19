const IDEMPOTENT_METHODS = new Set(["GET", "HEAD"]);

function requestOf(input: Parameters<typeof fetch>[0]): Request | undefined {
  return typeof Request !== "undefined" && input instanceof Request ? input : undefined;
}

function methodOf(input: Parameters<typeof fetch>[0], init?: RequestInit): string {
  return (init?.method ?? requestOf(input)?.method ?? "GET").toUpperCase();
}

function isAbort(err: unknown): boolean {
  const name = (err as { name?: unknown } | null)?.name;
  return name === "AbortError" || name === "TimeoutError";
}

/**
 * Wraps `fetch` so a GET or HEAD retries once when the connection itself fails.
 * Vercel to Supabase sockets occasionally drop mid-flight (undici
 * UND_ERR_SOCKET, ECONNRESET); fetch reports every such failure as a
 * TypeError. Only idempotent methods are replayed, and never after an abort,
 * a timeout or an HTTP response, so a write is never sent twice and a slow
 * upstream is not doubled up on.
 */
export function createRetryingFetch(baseFetch: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    try {
      return await baseFetch(input, init);
    } catch (err) {
      const callerSignal = init?.signal ?? requestOf(input)?.signal;
      const retryable =
        err instanceof TypeError &&
        !isAbort(err) &&
        !callerSignal?.aborted &&
        IDEMPOTENT_METHODS.has(methodOf(input, init));
      if (!retryable) throw err;
      return baseFetch(input, init);
    }
  };
}
