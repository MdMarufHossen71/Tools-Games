import { describe, expect, it } from "vitest";
import { normalizeGameSession, sessionToRestore } from "./gameSession";

const remote = { version: 1 as const, savedAt: 1_700_000_000_000, state: { score: 40, board: [2, 4, 8] } };

describe("saved game-session safeguards", () => {
  it("accepts a bounded serializable session and rejects unsafe payloads", () => {
    expect(normalizeGameSession(remote)).toEqual(remote);
    expect(normalizeGameSession({ ...remote, state: { nested: { deeper: { a: { b: { c: { d: { tooDeep: true } } } } } } } })).toBeNull();
    expect(normalizeGameSession({ ...remote, state: { score: Infinity } })).toBeNull();
  });

  it("restores remote state only when no newer local session exists", () => {
    expect(sessionToRestore(remote, 0)).toEqual(remote);
    expect(sessionToRestore(remote, remote.savedAt - 1)).toEqual(remote);
    expect(sessionToRestore(remote, remote.savedAt + 1)).toBeNull();
  });
});
