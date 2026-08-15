import { describe, expect, it } from "vitest";
import { gameBySlug, games, playableGames } from "./games";

describe("ToolsHUB game catalog", () => {
  it("contains at least forty games across every arcade category", () => {
    expect(games.length).toBeGreaterThanOrEqual(40);
    expect(new Set(games.map((game) => game.category))).toEqual(new Set(["puzzle", "arcade", "words", "casual", "multiplayer"]));
  });

  it("exposes all eight playable launch games and both Wordle language modes", () => {
    expect(playableGames.map((game) => game.slug)).toEqual(expect.arrayContaining(["wordle", "2048", "snake", "tetris", "memory-match", "tic-tac-toe", "minesweeper", "sudoku"]));
    expect(gameBySlug("wordle")?.playable).toBe(true);
  });

  it("keeps every catalog card description available in all launch languages", () => {
    for (const game of games) {
      expect(Object.values(game.description)).toHaveLength(8);
      expect(Object.values(game.description).every(Boolean)).toBe(true);
    }
  });
});
