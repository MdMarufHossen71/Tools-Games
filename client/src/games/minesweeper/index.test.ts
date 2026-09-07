import { describe, expect, it } from "vitest";
import { adjacentMines, floodOpen, neighbours, placeMines } from "./index";

describe("minesweeper helpers", () => {
  it("lists eight neighbours mid-board, three in a corner", () => {
    expect(neighbours(40)).toHaveLength(8);
    expect(neighbours(0).sort((a, b) => a - b)).toEqual([1, 9, 10]);
  });

  it("places ten mines away from the opening", () => {
    const mines = placeMines(40);
    expect(mines).toHaveLength(10);
    expect(mines).not.toContain(40);
    for (const n of neighbours(40)) expect(mines).not.toContain(n);
  });

  it("flood-opens empty regions and stops at numbers", () => {
    const mines = [80];
    const opened = floodOpen(mines, Array(81).fill(false), 0);
    expect(opened[0]).toBe(true);
    expect(opened.filter(Boolean).length).toBeGreaterThan(10);
    expect(adjacentMines(mines, 70)).toBe(1);
  });
});
