export interface KitCallbackTarget {
  url: string;
  secret: string;
}

export interface KitCallbackOptions {
  /**
   * Permits `http://localhost` targets. Pass true only in local development:
   * the secret travels in a header, so any other plain-http host would
   * expose it.
   */
  development?: boolean;
  /** Abandon the request after this many milliseconds. Default 5000. */
  timeoutMs?: number;
  /** Injected for tests. Defaults to the global `fetch`. */
  fetch?: typeof fetch;
}

export type KitCallbackFailure =
  | "invalid_url"
  | "http_error"
  | "timeout"
  | "network_error";

export type KitCallbackResult =
  | { ok: true }
  | { ok: false; reason: KitCallbackFailure; status?: number };

const DEFAULT_TIMEOUT_MS = 5000;

// An address with credentials in it is refused: fetch rejects one with an
// error that quotes the whole URL.
function callbackUrl(value: string, development: boolean): URL | null {
  try {
    const url = new URL(value);
    if (url.username || url.password) return null;
    if (url.protocol === "https:") return url;
    if (development && url.protocol === "http:" && url.hostname === "localhost")
      return url;
    return null;
  } catch {
    return null;
  }
}

/**
 * Signed kit-to-kit callback: POSTs `body` as JSON with the target's secret
 * as a bearer token. Best effort and never throws: failures are logged
 * (error name and status only, never the URL or secret) and returned.
 * Redirects are refused so the secret cannot be forwarded to another host.
 */
export async function postKitCallback(
  target: KitCallbackTarget,
  body: unknown,
  options: KitCallbackOptions = {},
): Promise<KitCallbackResult> {
  const url = callbackUrl(target.url, options.development === true);
  if (!url || !target.secret) {
    console.error("postKitCallback: target is not a plain https URL with a secret");
    return { ok: false, reason: "invalid_url" };
  }

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );
  try {
    const send = options.fetch ?? fetch;
    const res = await send(url, {
      method: "POST",
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${target.secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`postKitCallback: receiver returned ${res.status}`);
      return { ok: false, reason: "http_error", status: res.status };
    }
    return { ok: true };
  } catch (err) {
    // The name only: a fetch error's message can quote the Authorization
    // header or the URL it was given.
    console.error(
      "postKitCallback failed",
      err instanceof Error ? err.name : "unknown error",
    );
    return {
      ok: false,
      reason: controller.signal.aborted ? "timeout" : "network_error",
    };
  } finally {
    clearTimeout(timer);
  }
}
