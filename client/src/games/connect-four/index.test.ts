import { describe, expect, it } from "vitest";
import { aiColumn, freeRow, winningLine } from "./index";

const empty = () => Array(42).fill(0);

describe("freeRow", () => {
  it("finds the lowest free row and reports full columns", () => {
    const grid = empty();
    expect(freeRow(grid, 3)).toBe(5);
    grid[5 * 7 + 3] = 1;
    grid[4 * 7 + 3] = 2;
    expect(freeRow(grid, 3)).toBe(3);
    for (let r = 0; r < 6; r += 1) grid[r * 7 + 0] = 1;
    expect(freeRow(grid, 0)).toBe(-1);
  });
});

describe("winningLine", () => {
  it("detects horizontal, vertical and diagonal fours", () => {
    const h = empty();
    h[5 * 7 + 1] = 1;
    h[5 * 7 + 2] = 1;
    h[5 * 7 + 3] = 1;
    h[5 * 7 + 4] = 1;
    expect(winningLine(h, 5 * 7 + 3).length).toBeGreaterThanOrEqual(4);

    const v = empty();
    v[5 * 7 + 0] = 2;
    v[4 * 7 + 0] = 2;
    v[3 * 7 + 0] = 2;
    v[2 * 7 + 0] = 2;
    expect(winningLine(v, 3 * 7 + 0).length).toBeGreaterThanOrEqual(4);

    const d = empty();
    d[5 * 7 + 0] = 1;
    d[4 * 7 + 1] = 1;
    d[3 * 7 + 2] = 1;
    d[2 * 7 + 3] = 1;
    expect(winningLine(d, 4 * 7 + 1).length).toBeGreaterThanOrEqual(4);
  });

  it("stays quiet for three in a row", () => {
    const grid = empty();
    grid[5 * 7 + 0] = 1;
    grid[5 * 7 + 1] = 1;
    grid[5 * 7 + 2] = 1;
    expect(winningLine(grid, 5 * 7 + 2)).toEqual([]);
  });
});

describe("aiColumn", () => {
  it("takes a vertical win", () => {
    const grid = empty();
    grid[5 * 7 + 3] = 2;
    grid[4 * 7 + 3] = 2;
    grid[3 * 7 + 3] = 2;
    grid[5 * 7 + 0] = 1;
    expect(aiColumn(grid)).toBe(3);
  });

  it("blocks a horizontal loss", () => {
    const grid = empty();
    grid[5 * 7 + 0] = 1;
    grid[5 * 7 + 1] = 1;
    grid[5 * 7 + 2] = 1;
    expect(aiColumn(grid)).toBe(3);
  });
});
