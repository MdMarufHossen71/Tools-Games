import { describe, expect, it } from "vitest";
import { angleToRadians, areaResult, evaluateExpression, percentageResult } from "./mathWorkspaces";

describe("safe browser-local math workspace helpers", () => {
  it("evaluates standard arithmetic, precedence, parentheses and exponents without dynamic evaluation", () => {
    expect(evaluateExpression("2 + 3 × 4")).toBe(14);
    expect(evaluateExpression("(2 + 3) * 4")).toBe(20);
    expect(evaluateExpression("2^3^2")).toBe(512);
    expect(evaluateExpression("-8 / 2")).toBe(-4);
    expect(() => evaluateExpression("window.alert(1)")).toThrow();
    expect(() => evaluateExpression("10 / 0")).toThrow();
  });

  it("calculates percentage modes and common area shapes", () => {
    expect(percentageResult("of", 250, 12)).toBe(30);
    expect(percentageResult("is", 25, 200)).toBe(12.5);
    expect(percentageResult("increase", 100, 20)).toBe(120);
    expect(percentageResult("decrease", 100, 20)).toBe(80);
    expect(areaResult("circle", 2, 0)).toBeCloseTo(12.56637, 4);
    expect(areaResult("rectangle", 3, 4)).toBe(12);
    expect(areaResult("triangle", 3, 4)).toBe(6);
    expect(angleToRadians(180, "deg")).toBeCloseTo(Math.PI);
  });
});
