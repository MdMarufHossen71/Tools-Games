/** Cobalt Workshop design reminder: Settings is a deliberate control room—private data and aesthetic choices are visible, local and reversible. */
import { Database, Settings2 } from "lucide-react";
import { DataManager } from "@/components/DataManager";
import { ThemePanel } from "@/components/ThemePanel";
import { useTranslation } from "@/contexts/AppSettingsContext";

export default function Settings() { const { t } = useTranslation(); return <div className="site-frame page-space"><div className="page-intro"><p className="eyebrow">CONTROL ROOM</p><h1>{t("settings.title")}</h1><p>{t("settings.copy")}</p></div><ThemePanel /><section className="settings-section"><div className="settings-section-heading"><div><p className="eyebrow">PRIVATE STORAGE</p><h2>{t("data.title")}</h2><p>{t("data.intro")}</p></div><Database className="settings-heading-icon" /></div><DataManager /></section></div>; }
