import { describe, expect, it } from "vitest";
import { getTranslationCoverage, localeOptions, translations } from "../client/src/i18n/index";

describe("ToolsHUB multilingual coverage", () => {
  it("keeps all eight launch dictionaries at 100% coverage", () => {
    for (const locale of localeOptions) {
      const report = getTranslationCoverage(locale.code);
      expect(report.coverage).toBe(100);
      expect(report.missing).toEqual([]);
      expect(Object.keys(translations[locale.code]).sort()).toEqual(Object.keys(translations.en).sort());
    }
  });
});
