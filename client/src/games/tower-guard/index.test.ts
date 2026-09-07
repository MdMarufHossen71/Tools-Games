import { describe, expect, it } from "vitest";
import { pathCells, positionAt, roadLengths, upgradeCost, waveComp } from "./index";

describe("tower-guard road", () => {
  it("covers the waypoints and stays on the board", () => {
    const cells = pathCells();
    expect(cells.has(2 * 16 + 0)).toBe(true);
    expect(cells.has(2 * 16 + 12)).toBe(true);
    expect(cells.has(9 * 16 + 3)).toBe(true);
    for (const cell of cells) {
      expect(cell).toBeGreaterThanOrEqual(0);
      expect(cell).toBeLessThan(16 * 12);
    }
  });

  it("walks the road from gate to exit", () => {
    const { total } = roadLengths();
    expect(positionAt(0).done).toBe(false);
    expect(positionAt(0).x).toBeCloseTo(-1, 5);
    const mid = positionAt(13);
    expect(mid.x).toBeCloseTo(12, 5);
    expect(mid.y).toBeCloseTo(2, 5);
    expect(positionAt(total + 10).done).toBe(true);
  });
});

describe("tower-guard economy", () => {
  it("compounds upgrade prices", () => {
    expect(upgradeCost("arrow", 1)).toBe(90);
    expect(upgradeCost("arrow", 2)).toBe(162);
    expect(upgradeCost("cannon", 1)).toBe(198);
  });

  it("scales waves up in count and toughness", () => {
    const early = waveComp(1);
    const late = waveComp(6);
    expect(late.length).toBeGreaterThan(early.length);
    expect(early.every((e) => e.kind === "grunt")).toBe(true);
    expect(late.some((e) => e.kind === "tank")).toBe(true);
  });
});
