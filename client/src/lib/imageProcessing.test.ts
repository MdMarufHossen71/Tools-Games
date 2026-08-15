import { describe, expect, it } from "vitest";
import { boundedCanvasSize, imageSourceForProcessing } from "./imageProcessing";

describe("shared image processing safeguards", () => {
  it("reuses a browser-decoded data image instead of requiring a second file decode", () => {
    expect(imageSourceForProcessing("data:image/jpeg;base64,abc", "blob:phone-file")).toBe("data:image/jpeg;base64,abc");
    expect(imageSourceForProcessing("", "blob:phone-file")).toBe("blob:phone-file");
  });

  it("bounds oversized canvases while maintaining valid dimensions and ratio", () => {
    const output = boundedCanvasSize(8000, 6000, 16_000_000);
    expect(output.width * output.height).toBeLessThanOrEqual(16_000_000);
    expect(output.width / output.height).toBeCloseTo(4 / 3, 2);
  });
});
