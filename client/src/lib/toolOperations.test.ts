import { describe, expect, it } from "vitest";
import { runTool } from "./toolOperations";

describe("runTool", () => {
  it("formats and validates JSON locally", () => {
    expect(runTool("json-formatter", '{"name":"ToolsHUB"}').value).toContain('  "name": "ToolsHUB"');
    expect(runTool("json-validator", '{"valid":true}').value).toBe("✓");
    expect(runTool("json-formatter", "not json").error).toBe(true);
  });

  it("handles text transforms without a server call", () => {
    expect(runTool("base64-decode", "VG9vbHNIVUI=").value).toBe("ToolsHUB");
    expect(runTool("slug-generator", "ToolsHUB — Quick Start!").value).toBe("toolshub-quick-start");
    expect(runTool("word-counter", "ToolsHUB makes work easier").value).toContain('"words": 4');
  });

  it("creates valid local utility results", () => {
    expect(runTool("calculator", "12 * (3 + 2)").value).toBe("60");
    expect(runTool("hex-to-rgb", "#6D5DFB").value).toBe("109, 93, 251");
    expect(runTool("email-validator", "hello@toolshub.example").value).toBe("✓");
  });
});
