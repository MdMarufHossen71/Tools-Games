import { describe, expect, it } from "vitest";
import { filterTools, fuzzyFindTools, toolCategories, tools } from "./catalog";

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

  it("filters catalogue search, categories, hidden routes, and no-results states deterministically", () => {
    expect(filterTools("", "all")).toHaveLength(244);
    expect(filterTools("json formatter", "web-dev").map((tool) => tool.slug)).toContain("json-formatter");
    expect(filterTools("", "math")).toHaveLength(20);
    expect(filterTools("", "all", ["json-formatter"])).not.toContainEqual(expect.objectContaining({ slug: "json-formatter" }));
    expect(filterTools("no matching ToolsHUB entry")).toHaveLength(0);
  });
});
