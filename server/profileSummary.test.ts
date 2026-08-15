import { describe, expect, it } from "vitest";
import { profileStreakFromResources } from "./db";

describe("profile streak summary", () => {
  it("only accepts bounded non-negative stored streak values", () => {
    expect(profileStreakFromResources({ gameStreak: { current: 4 } })).toBe(4);
    expect(profileStreakFromResources({ gameStreak: { current: -1 } })).toBe(0);
    expect(profileStreakFromResources({ gameStreak: { current: "4" } })).toBe(0);
    expect(profileStreakFromResources(null)).toBe(0);
  });
});
