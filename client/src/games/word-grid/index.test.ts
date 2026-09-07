import { describe, expect, it } from "vitest";
import { clueGuess, pickTarget, WORDS } from "./index";

describe("clueGuess", () => {
  it("marks exact matches correct", () => {
    expect(clueGuess("APPLE", "APPLE")).toEqual(["correct", "correct", "correct", "correct", "correct"]);
  });

  it("handles duplicate letters without double-counting", () => {
    // Guess has two E's, target one: only the first earns a clue.
    expect(clueGuess("EERIE", "APPLE")).toEqual(["absent", "absent", "absent", "absent", "correct"]);
    // Target APPLE vs guess PUPPY: one P present (target has 2, one already green at index 2... verify two-pass).
    expect(clueGuess("PAPER", "APPLE")).toEqual(["present", "present", "correct", "present", "absent"]);
  });

  it("marks missing letters absent", () => {
    expect(clueGuess("ZZZZZ", "APPLE")).toEqual(["absent", "absent", "absent", "absent", "absent"]);
  });
});

describe("word list", () => {
  it("is five uppercase letters with no duplicates", () => {
    expect(new Set(WORDS).size).toBe(WORDS.length);
    for (const w of WORDS) expect(w).toMatch(/^[A-Z]{5}$/);
    expect(WORDS).toContain(pickTarget());
  });
});
