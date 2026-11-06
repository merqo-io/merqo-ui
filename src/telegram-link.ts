// Pure and directive-free so Server Components can import it.

// Telegram usernames are 5-32 characters of letters, digits and underscores,
// and must start with a letter.
const HANDLE = /^[A-Za-z]\w{4,31}$/;

/**
 * Normalises a handle ("@shop_bot", "shop_bot") or a plain
 * `https://t.me/<handle>` URL (also `t.me/<handle>` and
 * `telegram.me/<handle>`) to the bare handle. Returns `null` for a
 * non-conforming handle or any other host, scheme or shape.
 */
export function normalizeTelegramHandle(input: string): string | null {
  const text = input.trim();
  const schemeless = /^(?:t|telegram)\.me\//i.exec(text);
  if (schemeless) {
    return normalizeTelegramHandle(
      `https://t.me/${text.slice(schemeless[0].length)}`,
    );
  }
  if (/^https?:\/\//i.test(text)) {
    if (!isTelegramLink(text)) return null;
    let path = new URL(text).pathname.slice(1);
    if (path.endsWith("/")) path = path.slice(0, -1);
    return HANDLE.test(path) ? path : null;
  }
  const bare = text.startsWith("@") ? text.slice(1) : text;
  return HANDLE.test(bare) ? bare : null;
}

/** Builds `https://t.me/<handle>`, or `null` when the handle is invalid. */
export function telegramLink(handle: string): string | null {
  const normalized = normalizeTelegramHandle(handle);
  return normalized ? `https://t.me/${normalized}` : null;
}

/**
 * True only for an `https://t.me/...` URL with no port or credentials. Use it
 * before putting a server- or caller-supplied link into an `href`.
 */
export function isTelegramLink(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    url.protocol === "https:" &&
    url.hostname === "t.me" &&
    url.port === "" &&
    url.username === "" &&
    url.password === ""
  );
}
