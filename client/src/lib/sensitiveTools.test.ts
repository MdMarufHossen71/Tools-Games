import { describe, expect, it } from "vitest";
import { canRememberToolInput, isSensitiveTool } from "./sensitiveTools";

describe("isSensitiveTool", () => {
  it("fails closed on empty/unknown slugs", () => {
    expect(isSensitiveTool("")).toBe(true);
  });

  it("excludes the whole crypto group", () => {
    expect(isSensitiveTool("hash-generator")).toBe(true);
    expect(isSensitiveTool("uuid-generator")).toBe(true);
    expect(isSensitiveTool("jwt-decoder-debugger")).toBe(true);
  });

  it("matches secret patterns regardless of category", () => {
    for (const slug of [
      "password-generator",
      "password-strength-analyzer",
      "passphrase-list",
      "my-secret-notes",
      "secure-token-thing",
      "totp-otp-generator",
      "bcrypt-check",
      "encrypt-decrypt-text",
      "hmac-tester",
      "basic-auth-header",
      "api-key-vault",
    ]) {
      expect(isSensitiveTool(slug)).toBe(true);
    }
  });

  it("covers explicit slugs", () => {
    expect(isSensitiveTool("bip39-mnemonic-generator")).toBe(true);
    expect(isSensitiveTool("rsa-key-pair-generator")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isSensitiveTool("Password-Generator")).toBe(true);
  });

  it("allows clearly non-sensitive tools", () => {
    expect(isSensitiveTool("word-counter")).toBe(false);
    expect(isSensitiveTool("notes-pad")).toBe(false);
    expect(isSensitiveTool("bmi-calculator")).toBe(false);
  });

  it("canRememberToolInput is the inverse", () => {
    expect(canRememberToolInput("word-counter")).toBe(true);
    expect(canRememberToolInput("password-generator")).toBe(false);
  });
});
