import { describe, expect, it } from "vitest";
import { imageCropRect } from "./imageCrop";

describe("imageCropRect", () => {
  it("creates an in-bounds centred square crop at the base zoom", () => {
    expect(imageCropRect(1600, 900, 100, 0, 0, "1:1")).toEqual({ sx: 350, sy: 0, sw: 900, sh: 900 });
  });

  it("keeps moved, zoomed crop rectangles inside the source image", () => {
    const crop = imageCropRect(1600, 900, 200, 100, -100, "16:9");
    expect(crop.sx + crop.sw).toBeLessThanOrEqual(1600);
    expect(crop.sy).toBeGreaterThanOrEqual(0);
    expect(crop.sw / crop.sh).toBeCloseTo(16 / 9, 1);
  });
});
