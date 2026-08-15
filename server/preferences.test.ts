import { describe, expect, it } from "vitest";
import { settingsResult } from "./db";

describe("preferences query result contract", () => {
  it("returns null rather than undefined when no settings record exists", () => {
    expect(settingsResult(undefined)).toBeNull();
  });

  it("preserves an existing settings record", () => {
    const saved = { language: "bn", appearance: "dark" };
    expect(settingsResult(saved)).toBe(saved);
  });
});
