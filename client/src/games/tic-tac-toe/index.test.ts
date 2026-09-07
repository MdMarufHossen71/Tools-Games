import { describe, expect, it } from "vitest";
import { bestReply, winnerOf } from "./index";

describe("winnerOf", () => {
  it("detects rows, columns and diagonals", () => {
    expect(winnerOf(["X", "X", "X", "", "", "", "", "", ""]).winner).toBe("X");
    expect(winnerOf(["O", "", "", "O", "", "", "O", "", ""]).winner).toBe("O");
    expect(winnerOf(["X", "", "", "", "X", "", "", "", "X"]).winner).toBe("X");
    expect(winnerOf(["X", "O", "X", "X", "O", "O", "O", "X", "X"]).winner).toBe("");
  });

  it("returns the winning line", () => {
    expect(winnerOf(["X", "X", "X", "", "", "", "", "", ""]).line).toEqual([0, 1, 2]);
  });
});

describe("bestReply", () => {
  it("takes an immediate win", () => {
    expect(bestReply(["O", "O", "", "X", "X", "", "", "", ""])).toBe(2);
  });

  it("blocks an immediate loss", () => {
    expect(bestReply(["X", "X", "", "O", "", "", "", "", ""])).toBe(2);
  });

  it("prefers the centre on an empty board", () => {
    expect(bestReply(["", "", "", "", "", "", "", "", ""])).toBe(4);
  });
});
