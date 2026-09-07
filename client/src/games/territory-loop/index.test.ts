import { describe, expect, it } from "vitest";
import { claimLoop, ownedShare } from "./index";

const W = 24;

describe("claimLoop", () => {
  it("claims the interior of a closed ring", () => {
    const territory = Array(W * W).fill(0);
    // 5×5 home block already owned at the corner.
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) territory[y * W + x] = 1;
    }
    // A loop out to the right and back into owned ground: top (5..9,2),
    // right side (9,3..6), bottom (8..4,6), and back up the owned column.
    // In-game the trail always closes this way — both ends touch territory.
    const trail: number[] = [];
    for (let x = 5; x <= 9; x += 1) trail.push(2 * W + x);
    for (let y = 3; y <= 6; y += 1) trail.push(y * W + 9);
    for (let x = 8; x >= 4; x -= 1) trail.push(6 * W + x);
    trail.push(5 * W + 4, 4 * W + 4, 3 * W + 4);
    const claimed = claimLoop(territory, 1, trail);
    // Interior cell (6,4) is cut off from the border: claimed.
    expect(claimed[4 * W + 6]).toBe(1);
    // A far corner stays neutral.
    expect(claimed[20 * W + 20]).toBe(0);
    expect(ownedShare(claimed, 1)).toBeGreaterThan(25);
  });

  it("changes nothing for an empty trail", () => {
    const territory = Array(W * W).fill(0);
    territory[0] = 1;
    expect(claimLoop(territory, 1, [])).toEqual(territory);
  });
});
