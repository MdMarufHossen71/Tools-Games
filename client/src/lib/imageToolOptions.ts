export type CanvasImageAction = "resize" | "rotate" | "flip" | "convert" | "compress" | "crop";

const actions: Record<string, CanvasImageAction> = {
  "image-crop": "crop",
  "image-resize": "resize",
  "image-rotate": "rotate",
  "image-flip": "flip",
  "image-converter": "convert",
  "image-compressor": "compress",
};

export function canvasImageAction(slug: string): CanvasImageAction | undefined {
  return actions[slug];
}

export function imageOutputExtension(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "png";
}
