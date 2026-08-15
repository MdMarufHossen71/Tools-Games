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

  it("covers representative tools across creative, file, number, and developer categories", () => {
    expect(runTool("number-sorter", "9, 2, 4").value).toBe("2\n4\n9");
    expect(runTool("csv-converter", "name,score\nToolsHUB,100").value).toContain('"score": "100"');
    expect(runTool("file-type-identifier", "25 50 44 46").value).toBe("PDF document");
    expect(runTool("invert-color", "#000000").value).toBe("#FFFFFF");
  });
});
