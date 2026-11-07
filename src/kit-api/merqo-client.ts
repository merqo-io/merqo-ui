export const DEFAULT_MERQO_BASE_URL: string = "https://www.merqo.io";

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Base URL of the Merqo site, where vendors sign in, accept terms and manage
 * their plan. Read per call, not at import, so tests and deployments can
 * override `MERQO_BASE_URL` without re-importing callers. An empty value
 * falls back to the default.
 */
export function merqoBaseUrl(
  env: { MERQO_BASE_URL?: string } = process.env,
): string {
  return env.MERQO_BASE_URL || DEFAULT_MERQO_BASE_URL;
}

export interface MerqoUrlOptions {
  /** Permits an `http://localhost` base. Pass true only in local development. */
  development?: boolean;
}

function trustedBase(base: string, development: boolean): URL | null {
  try {
    const url = new URL(base);
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
 * Builds an absolute Merqo URL. Returns null when the base is not https
 * (http only for localhost in development) or when `path` would leave the
 * base's origin, such as `//other.host/x`, so a bearer secret is never sent
 * somewhere the caller did not mean.
 */
export function merqoUrl(
  path: string,
  query?: Record<string, string | undefined>,
  base: string = merqoBaseUrl(),
  options: MerqoUrlOptions = {},
): URL | null {
  const root = trustedBase(base, options.development === true);
  if (!root || !path.startsWith("/") || path.startsWith("//")) return null;
  const url = new URL(path, root);
  if (url.origin !== root.origin) return null;
  for (const [name, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(name, value);
  }
  return url;
}

export type MerqoErrorCode =
  | "missing_secret"
  | "invalid_url"
  | "http_error"
  | "invalid_json"
  | "timeout"
  | "network_error";

export type MerqoResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number | null; error: MerqoErrorCode };

export interface MerqoClientOptions {
  /** The kit's shared secret for Merqo, for example `MERQO_CUSTOMER_SECRET`. */
  secret: string | undefined;
  /** Defaults to `merqoBaseUrl()`. */
  baseUrl?: string;
  /** Default 5000. */
  timeoutMs?: number;
  development?: boolean;
  /** Injected for tests. Defaults to the global `fetch`. */
  fetch?: typeof fetch;
}

export interface MerqoClient {
  get<T>(
    path: string,
    query?: Record<string, string | undefined>,
  ): Promise<MerqoResult<T>>;
  post<T>(path: string, body: unknown): Promise<MerqoResult<T>>;
}

/**
 * HTTP client for Merqo's `/api/merqo/*` routes, authenticated with the
 * kit's bearer secret. It never throws: every failure is a typed result the
 * caller maps to its own fail-closed or best-effort policy. Redirects are
 * refused so the secret cannot be forwarded to another host.
 */
export function createMerqoClient(options: MerqoClientOptions): MerqoClient {
  async function request<T>(
    method: "GET" | "POST",
    path: string,
    query?: Record<string, string | undefined>,
    body?: unknown,
  ): Promise<MerqoResult<T>> {
    if (!options.secret) {
      return { ok: false, status: null, error: "missing_secret" };
    }
    const url = merqoUrl(path, query, options.baseUrl ?? merqoBaseUrl(), {
      development: options.development,
    });
    if (!url) return { ok: false, status: null, error: "invalid_url" };

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    try {
      const send = options.fetch ?? fetch;
      const res = await send(url, {
        method,
        cache: "no-store",
        redirect: "error",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${options.secret}`,
          ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
        },
        ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
      });
      if (!res.ok) {
        return { ok: false, status: res.status, error: "http_error" };
      }
      try {
        return { ok: true, status: res.status, data: (await res.json()) as T };
      } catch {
        return { ok: false, status: res.status, error: "invalid_json" };
      }
    } catch (err) {
      // The name only: a fetch error's message can quote the URL or header.
      console.error(
        "merqo request failed",
        err instanceof Error ? err.name : "unknown error",
      );
      return {
        ok: false,
        status: null,
        error: controller.signal.aborted ? "timeout" : "network_error",
      };
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    get: (path, query) => request("GET", path, query),
    post: (path, body) => request("POST", path, undefined, body),
  };
}

type MerqoRpcClient<Args, Returns> = {
  schema: (name: "merqo") => {
    rpc: (
      fn: string,
      args: Args,
    ) => PromiseLike<{ data: Returns; error: { message: string } | null }>;
  };
};

/**
 * Calls a `merqo.*` RPC through a kit's own Supabase client. The client is
 * typed `object` because each kit's client is generic over its own Database
 * and schema, which never matches a structural type; callers supply Args and
 * Returns as a hand-written mirror of the RPC contract. Throws on an RPC
 * error, with the function name and message.
 */
export async function callMerqoRpc<Args, Returns>(
  supabase: object,
  fnName: string,
  args: Args,
): Promise<Returns> {
  const client = supabase as MerqoRpcClient<Args, Returns>;
  const { data, error } = await client.schema("merqo").rpc(fnName, args);
  if (error) throw new Error(`${fnName} failed: ${error.message}`);
  return data;
}
