import { describe, expect, it } from "vitest";
import { pickWord, scramble, WORDS } from "./index";

describe("anagram helpers", () => {
  it("scrambles into a different arrangement of the same letters", () => {
    for (let i = 0; i < 30; i += 1) {
      const word = pickWord();
      const mixed = scramble(word);
      expect(mixed).not.toBe(word);
      expect(mixed.split("").sort().join("")).toBe(word.split("").sort().join(""));
    }
  });

  it("has a duplicate-free list", () => {
    expect(new Set(WORDS).size).toBe(WORDS.length);
  });
});
