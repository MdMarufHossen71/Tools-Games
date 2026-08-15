import { describe, expect, it } from "vitest";
import { toolCategories } from "@/data/catalog";
import { getToolWorkspaceModel } from "./toolWorkspaceModel";

describe("tool workspace models", () => {
  it("assigns every catalogue category an explicit mobile input model", () => {
    const models = toolCategories.map(category => getToolWorkspaceModel(category.id));
    expect(models).toHaveLength(toolCategories.length);
    expect(models.filter(model => model.acceptsFile).map(model => model.kind).sort()).toEqual(["file", "image", "media", "pdf"]);
    expect(getToolWorkspaceModel("math").inputMode).toBe("decimal");
    expect(getToolWorkspaceModel("web-dev").kind).toBe("data");
    expect(getToolWorkspaceModel("images").accept).toBe("image/*");
  });
});
