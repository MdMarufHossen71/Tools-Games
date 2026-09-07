import { describe, expect, it } from "vitest";
import { collidePair } from "./index";

describe("collidePair", () => {
  it("swaps the normal component in a head-on hit", () => {
    const a = { x: 0, y: 0, vx: 10, vy: 0, pocketed: false, cue: true, hue: -1 };
    const b = { x: 3, y: 0, vx: 0, vy: 0, pocketed: false, cue: false, hue: 4 };
    collidePair(a, b);
    expect(a.vx).toBeCloseTo(0, 5);
    expect(b.vx).toBeCloseTo(10, 5);
    // Positional resolution closes 90% of the overlap per call; the loop
    // finishes it over frames. The test only pins improvement, not closure.
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThan(3);
  });

  it("leaves separated balls alone", () => {
    const a = { x: 0, y: 0, vx: 5, vy: 0, pocketed: false, cue: true, hue: -1 };
    const b = { x: 50, y: 0, vx: -5, vy: 0, pocketed: false, cue: false, hue: 4 };
    collidePair(a, b);
    expect(a.vx).toBe(5);
    expect(b.vx).toBe(-5);
  });
});
