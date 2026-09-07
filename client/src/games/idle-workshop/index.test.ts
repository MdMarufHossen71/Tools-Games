import { describe, expect, it } from "vitest";
import { priceOf } from "./index";

describe("idle-workshop economy", () => {
  it("compounds prices per unit owned", () => {
    expect(priceOf({ base: 15, growth: 1.7, income: 0 }, 0)).toBe(15);
    expect(priceOf({ base: 15, growth: 1.7, income: 0 }, 1)).toBe(25);
    expect(priceOf({ base: 60, growth: 1.8, income: 1 }, 2)).toBe(194);
  });
});
