import { describe, expect, it } from "vitest";
import { GAME_SAVE_VERSION, parseGameSave } from "./useGamePersistence";

describe("parseGameSave", () => {
  it("accepts a valid v2 save", () => {
    const save = parseGameSave({
      version: 2,
      highScore: 100,
      score: 40,
      level: 3,
      resources: 5,
      updatedAt: "2026-01-01",
    });
    expect(save).toMatchObject({ version: GAME_SAVE_VERSION, highScore: 100, score: 40, level: 3 });
  });

  it("rejects v1 placeholder scores, future versions, and corrupt shapes", () => {
    expect(parseGameSave({ version: 1, highScore: 4180, score: 4180 })).toBeNull();
    expect(parseGameSave({ version: 99, highScore: 1 })).toBeNull();
    expect(parseGameSave(null)).toBeNull();
    expect(parseGameSave([])).toBeNull();
    expect(parseGameSave("nope")).toBeNull();
    expect(parseGameSave({ version: 2 })).toBeNull();
  });

  it("rejects string scores instead of crashing", () => {
    expect(parseGameSave({ version: 2, highScore: "lots", score: "many" })).toBeNull();
  });

  it("clamps negatives and floors level at 1", () => {
    const save = parseGameSave({ version: 2, highScore: -5, score: -1, level: 0, resources: -2 });
    expect(save).toMatchObject({ highScore: 0, score: 0, level: 1, resources: 0 });
  });

  it("caps at MAX_SAFE_INTEGER", () => {
    const save = parseGameSave({
      version: 2,
      highScore: Number.MAX_SAFE_INTEGER + 100,
      score: 10,
      level: 1,
      resources: 0,
    });
    expect(save?.highScore).toBe(Number.MAX_SAFE_INTEGER);
  });
});
