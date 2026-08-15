import { describe, expect, it } from "vitest";
import { inputAfterToolChange, toolInputPrivacyPolicy } from "./toolPrivacy";

describe("tool input privacy policy", () => {
  it("keeps inputs in memory only and never marks them for persistence", () => {
    expect(toolInputPrivacyPolicy.retention).toBe("memory-only");
    expect(toolInputPrivacyPolicy.shouldPersist()).toBe(false);
    expect(toolInputPrivacyPolicy.clearOnToolChange).toBe(true);
  });

  it("clears private input when navigating to a different tool without storage", () => {
    expect(inputAfterToolChange("json-formatter", "base64-encoder", "private draft")).toBe("");
    expect(inputAfterToolChange("json-formatter", "json-formatter", "private draft")).toBe("private draft");
  });
});
