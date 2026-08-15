import { newOpaqueToken } from "./security";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function decodeSharedFile(dataUrl: string) {
  const match = /^data:([\w.+-]+\/[\w.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid file data");
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) throw new Error("Files must be between 1 byte and 8 MB");
  return { bytes, mimeType: match[1] };
}

export function fileShareStorageKey(filename: string) {
  const safe = filename.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120) || "shared-file";
  return `shares/${newOpaqueToken().slice(0, 18)}-${safe}`;
}
