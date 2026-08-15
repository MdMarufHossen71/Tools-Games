import { describe, expect, it } from "vitest";
import { keyboardLetter } from "./UsefulLinksLibrary";

describe("Useful Links keyboard filter", () => {
  it("cycles A–Z filter choices with directional keys", () => {
    expect(keyboardLetter("#", "ArrowRight", ["#", "A", "B"])).toBe("A");
    expect(keyboardLetter("#", "ArrowLeft", ["#", "A", "B"])).toBe("B");
  });
});
