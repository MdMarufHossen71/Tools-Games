import { describe, expect, it } from "vitest";
import { anyFit, cellsFor, fits, fullLines, rotate } from "./index";

describe("block-fit shapes", () => {
  it("rotates and re-anchors to the top-left", () => {
    expect(rotate([[0, 0], [1, 0], [2, 0]])).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
    ]);
    const square: Array<[number, number]> = [[0, 0], [1, 0], [0, 1], [1, 1]];
    // Order may differ; the occupied set must not.
    const sorted = (cells: Array<[number, number]>) => cells.map(([x, y]) => `${x},${y}`).sort();
    expect(sorted(rotate(square))).toEqual(sorted(square));
  });

  it("rejects out-of-bounds anchors", () => {
    const empty = Array(64).fill(0);
    expect(fits(empty, [[0, 0], [1, 0]], 7)).toBe(false);
    expect(fits(empty, [[0, 0], [1, 0]], 0)).toBe(true);
    const taken = empty.slice();
    taken[0] = 1;
    expect(fits(taken, [[0, 0]], 0)).toBe(false);
    expect(cellsFor([[0, 0]], 63)).toEqual([63]);
  });

  it("finds full rows and columns without double-counting", () => {
    const board = Array(64).fill(0);
    for (let c = 0; c < 8; c += 1) board[c] = 1;
    for (let r = 0; r < 8; r += 1) board[r * 8 + 7] = 1;
    expect(fullLines(board)).toHaveLength(8 + 8 - 1);
    expect(fullLines(Array(64).fill(0))).toEqual([]);
  });

  it("detects dead boards", () => {
    expect(anyFit(Array(64).fill(1), [[[0, 0]]])).toBe(false);
    expect(anyFit(Array(64).fill(0), [[[0, 0]]])).toBe(true);
  });
});
