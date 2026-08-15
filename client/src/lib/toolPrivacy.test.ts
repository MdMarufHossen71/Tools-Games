import { describe, expect, it } from "vitest";
import { toolInputPrivacyPolicy } from "./toolPrivacy";

describe("tool input privacy policy", () => {
  it("keeps inputs in memory only and never marks them for persistence", () => {
    expect(toolInputPrivacyPolicy.retention).toBe("memory-only");
    expect(toolInputPrivacyPolicy.shouldPersist()).toBe(false);
    expect(toolInputPrivacyPolicy.clearOnToolChange).toBe(true);
  });
});
