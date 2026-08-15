import { describe, expect, it } from "vitest";
import { buildTrackedUrl } from "./shortLinkUtm";

describe("short-link UTM builder", () => {
  it("adds only non-empty campaign parameters without removing an existing query", () => {
    expect(buildTrackedUrl("https://example.com/guide?ref=home", { source: "toolshub", medium: "social", campaign: "launch", term: "", content: "card" })).toBe("https://example.com/guide?ref=home&utm_source=toolshub&utm_medium=social&utm_campaign=launch&utm_content=card");
  });
});
