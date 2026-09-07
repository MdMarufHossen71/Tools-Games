import { describe, expect, it } from "vitest";
import { pickWord, WORDS } from "./index";

describe("hangman words", () => {
  it("picks uppercase words from the curated list", () => {
    for (let i = 0; i < 20; i += 1) {
      const word = pickWord();
      expect(WORDS).toContain(word);
      expect(word).toMatch(/^[A-Z]{4,8}$/);
    }
  });

  it("has no duplicates", () => {
    expect(new Set(WORDS).size).toBe(WORDS.length);
  });
});
