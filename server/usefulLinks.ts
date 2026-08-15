import { createHash } from "crypto";

export const usefulLinkSections = ["bd", "awesome", "osint"] as const;
export const usefulLinkSources = ["bd_official", "bd_app", "bd_general", "awesome", "osint"] as const;
export type UsefulLinkSection = typeof usefulLinkSections[number];
export type UsefulLinkSource = typeof usefulLinkSources[number];
export type UsefulLinkInput = {
  section: UsefulLinkSection;
  source: UsefulLinkSource;
  category: string;
  categoryBn?: string | null;
  name: string;
  nameBn?: string | null;
  description: string;
  url: string;
  isGovernment?: boolean;
  isApp?: boolean;
  verified?: boolean;
};

export const hashUsefulLinkUrl = (url: string) => createHash("sha256").update(url).digest("hex");
export const generatedOsintDescription = (category: string) => `Research and OSINT resource in ${category.toLowerCase()}.`;

export function normalizeUsefulLink(input: UsefulLinkInput) {
  if (!input.url || !/^https?:\/\//i.test(input.url)) throw new Error("Useful Links URLs must use http or https");
  if (!input.name.trim() || !input.category.trim()) throw new Error("Useful Links name and category are required");
  const description = (input.description.trim() || (input.source === "osint" ? generatedOsintDescription(input.category) : "Useful website resource.")).slice(0, 600);
  return {
    ...input,
    category: input.category.trim().slice(0, 160),
    categoryBn: input.categoryBn?.trim().slice(0, 180) || null,
    name: input.name.trim().slice(0, 240),
    nameBn: input.nameBn?.trim().slice(0, 240) || null,
    description,
    urlHash: hashUsefulLinkUrl(input.url),
    isGovernment: Boolean(input.isGovernment),
    isApp: Boolean(input.isApp),
    verified: Boolean(input.verified),
  };
}

/** Converts the supplied `{cat,src,links}` JSON shape without rewriting any `u` URL field. */
export function seedGroupsToLinks(value: unknown): UsefulLinkInput[] {
  if (!Array.isArray(value)) throw new Error("Expected an array of useful-link categories");
  const output: UsefulLinkInput[] = [];
  for (const group of value) {
    const record = group as { cat?: unknown; src?: unknown; links?: unknown };
    if (typeof record.cat !== "string" || (record.src !== "awesome" && record.src !== "osint") || !Array.isArray(record.links)) throw new Error("Invalid useful-link category group");
    for (const item of record.links) {
      const link = item as { n?: unknown; u?: unknown; d?: unknown };
      if (typeof link.n !== "string" || typeof link.u !== "string" || (link.d !== undefined && typeof link.d !== "string")) throw new Error(`Invalid link in ${record.cat}`);
      output.push({ section: record.src, source: record.src, category: record.cat, name: link.n, url: link.u, description: typeof link.d === "string" ? link.d : "" });
    }
  }
  return output;
}
