import { describe, expect, it } from "vitest";
import { dailyChallengeFor, randomDailyChallengeFor, readDailyChallenge } from "./dailyChallenge";

describe("daily challenge rotation", () => {
  it("selects a stable validated game for a UTC date", () => {
    expect(dailyChallengeFor("2026-08-15")).toEqual(dailyChallengeFor("2026-08-15"));
    expect(() => dailyChallengeFor("15-08-2026")).toThrow("Invalid daily challenge date");
  });

  it("allows the scheduled handler to choose a validated random slot without changing the date key", () => {
    expect(randomDailyChallengeFor("2026-08-15", 0)).toEqual({ dateKey: "2026-08-15", gameSlug: "wordle" });
    expect(randomDailyChallengeFor("2026-08-15", 6)).toEqual({ dateKey: "2026-08-15", gameSlug: "sudoku" });
    expect(() => randomDailyChallengeFor("2026-08-15", 7)).toThrow("Invalid daily challenge selection");
  });

  it("accepts only known daily challenge records", () => {
    expect(readDailyChallenge({ dateKey: "2026-08-15", gameSlug: "snake" })).toEqual({ dateKey: "2026-08-15", gameSlug: "snake" });
    expect(readDailyChallenge({ dateKey: "2026-08-15", gameSlug: "connect-four" })).toBeNull();
  });
});
