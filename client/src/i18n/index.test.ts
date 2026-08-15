import { describe, expect, it } from "vitest";
import { getTranslationCoverage, localeOptions, translations } from "./index";

describe("worldwide language dictionaries", () => {
  it("provides every English UI key for every launch locale", () => {
    for (const locale of localeOptions) {
      const coverage = getTranslationCoverage(locale.code);
      expect(coverage.coverage).toBe(100);
      expect(coverage.missing).toEqual([]);
      expect(Object.keys(translations[locale.code]).sort()).toEqual(Object.keys(translations.en).sort());
    }
  });
});
