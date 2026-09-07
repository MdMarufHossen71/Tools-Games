import { describe, expect, it } from "vitest";
import { dealRound } from "./index";
import { makeProblem } from "../math-sprint/index";

describe("geo-quiz rounds", () => {
  it("deals ten unique questions with four options including the capital", () => {
    const round = dealRound();
    expect(round).toHaveLength(10);
    expect(new Set(round.map((q) => q.country)).size).toBe(10);
    for (const q of round) {
      expect(q.options).toHaveLength(4);
      expect(q.options).toContain(q.capital);
      expect(new Set(q.options).size).toBe(4);
    }
  });
});

describe("math-sprint problems", () => {
  it("generates non-negative integer answers", () => {
    for (let i = 0; i < 100; i += 1) {
      const { answer } = makeProblem();
      expect(Number.isInteger(answer)).toBe(true);
      expect(answer).toBeGreaterThanOrEqual(0);
    }
  });
});
