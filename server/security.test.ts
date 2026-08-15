import { describe, expect, it } from "vitest";
import { hashOpaqueToken, hashSharePassword, newOpaqueToken, openAtRest, sealAtRest, verifySharePassword } from "./security";

describe("secure utility primitives", () => {
  it("round-trips encrypted at-rest metadata without exposing its plaintext", () => {
    const secret = { fileKey: "shares/private-contract.pdf", filename: "contract.pdf" };
    const sealed = sealAtRest(secret);
    expect(sealed).not.toContain("contract.pdf");
    expect(openAtRest<typeof secret>(sealed)).toEqual(secret);
  });

  it("creates non-sequential opaque tokens with stable irreversible lookup hashes", () => {
    const first = newOpaqueToken();
    const second = newOpaqueToken();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(40);
    expect(hashOpaqueToken(first)).toBe(hashOpaqueToken(first));
    expect(hashOpaqueToken(first)).not.toBe(first);
  });

  it("hashes and verifies protected-share passwords", async () => {
    const hash = await hashSharePassword("correct-horse-battery-staple");
    expect(hash).not.toContain("correct-horse-battery-staple");
    await expect(verifySharePassword(hash, "correct-horse-battery-staple")).resolves.toBe(true);
    await expect(verifySharePassword(hash, "not-the-password")).resolves.toBe(false);
  });
});
