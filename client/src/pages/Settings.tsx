/** Cobalt Workshop design reminder: Settings is a deliberate control room—private data and aesthetic choices are visible, local and reversible. */
import { Database } from "lucide-react";
import { DataManager } from "@/components/DataManager";
import { ThemePanel } from "@/components/ThemePanel";
import { useTranslation } from "@/contexts/AppSettingsContext";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Settings() {
  const { t } = useTranslation();
  usePageMeta("settings.title", "settings.copy");
  return <div className="site-frame page-space">
    <div className="page-intro"><p className="eyebrow">{t("settings.eyebrow")}</p><h1>{t("settings.title")}</h1><p>{t("settings.copy")}</p></div>
    <ThemePanel />
    <section className="settings-section" aria-labelledby="settings-data-title"><div className="settings-section-heading"><div><p className="eyebrow">{t("settings.dataEyebrow")}</p><h2 id="settings-data-title">{t("data.title")}</h2><p>{t("data.intro")}</p></div><Database className="settings-heading-icon" aria-hidden="true" /></div><DataManager /></section>
  </div>;
}
