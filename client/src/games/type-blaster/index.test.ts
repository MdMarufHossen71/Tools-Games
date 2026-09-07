import { describe, expect, it } from "vitest";
import { pickWord, WORDS } from "./index";

describe("type-blaster words", () => {
  it("picks real words without repeats in the list", () => {
    expect(new Set(WORDS).size).toBe(WORDS.length);
    for (let i = 0; i < 20; i += 1) {
      const word = pickWord(new Set());
      expect(WORDS).toContain(word);
      expect(word).toMatch(/^[A-Z]{4,6}$/);
    }
  });

  it("avoids recently used initials", () => {
    const word = pickWord(new Set(["C"]));
    expect(word[0]).not.toBe("C");
  });
});
