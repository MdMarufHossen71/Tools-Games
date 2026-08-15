import { describe, expect, it } from "vitest";
import { validateGameScore } from "./gameScores";

describe("server-side game score validation", () => {
  it("accepts bounded integer scores for supported games", () => expect(validateGameScore("snake", 320)).toEqual({ gameSlug: "snake", score: 320 }));
  it("rejects unavailable games, fractional values, negative values, and implausible values", () => {
    expect(() => validateGameScore("connect-four", 1)).toThrow();
    expect(() => validateGameScore("snake", -1)).toThrow();
    expect(() => validateGameScore("snake", 3.4)).toThrow();
    expect(() => validateGameScore("wordle", 1001)).toThrow();
  });
});
