import { describe, expect, it } from "vitest";
import { terrainHeight, terrainSlope } from "./index";

describe("hill-rider terrain", () => {
  it("is smooth, bounded and consistent with its slope", () => {
    for (let x = 0; x < 500; x += 7) {
      const y = terrainHeight(x);
      expect(Number.isFinite(y)).toBe(true);
      expect(y).toBeGreaterThan(20);
      expect(y).toBeLessThan(60);
      const slope = terrainSlope(x);
      expect(slope).toBeCloseTo((terrainHeight(x + 1) - terrainHeight(x - 1)) / 2, 6);
    }
  });
});
