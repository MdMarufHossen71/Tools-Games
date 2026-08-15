import { ar } from "./ar";
import { bn } from "./bn";
import { de } from "./de";
import { en, type TranslationDictionary, type TranslationKey } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { hi } from "./hi";
import { ur } from "./ur";

export type { TranslationDictionary, TranslationKey };
export const localeOptions = [
  { code: "en", nativeName: "English", flag: "🇬🇧", direction: "ltr" },
  { code: "bn", nativeName: "বাংলা", flag: "🇧🇩", direction: "ltr" },
  { code: "hi", nativeName: "हिंदी", flag: "🇮🇳", direction: "ltr" },
  { code: "ur", nativeName: "اردو", flag: "🇵🇰", direction: "rtl" },
  { code: "ar", nativeName: "العربية", flag: "🇸🇦", direction: "rtl" },
  { code: "es", nativeName: "Español", flag: "🇪🇸", direction: "ltr" },
  { code: "fr", nativeName: "Français", flag: "🇫🇷", direction: "ltr" },
  { code: "de", nativeName: "Deutsch", flag: "🇩🇪", direction: "ltr" },
] as const;
export type Locale = (typeof localeOptions)[number]["code"];
export const translations: Record<Locale, TranslationDictionary> = { en, bn, hi, ur, ar, es, fr, de };
export const isLocale = (value: string | null | undefined): value is Locale => localeOptions.some((item) => item.code === value);
export const detectLocale = (language?: string) => { const normalized = (language ?? "").toLowerCase().split("-")[0]; return isLocale(normalized) ? normalized : "en"; };
export const isRtlLocale = (locale: Locale) => localeOptions.find((item) => item.code === locale)?.direction === "rtl";
export const getLocaleOption = (locale: Locale) => localeOptions.find((item) => item.code === locale) ?? localeOptions[0];
export function getTranslationCoverage(locale: Locale) { const keys = Object.keys(en) as TranslationKey[]; const missing = keys.filter((key) => !translations[locale][key]); const present = keys.length - missing.length; const coverage = Math.round((present / keys.length) * 100); return { locale, present, total: keys.length, coverage, missing }; }
export function reportTranslationCoverage() { return localeOptions.map(({ code }) => { const report = getTranslationCoverage(code); if (report.coverage !== 100) console.warn(`[i18n] ${code} coverage ${report.coverage}% — missing values fall back to English.`, report.missing); else console.info(`[i18n] ${code} coverage 100%`); return report; }); }
