export type CropAspect = "free" | "1:1" | "4:3" | "16:9";

export const cropAspectRatios: Record<CropAspect, number | null> = {
  free: null,
  "1:1": 1,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
};

export type CropRect = { sx: number; sy: number; sw: number; sh: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Calculates a source crop rectangle while keeping every pixel within image bounds. */
export function imageCropRect(width: number, height: number, zoom: number, positionX: number, positionY: number, aspect: CropAspect): CropRect {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const scale = clamp(zoom, 100, 300) / 100;
  let sw = safeWidth / scale;
  let sh = safeHeight / scale;
  const ratio = cropAspectRatios[aspect];
  if (ratio && sw / sh > ratio) sw = sh * ratio;
  else if (ratio) sh = sw / ratio;
  const maxX = Math.max(0, safeWidth - sw);
  const maxY = Math.max(0, safeHeight - sh);
  return {
    sx: Math.round((maxX * (clamp(positionX, -100, 100) + 100)) / 200),
    sy: Math.round((maxY * (clamp(positionY, -100, 100) + 100)) / 200),
    sw: Math.max(1, Math.round(sw)),
    sh: Math.max(1, Math.round(sh)),
  };
}
