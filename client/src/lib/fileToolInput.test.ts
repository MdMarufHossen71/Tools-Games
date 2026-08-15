import { describe, expect, it } from "vitest";
import { fileInputMode } from "./fileToolInput";

describe("fileInputMode", () => {
  it("chooses a readable browser-local representation for each supported file utility", () => {
    expect(fileInputMode("file-to-text")).toBe("text");
    expect(fileInputMode("file-type-identifier")).toBe("name");
    expect(fileInputMode("file-size-converter")).toBe("size");
    expect(fileInputMode("file-to-base64")).toBe("data-url");
    expect(fileInputMode("pdf-metadata")).toBe("data-url");
  });
});
