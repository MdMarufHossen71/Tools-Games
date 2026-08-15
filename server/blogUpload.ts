const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const supportedMimeTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function decodeBlogCover(dataUrl: string) {
  const matched = /^data:(image\/(?:jpeg|png|webp));base64,([a-zA-Z0-9+/=]+)$/.exec(dataUrl);
  if (!matched) throw new Error("Use a PNG, JPEG, or WebP image.");
  const [, mimeType, encoded] = matched;
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error("Cover images must be smaller than 8 MB.");
  return { bytes, mimeType, extension: supportedMimeTypes.get(mimeType)! };
}

export function blogCoverKey(filename: string, extension: string) {
  const stem = filename.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 56) || "cover";
  return `blog/covers/${stem}.${extension}`;
}
