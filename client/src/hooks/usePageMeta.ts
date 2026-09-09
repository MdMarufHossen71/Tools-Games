import { useEffect } from "react";
import { useTranslation } from "@/contexts/AppSettingsContext";
import type { TranslationKey } from "@/i18n/translations";

const BRAND = "ToolsHub";

function upsertMeta(selector: string, attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

/**
 * Per-page title and description. Previously every route shared one static title,
 * so browser history, bookmarks and tab lists were indistinguishable. Values come
 * from the dictionary so they follow the language toggle.
 */
export function usePageMeta(titleKey: TranslationKey, descriptionKey?: TranslationKey, suffix?: string) {
  const { t, language } = useTranslation();

  useEffect(() => {
    const heading = suffix ? `${suffix} · ${t(titleKey)}` : t(titleKey);
    document.title = `${heading} · ${BRAND}`;

    if (descriptionKey) {
      const description = t(descriptionKey);
      upsertMeta('meta[name="description"]', "name", "description", description);
      upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    }
    upsertMeta('meta[property="og:title"]', "property", "og:title", document.title);
    upsertMeta('meta[property="og:locale"]', "property", "og:locale", language === "bn" ? "bn_BD" : "en_US");
  }, [t, titleKey, descriptionKey, suffix, language]);
}
