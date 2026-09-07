import { describe, expect, it } from "vitest";
import { interpolate, translations, type TranslationKey } from "./translations";

describe("translation dictionary parity", () => {
  it("en and bn have identical key sets", () => {
    const enKeys = Object.keys(translations.en).sort();
    const bnKeys = Object.keys(translations.bn).sort();
    expect(bnKeys).toEqual(enKeys);
    expect(enKeys.length).toBeGreaterThan(200);
  });

  it("every key has a non-empty string in both locales", () => {
    for (const key of Object.keys(translations.en) as TranslationKey[]) {
      expect(typeof translations.en[key]).toBe("string");
      expect(translations.en[key].length).toBeGreaterThan(0);
      expect(typeof translations.bn[key]).toBe("string");
      expect(translations.bn[key].length).toBeGreaterThan(0);
    }
  });

  it("contains Phase 4 keys", () => {
    const keys = [
      "tool.error.fileTooLarge",
      "tool.hash.note",
      "tool.file.choose",
      "tool.file.noFile",
    ] as TranslationKey[];
    for (const key of keys) {
      expect(translations.en[key]).toBeTruthy();
      expect(translations.bn[key]).toBeTruthy();
    }
  });
});

describe("interpolate", () => {
  it("replaces placeholders and leaves missing vars intact", () => {
    expect(interpolate("Hello {name}", { name: "Amina" })).toBe("Hello Amina");
    expect(interpolate("{count} tools", { count: 5 })).toBe("5 tools");
    expect(interpolate("Hello {name}")).toBe("Hello {name}");
  });

  it("handles Bangla numerals in values", () => {
    expect(interpolate("© {year}", { year: 2026 })).toBe("© 2026");
  });
});
