import { describe, expect, it } from "vitest";
import { filterUsefulLinks, keyboardLetter, type LinkRecord } from "./UsefulLinksLibrary";

const links: LinkRecord[] = [
  { id: 1, section: "bd", source: "bd_official", category: "Government Services", categoryBn: "সরকারি সেবা", name: "Bangladesh NID", nameBn: "বাংলাদেশ এনআইডি", description: "Official identity service", url: "https://nidw.gov.bd", isGovernment: true, isApp: false, verified: true },
  { id: 2, section: "awesome", source: "awesome", category: "Tools", categoryBn: null, name: "Alpha Tool", nameBn: null, description: "A curated utility", url: "https://example.com", isGovernment: false, isApp: false, verified: true },
];

describe("Useful Links keyboard filter", () => {
  it("cycles A–Z filter choices with directional keys", () => {
    expect(keyboardLetter("#", "ArrowRight", ["#", "A", "B"])).toBe("A");
    expect(keyboardLetter("#", "ArrowLeft", ["#", "A", "B"])).toBe("B");
  });

  it("filters by query and first letter, including the no-result state", () => {
    expect(filterUsefulLinks(links, "identity")).toHaveLength(1);
    expect(filterUsefulLinks(links, "", "A").map((item) => item.name)).toEqual(["Alpha Tool"]);
    expect(filterUsefulLinks(links, "not-present")).toHaveLength(0);
  });
});
