import { describe, expect, it } from "vitest";
import { defaultPlayfulEffects, normalizePlayfulEffects } from "./playfulEffects";

describe("playful-effect preference normalization", () => {
  it("accepts the namespaced server preference object while ignoring unrelated data", () => {
    expect(normalizePlayfulEffects({ playfulEffects: { cat: true, trail: false, buddy: true }, model: "assistant" })).toEqual({ cat: true, trail: false, buddy: true });
  });

  it("normalizes partial legacy values and rejects invalid payloads", () => {
    expect(normalizePlayfulEffects({ cat: true })).toEqual({ cat: true, trail: false, buddy: false });
    expect(normalizePlayfulEffects({ cat: "yes" })).toBeNull();
    expect(normalizePlayfulEffects(null)).toBeNull();
    expect(defaultPlayfulEffects).toEqual({ cat: false, trail: false, buddy: false });
  });
});
