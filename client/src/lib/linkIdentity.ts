/**
 * Produces a stable, privacy-preserving same-origin favicon route for a public
 * HTTP(S) destination. The server route fetches only the hostname from its
 * icon provider, so visitors never contact the provider or destination here.
 */
export function linkIconHostname(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    const hostname = parsed.hostname.toLocaleLowerCase();
    return /^[a-z0-9.-]+$/.test(hostname) && hostname.length <= 253 ? hostname : null;
  } catch {
    return null;
  }
}

export function linkIconPath(url: string) {
  const hostname = linkIconHostname(url);
  return hostname ? `/api/link-icon/${encodeURIComponent(hostname)}` : null;
}

export function linkMonogram(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => Array.from(word)[0]).join("");
  return (initials || "↗").toLocaleUpperCase();
}
