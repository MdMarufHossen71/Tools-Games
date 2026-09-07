import { describe, expect, it } from "vitest";
import { shuffledDeck } from "./index";

describe("memory-match deck", () => {
  it("deals eight pairs, sixteen cards", () => {
    const deck = shuffledDeck(() => 0.5);
    expect(deck).toHaveLength(16);
    const counts = new Map<string, number>();
    for (const face of deck) counts.set(face, (counts.get(face) ?? 0) + 1);
    expect(counts.size).toBe(8);
    for (const n of counts.values()) expect(n).toBe(2);
  });
});
