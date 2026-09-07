import { describe, expect, it } from "vitest";
import { buildPuzzle, lineCells } from "./index";

describe("lineCells", () => {
  it("draws horizontal, vertical and diagonal lines", () => {
    expect(lineCells(0, 3)).toEqual([0, 1, 2, 3]);
    expect(lineCells(0, 24)).toEqual([0, 8, 16, 24]);
    expect(lineCells(0, 27)).toEqual([0, 9, 18, 27]);
  });

  it("constrains off-axis drags to the dominant line", () => {
    expect(lineCells(0, 10)).toEqual([0, 1, 2]);
    expect(lineCells(0, 16)).toEqual([0, 8, 16]);
    expect(lineCells(0, 18)).toEqual([0, 9, 18]);
  });

  it("returns a single cell for a tap", () => {
    expect(lineCells(5, 5)).toEqual([5]);
  });
});

describe("buildPuzzle", () => {
  it("places every word retrievably on the grid", () => {
    for (let i = 0; i < 10; i += 1) {
      const { grid, placements } = buildPuzzle();
      expect(grid).toHaveLength(64);
      expect(placements.length).toBeGreaterThan(0);
      for (const p of placements) {
        const letters = p.cells.map((c) => grid[c]).join("");
        const reversed = p.cells
          .slice()
          .reverse()
          .map((c) => grid[c])
          .join("");
        expect(letters === p.word || reversed === p.word).toBe(true);
      }
    }
  });
});
