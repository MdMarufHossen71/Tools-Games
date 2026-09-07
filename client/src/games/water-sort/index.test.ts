import { describe, expect, it } from "vitest";
import { dealPuzzle, isSolvable, isSolved, legalPours, pour } from "./index";

describe("water-sort rules", () => {
  it("pours contiguous groups into matching or empty tubes", () => {
    const tubes = [[0, 0], [], [], [], [], []];
    const next = pour(tubes, 0, 1);
    expect(next?.[0]).toEqual([]);
    expect(next?.[1]).toEqual([0, 0]);
    expect(pour(tubes, 0, 0)).toBeNull();
    expect(pour([[], []], 0, 1)).toBeNull();
  });

  it("refuses mismatched pours", () => {
    expect(pour([[0], [1], [], [], [], []], 0, 1)).toBeNull();
  });

  it("recognises solved boards", () => {
    expect(isSolved([[0, 0, 0, 0], [], [], [], [], []])).toBe(true);
    expect(isSolved([[0, 0], [0, 0], [], [], [], []])).toBe(false);
  });

  it("solves a one-move puzzle and deals solvable ones", () => {
    expect(isSolvable([[0], [0, 0, 0], [], [], [], []])).toBe(true);
    expect(legalPours([[0, 0, 0, 0], [], [], [], [], []])).toEqual([]);
    for (let i = 0; i < 5; i += 1) {
      const deal = dealPuzzle();
      expect(isSolved(deal)).toBe(false);
      expect(isSolvable(deal)).toBe(true);
    }
  });
});
