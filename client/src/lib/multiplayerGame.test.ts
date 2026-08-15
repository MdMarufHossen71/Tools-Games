import { describe, expect, it } from "vitest";
import { connectFourIndex, winnerFor, type Marker } from "./multiplayerGame";

describe("multiplayer board rules", () => {
  it("detects Tic Tac Toe and every Connect Four win direction", () => {
    expect(winnerFor(["X","X","X","","","","","",""], "tic-tac-toe")).toBe("X");
    const horizontal: Marker[] = Array(42).fill(""); [35, 36, 37, 38].forEach((index) => horizontal[index] = "O");
    const vertical: Marker[] = Array(42).fill(""); [2, 9, 16, 23].forEach((index) => vertical[index] = "X");
    const diagonal: Marker[] = Array(42).fill(""); [14, 22, 30, 38].forEach((index) => diagonal[index] = "O");
    expect(winnerFor(horizontal, "connect-four")).toBe("O"); expect(winnerFor(vertical, "connect-four")).toBe("X"); expect(winnerFor(diagonal, "connect-four")).toBe("O");
  });

  it("drops each Connect Four piece into the lowest legal row", () => {
    const board: Marker[] = Array(42).fill(""); expect(connectFourIndex(board, 3)).toBe(38);
    board[38] = "X"; expect(connectFourIndex(board, 3)).toBe(31);
    for (let row = 0; row < 6; row++) board[row * 7 + 3] = "O";
    expect(connectFourIndex(board, 3)).toBe(-1); expect(connectFourIndex(board, 7)).toBe(-1);
  });
});
