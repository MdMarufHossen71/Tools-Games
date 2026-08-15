import { describe, expect, it } from "vitest";
import { advanceGameStreak } from "./gameStreak";

describe("game streak calculation", () => {
  it("starts a streak and does not double-count a second play on the same UTC day", () => {
    const today = new Date("2026-08-15T12:00:00.000Z");
    const first = advanceGameStreak(null, today);
    expect(first.gameStreak).toEqual({ current: 1, longest: 1, lastPlayedDay: "2026-08-15" });
    expect(advanceGameStreak(first, today).gameStreak.current).toBe(1);
  });
  it("extends consecutive days and resets a broken chain while retaining the record", () => {
    const first = advanceGameStreak(null, new Date("2026-08-14T12:00:00.000Z"));
    const second = advanceGameStreak(first, new Date("2026-08-15T12:00:00.000Z"));
    expect(second.gameStreak).toMatchObject({ current: 2, longest: 2 });
    expect(advanceGameStreak(second, new Date("2026-08-18T12:00:00.000Z")).gameStreak).toMatchObject({ current: 1, longest: 2 });
  });
});
