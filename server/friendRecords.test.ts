import { describe, expect, it } from "vitest";
import { canonicalFriendPair } from "./db";

describe("friend records", () => {
  it("uses a stable pair order and rejects self-friendship", () => {
    expect(canonicalFriendPair(9, 3)).toEqual({ userId1: 3, userId2: 9 });
    expect(() => canonicalFriendPair(3, 3)).toThrow("distinct accounts");
  });
});
