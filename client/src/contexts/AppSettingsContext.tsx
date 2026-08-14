/** Cobalt Workshop design reminder: direct, tactile settings controls with Electric Cobalt as the visible active state. */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { interpolate, translations, type Locale, type TranslationKey } from "@/i18n/translations";
import { fallbackTokens, themePresets, type ThemePreset, type ThemeTokens } from "@/data/themes";

type Appearance = "system" | string;
type AppSettings = { language: Locale; setLanguage: (language: Locale) => void; theme: "light" | "dark"; appearance: Appearance; allThemes: ThemePreset[]; setAppearance: (appearance: Appearance) => void; toggleTheme: () => void; saveCustomTheme: (theme: ThemePreset) => void; deleteCustomTheme: (id: string) => void; resetThemes: () => void; t: (key: TranslationKey, values?: Record<string, string | number>) => string };
const SettingsContext = createContext<AppSettings | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Locale>(() => {
    try { const saved = localStorage.getItem("tgb-language") as Locale | null; return saved === "bn" || saved === "en" ? saved : "en"; } catch { return "en"; }
  });
  const [customThemes, setCustomThemes] = useState<ThemePreset[]>(() => { try { const saved = JSON.parse(localStorage.getItem("tgb-custom-themes") || "[]"); return Array.isArray(saved) ? saved.filter((theme) => theme?.custom && theme?.id && theme?.name && theme?.tokens) : []; } catch { return []; } });
  const [appearance, setAppearanceState] = useState<Appearance>(() => { try { return localStorage.getItem("tgb-appearance") || localStorage.getItem("tgb-theme") || "system"; } catch { return "system"; } });
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const allThemes = useMemo(() => [...themePresets, ...customThemes], [customThemes]);
  const activeTheme = useMemo(() => appearance === "system" ? (systemDark ? themePresets.find((theme) => theme.id === "dark")! : themePresets[0]) : (allThemes.find((theme) => theme.id === appearance) ?? themePresets[0]), [appearance, allThemes, systemDark]);
  const theme = activeTheme.isDark ? "dark" : "light";
  useEffect(() => { const media = window.matchMedia("(prefers-color-scheme: dark)"); const change = () => setSystemDark(media.matches); media.addEventListener("change", change); return () => media.removeEventListener("change", change); }, []);
  useEffect(() => { const root = document.documentElement; const tokens = activeTheme?.tokens ?? fallbackTokens; root.classList.toggle("dark", activeTheme.isDark); root.dataset.theme = activeTheme.id; root.style.setProperty("--background", tokens.background); root.style.setProperty("--foreground", tokens.text); root.style.setProperty("--card", tokens.surface); root.style.setProperty("--card-foreground", tokens.text); root.style.setProperty("--popover", tokens.surface); root.style.setProperty("--popover-foreground", tokens.text); root.style.setProperty("--secondary", tokens.surface); root.style.setProperty("--secondary-foreground", tokens.text); root.style.setProperty("--muted", tokens.surface); root.style.setProperty("--muted-foreground", tokens.text); root.style.setProperty("--accent", tokens.secondary); root.style.setProperty("--accent-foreground", tokens.text); root.style.setProperty("--primary", tokens.primary); root.style.setProperty("--primary-foreground", activeTheme.isDark ? "#ffffff" : "#ffffff"); root.style.setProperty("--border", tokens.border); root.style.setProperty("--input", tokens.border); root.style.setProperty("--ring", tokens.primary); try { localStorage.setItem("tgb-appearance", appearance); } catch { /* appearance remains usable without persistence */ } }, [appearance, activeTheme]);
  useEffect(() => { try { localStorage.setItem("tgb-custom-themes", JSON.stringify(customThemes)); } catch { /* custom themes remain usable for this session */ } }, [customThemes]);
  useEffect(() => { document.documentElement.lang = language === "bn" ? "bn" : "en"; }, [language]);
  const value = useMemo<AppSettings>(() => ({
    language, theme, appearance, allThemes, setLanguage: (next) => { setLanguageState(next); try { localStorage.setItem("tgb-language", next); } catch { /* settings remain usable without persistence */ } },
    setAppearance: setAppearanceState, toggleTheme: () => setAppearanceState(theme === "dark" ? "light" : "dark"),
    saveCustomTheme: (newTheme) => { setCustomThemes((current) => [...current.filter((theme) => theme.id !== newTheme.id && theme.name !== newTheme.name), { ...newTheme, custom: true }]); setAppearanceState(newTheme.id); },
    deleteCustomTheme: (id) => { setCustomThemes((current) => current.filter((theme) => theme.id !== id)); if (appearance === id) setAppearanceState("light"); },
    resetThemes: () => { setCustomThemes([]); setAppearanceState("light"); },
    t: (key, values) => interpolate(translations[language][key], values),
  }), [language, theme, appearance, allThemes]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within AppSettingsProvider");
  return context;
}

export const useTranslation = useSettings;
