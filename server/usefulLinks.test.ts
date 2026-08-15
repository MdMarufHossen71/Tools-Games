import { describe, expect, it } from "vitest";
import { generatedOsintDescription, hashUsefulLinkUrl, normalizeUsefulLink, seedGroupsToLinks } from "./usefulLinks";

describe("useful link import safeguards", () => {
  it("hashes but never rewrites the supplied source URL", () => {
    const url = "https://example.org/path/?a=One%20Two";
    expect(normalizeUsefulLink({ section: "awesome", source: "awesome", category: "Tools", name: "Example", description: "A description", url }).url).toBe(url);
    expect(hashUsefulLinkUrl(url)).toHaveLength(64);
  });

  it("creates a compact OSINT description for blank records", () => {
    expect(generatedOsintDescription("GOOGLE DORKING").split(/\s+/).length).toBeLessThanOrEqual(12);
    const links = seedGroupsToLinks([{ cat: "GOOGLE DORKING", src: "osint", links: [{ n: "Example", u: "https://example.org" }] }]);
    expect(normalizeUsefulLink(links[0]).description).toBe("Research and OSINT resource in google dorking.");
  });
});
