import { describe, expect, it } from "vitest";
import { decodeSharedFile, fileShareStorageKey } from "./fileShare";

describe("file share input validation", () => {
  it("accepts a bounded base64 data URL and creates an unguessable storage key", () => {
    const data = decodeSharedFile("data:text/plain;base64,aGVsbG8=");
    expect(data.bytes.toString()).toBe("hello");
    expect(data.mimeType).toBe("text/plain");
    const key = fileShareStorageKey("Annual plan.txt");
    expect(key).toMatch(/^shares\/[A-Za-z0-9_-]+-Annual-plan\.txt$/);
  });

  it("rejects malformed data URLs", () => {
    expect(() => decodeSharedFile("https://untrusted.example/file.txt")).toThrow("Invalid file data");
  });
});
