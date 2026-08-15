import { describe, expect, it, vi } from "vitest";
import { tools } from "@/data/catalog";
import { localOperationSlugs, runTool } from "./toolOperations";

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
    expect(runTool("text-to-binary", "A").value).toBe("01000001");
    expect(runTool("binary-to-text", "01010100 01001000").value).toBe("TH");
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
    expect(runTool("url-extractor", "See https://toolshub.example and https://toolshub.example").value).toBe("https://toolshub.example");
    expect(runTool("query-string-parser", "?lang=bn&theme=dark").value).toContain('"lang": "bn"');
  });

  it("maps every concrete browser-local processor to a visible unique catalogue route", () => {
    const catalogueSlugs = new Set(tools.map((tool) => tool.slug));
    expect(new Set(localOperationSlugs).size).toBe(localOperationSlugs.length);
    expect(localOperationSlugs).toHaveLength(62);
    for (const slug of localOperationSlugs) expect(catalogueSlugs.has(slug), slug).toBe(true);
  });

  it("executes every registered operation through a dedicated non-passthrough result", () => {
    const inputFor: Record<string, string> = {
      "word-counter": "ToolsHUB works", "case-converter": "ToolsHUB", "reverse-text": "ToolsHUB", "sort-lines": "z\na", "shuffle-lines": "first\nsecond", "remove-extra-spaces": "ToolsHUB   works", "remove-empty-lines": "ToolsHUB\n\nworks", "remove-duplicates": "ToolsHUB\nToolsHUB", "add-text-to-lines": "#\nToolsHUB", "text-repeater": "2\nToolsHUB", "text-to-binary": "A", "binary-to-text": "01000001", "url-extractor": "Visit https://toolshub.example", "line-numberer": "ToolsHUB", "sentence-counter": "ToolsHUB works.", "find-replace": "o\nx\nToolsHUB", "slug-generator": "ToolsHUB Start", "reading-time": "ToolsHUB works", "base64-encode": "ToolsHUB", "base64-decode": "VG9vbHNIVUI=", "image-to-base64": "data:image/png;base64,ToolsHUB", "file-to-base64": "data:text/plain;base64,ToolsHUB", "pdf-metadata": "data:application/pdf;base64,JVBERi", "url-encode": "ToolsHUB works", "url-decode": "ToolsHUB%20works", "html-entity-encode": "<ToolsHUB>", "html-entity-decode": "&amp;ToolsHUB", rot13: "ToolsHUB", "morse-code": "ToolsHUB", "password-generator": "", "random-string": "12", "uuid-generator": "", "nanoid-generator": "", "random-number": "1 10", "number-sorter": "9 2 4", "average-calculator": "2 4", "binary-converter": "01000001", "decimal-converter": "10", "json-formatter": "{\"name\":\"ToolsHUB\"}", "json-minifier": "{\"name\": \"ToolsHUB\"}", "json-validator": "{\"name\":\"ToolsHUB\"}", "csv-converter": "name\nToolsHUB", "html-beautifier": "<main><p>ToolsHUB</p></main>", "css-minifier": "p { color: red; }", "regex-tester": "o\nToolsHUB", "email-validator": "hello@toolshub.example", "url-parser": "https://toolshub.example/tools", "query-string-parser": "?lang=bn", "json-escape": "ToolsHUB", calculator: "2+2", "percentage-calculator": "1 4", "hex-to-rgb": "#6D5DFB", "random-color": "", "invert-color": "#000000", "gradient-generator": "", "unix-timestamp": "0", "date-difference": "2026-01-01,2026-01-03", "file-size-converter": "2048", "file-type-identifier": "25504446", "fancy-text": "ToolsHUB", "coin-flipper": "", "dice-roller": "",
    };
    const random = vi.spyOn(Math, "random").mockReturnValueOnce(0.9).mockReturnValueOnce(0.1).mockReturnValue(0.5);
    try {
      for (const slug of localOperationSlugs) {
        const input = inputFor[slug];
        const result = runTool(slug, input, 1);
        expect(result.error, slug).not.toBe(true);
        expect(result.value, slug).not.toBe(input);
      }
    } finally {
      random.mockRestore();
    }
  });
});
