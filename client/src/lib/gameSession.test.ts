import { describe, expect, it } from "vitest";
import { sessionToResume } from "./gameSession";

describe("game-session restore selection", () => {
  const session = { version: 1 as const, savedAt: 9_000, state: { score: 80, board: [2, 4] } };
  it("chooses a valid remote session only when it is not older than local play", () => {
    expect(sessionToResume(session, 0)).toEqual(session);
    expect(sessionToResume(session, 8_999)).toEqual(session);
    expect(sessionToResume(session, 9_001)).toBeNull();
  });
});
