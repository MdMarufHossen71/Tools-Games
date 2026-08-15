import { describe, expect, it } from "vitest";
import { tools } from "./catalog";
import { games, playableGames } from "./games";

describe("ToolsHUB catalogue integrity", () => {
  it("keeps all tool slugs unique and preserves the published 254-tool catalogue", () => {
    expect(tools).toHaveLength(254);
    expect(new Set(tools.map((tool) => tool.slug)).size).toBe(tools.length);
    expect(tools.every((tool) => tool.name && tool.description.en && tool.description.bn)).toBe(true);
  });

  it("keeps all game slugs unique and advertises only implemented games as playable", () => {
    expect(games).toHaveLength(45);
    expect(new Set(games.map((game) => game.slug)).size).toBe(games.length);
    expect(playableGames.map((game) => game.slug).sort()).toEqual(["2048", "memory-match", "minesweeper", "snake", "sudoku", "tetris", "tic-tac-toe", "wordle"]);
  });
});
