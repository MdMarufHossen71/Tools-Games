import { describe, expect, it } from "vitest";
import { canvasImageAction, imageOutputExtension } from "./imageToolOptions";

describe("imageToolOptions", () => {
  it("only enables concrete browser-local canvas transforms", () => {
    expect(canvasImageAction("image-resize")).toBe("resize");
    expect(canvasImageAction("image-converter")).toBe("convert");
    expect(canvasImageAction("image-compressor")).toBe("compress");
    expect(canvasImageAction("image-crop")).toBeUndefined();
  });

  it("uses a matching downloaded extension for each supported output type", () => {
    expect(imageOutputExtension("image/png")).toBe("png");
    expect(imageOutputExtension("image/jpeg")).toBe("jpg");
    expect(imageOutputExtension("image/webp")).toBe("webp");
  });
});
