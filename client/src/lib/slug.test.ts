import { describe, expect, it } from "vitest";
import { displaySlug, safeSlug } from "./slug";

describe("safeSlug", () => {
  it("returns empty for nullish input", () => {
    expect(safeSlug(null)).toBe("");
    expect(safeSlug(undefined)).toBe("");
    expect(safeSlug("")).toBe("");
  });

  it("decodes percent-encoding", () => {
    expect(safeSlug("word-counter")).toBe("word-counter");
    expect(safeSlug("hello%20world")).toBe("hello world");
  });

  it("does not throw on malformed escapes", () => {
    expect(() => safeSlug("%E0%A6")).not.toThrow();
    expect(safeSlug("%E0%A6")).toBe("%E0%A6");
  });

  it("trims and caps at 120 chars", () => {
    expect(safeSlug("  abc  ")).toBe("abc");
    expect(safeSlug("x".repeat(500)).length).toBe(120);
  });
});

describe("displaySlug", () => {
  it("strips control characters but preserves Bengali and emoji", () => {
    expect(displaySlug("hello\nworld\x1b")).toBe("helloworld");
    expect(displaySlug("হ্যালো")).toBe("হ্যালো");
    expect(displaySlug("game🎮")).toBe("game🎮");
    expect(displaySlug("a\x7fb")).toBe("ab");
  });

  it("is safe to echo on a 404 page", () => {
    expect(displaySlug("<script>alert(1)</script>")).toBe("<script>alert(1)</script>");
  });
});
