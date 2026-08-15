import bcrypt from "bcryptjs";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { ENV } from "./_core/env";

type SealedValue = { iv: string; tag: string; data: string };

function cipherKey() {
  return createHash("sha256").update(ENV.cookieSecret || "toolshub-development-key").digest();
}

export function newOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}

export function sealAtRest(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", cipherKey(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const payload: SealedValue = { iv: iv.toString("base64url"), tag: cipher.getAuthTag().toString("base64url"), data: data.toString("base64url") };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function openAtRest<T>(payload: string): T {
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SealedValue;
  const decipher = createDecipheriv("aes-256-gcm", cipherKey(), Buffer.from(parsed.iv, "base64url"));
  decipher.setAuthTag(Buffer.from(parsed.tag, "base64url"));
  const data = Buffer.concat([decipher.update(Buffer.from(parsed.data, "base64url")), decipher.final()]);
  return JSON.parse(data.toString("utf8")) as T;
}

export async function hashSharePassword(password?: string | null) {
  return password ? bcrypt.hash(password, 12) : null;
}

export async function verifySharePassword(passwordHash: string | null, password?: string | null) {
  if (!passwordHash) return true;
  if (!password) return false;
  return bcrypt.compare(password, passwordHash);
}
