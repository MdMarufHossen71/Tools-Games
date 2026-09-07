import { describe, expect, it } from "vitest";
import { aiMove, applyMove, capturesFrom, legalMoves, type Piece } from "./index";

const empty = () => Array(64).fill(0) as Piece[];

describe("checkers captures", () => {
  it("forces captures over quiet steps", () => {
    const board = empty();
    board[40] = 1; // player man with a capture
    board[33] = 3; // victim
    board[50] = 1; // another man with only quiet steps
    const moves = legalMoves(board, false);
    expect(moves.length).toBeGreaterThan(0);
    for (const m of moves) expect(m.captured.length).toBeGreaterThan(0);
  });

  it("chains multi-jumps", () => {
    const board = empty();
    board[40] = 1;
    board[33] = 3;
    board[19] = 3;
    const chains = capturesFrom(board, 40);
    expect(chains.some((m) => m.captured.length === 2)).toBe(true);
  });

  it("promotes on the far rank", () => {
    const board = empty();
    board[9] = 1;
    const next = applyMove(board, { from: 9, path: [0], captured: [] }, false);
    expect(next[0]).toBe(2);
  });

  it("kings move both ways", () => {
    const board = empty();
    board[27] = 2;
    const moves = legalMoves(board, false);
    expect(moves.length).toBe(4);
  });
});

describe("checkers AI", () => {
  it("takes a winning capture", () => {
    const board = empty();
    board[20] = 3;
    board[27] = 1;
    board[10] = 1;
    const reply = aiMove(board, () => 0);
    expect(reply).not.toBeNull();
    expect(reply?.captured.length).toBeGreaterThan(0);
  });

  it("returns null with no pieces", () => {
    expect(aiMove(empty(), () => 0)).toBeNull();
  });
});
