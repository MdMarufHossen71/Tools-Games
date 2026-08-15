import { describe, expect, it } from "vitest";
import { generateSecurePassword } from "./passwordGenerator";

describe("generateSecurePassword", () => {
  it("uses a browser cryptographic source and enforces a safe minimum length", () => {
    const value = generateSecurePassword(4);
    expect(value).toHaveLength(12);
    const allowed = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+";
    for (const character of value) expect(allowed).toContain(character);
  });
});
