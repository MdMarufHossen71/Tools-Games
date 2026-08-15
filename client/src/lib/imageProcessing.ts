const dataImagePattern = /^data:image\/(?:png|jpe?g|webp|gif|bmp);/i;

/** Prefer the already-decoded local data URL so mobile browsers do not need a second file-object decode. */
export function imageSourceForProcessing(input: string, fallback: string) {
  return dataImagePattern.test(input) ? input : fallback;
}

/** Keep generated canvases within a mobile-safe memory budget while preserving aspect ratio. */
export function boundedCanvasSize(width: number, height: number, maxPixels = 16_000_000) {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  const pixels = safeWidth * safeHeight;
  if (pixels <= maxPixels) return { width: safeWidth, height: safeHeight, scale: 1 };
  const scale = Math.sqrt(maxPixels / pixels);
  return { width: Math.max(1, Math.floor(safeWidth * scale)), height: Math.max(1, Math.floor(safeHeight * scale)), scale };
}
