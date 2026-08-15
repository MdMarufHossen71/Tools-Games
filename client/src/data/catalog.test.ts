import { describe, expect, it } from "vitest";
import { fuzzyFindTools, toolCategories, tools } from "./catalog";

describe("ToolsHUB catalog", () => {
  it("exposes more than 200 searchable tool entries across the required categories", () => {
    expect(tools.length).toBeGreaterThanOrEqual(200);
    expect(toolCategories).toHaveLength(12);
    expect(toolCategories.map((category) => category.id)).toContain("web-dev");
  });

  it("finds a tool from an exact global-search phrase", () => {
    expect(fuzzyFindTools("json formatter").some((tool) => tool.slug === "json-formatter")).toBe(true);
  });

  it("returns the full catalog when a search is blank", () => {
    expect(fuzzyFindTools("   ")).toHaveLength(tools.length);
  });
});
