/**
 * Recently used tools for the home page strip. A tiny capped list of slugs —
 * validated on read so a hand-edited value can never break the home page.
 */
import { findTool } from "@/data/tools";
import { safeGet, safeSet, STORAGE_PREFIX } from "@/lib/storage";
import type { Tool } from "@/data/tools";

const KEY = `${STORAGE_PREFIX}recent-tools`;
const MAX_RECENT = 6;

export function getRecentTools(): Tool[] {
  const slugs = safeGet<unknown>(KEY, []);
  if (!Array.isArray(slugs)) return [];
  const out: Tool[] = [];
  for (const slug of slugs) {
    if (typeof slug !== "string") continue;
    const tool = findTool(slug);
    if (tool && !out.some((t) => t.slug === tool.slug)) out.push(tool);
    if (out.length >= MAX_RECENT) break;
  }
  return out;
}

export function pushRecentTool(slug: string): void {
  const current = getRecentTools().map((tool) => tool.slug).filter((s) => s !== slug);
  safeSet(KEY, [slug, ...current].slice(0, MAX_RECENT));
}
