/**
 * Hash-based location for wouter, with the query string kept inside the hash.
 *
 * wouter ships `useHashLocation`, but its `navigate` writes the query into the real
 * `location.search` (`/base/?search=x#/tools`). Plain `<Link>` clicks only change the
 * hash, so that query then survives every later navigation — visiting `/tools?search=x`
 * and then clicking "Games" and "Tools" again re-applies the stale search. Keeping the
 * query in the hash (`/base/#/tools?search=x`) makes the whole location one atomic
 * value, which is also what a static host needs: nothing before the `#` ever changes,
 * so deep links and refreshes never hit the host's 404.
 */
import { useSyncExternalStore } from "react";

type NavigateOptions = { replace?: boolean; state?: unknown };

const listeners = new Set<() => void>();
let subscribed = false;

const notify = () => listeners.forEach((listener) => listener());

function subscribe(callback: () => void) {
  listeners.add(callback);
  if (!subscribed) {
    subscribed = true;
    window.addEventListener("hashchange", notify);
  }
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && subscribed) {
      subscribed = false;
      window.removeEventListener("hashchange", notify);
    }
  };
}

/** `#/tools?search=abc` → `/tools?search=abc`; an empty hash → `/`. */
function rawHash() {
  return "/" + window.location.hash.replace(/^#?\/?/, "");
}

function readPath() {
  const raw = rawHash();
  const cut = raw.indexOf("?");
  return cut === -1 ? raw : raw.slice(0, cut) || "/";
}

function readSearch() {
  const raw = rawHash();
  const cut = raw.indexOf("?");
  return cut === -1 ? "" : raw.slice(cut + 1);
}

const serverPath = () => "/";
const serverSearch = () => "";

export function hashNavigate(to: string, options: NavigateOptions = {}) {
  const target = to.startsWith("/") ? to : `/${to}`;
  // Everything before the `#` is left exactly as the host served it, so a project
  // subdirectory (GitHub Pages) and any host-supplied query are preserved.
  const url = `${window.location.pathname}${window.location.search}#${target}`;
  const previous = window.location.href;

  try {
    if (options.replace) window.history.replaceState(options.state ?? null, "", url);
    else window.history.pushState(options.state ?? null, "", url);
  } catch {
    // Some embedded/sandboxed contexts reject History API writes; the hash still works.
    window.location.hash = target;
    return;
  }

  // `pushState` never fires `hashchange`, so subscribers are notified explicitly.
  const next = window.location.href;
  const event = typeof HashChangeEvent === "function" ? new HashChangeEvent("hashchange", { oldURL: previous, newURL: next }) : new Event("hashchange");
  window.dispatchEvent(event);
}

/** Location hook for `<Router hook={...}>`. Returns the path only, never the query. */
export function useHashPath(): [string, typeof hashNavigate] {
  return [useSyncExternalStore(subscribe, readPath, serverPath), hashNavigate];
}

/** Search hook for `<Router searchHook={...}>`. Returns the query from the hash. */
export function useHashSearch() {
  return useSyncExternalStore(subscribe, readSearch, serverSearch);
}

// wouter reads this to format `<Link href>` into a real anchor target.
useHashPath.hrefs = (href: string) => `#${href.startsWith("/") ? href : `/${href}`}`;
