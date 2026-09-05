/**
 * Route parameters arrive percent-encoded and, under hash routing, can contain
 * whatever the user typed into the address bar. `decodeURIComponent` throws on a
 * malformed sequence such as `%E0%A6`, which would otherwise escalate a typo in a
 * URL into a caught render error. Decode defensively and normalise instead.
 */
const MAX_SLUG_LENGTH = 120;

export function safeSlug(raw: string | undefined | null): string {
  if (!raw) return "";
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // Malformed escape sequence: fall back to the raw value rather than throwing.
    decoded = raw;
  }
  return decoded.trim().slice(0, MAX_SLUG_LENGTH);
}

/**
 * A slug safe to echo back to the user on a not-found page. Control characters are
 * dropped so a crafted URL cannot push line breaks or terminal escapes into the DOM.
 */
export function displaySlug(raw: string | undefined | null): string {
  const cleaned = safeSlug(raw);
  let out = "";
  for (const character of cleaned) {
    const code = character.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) continue;
    out += character;
  }
  return out;
}
