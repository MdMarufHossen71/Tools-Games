/** Cobalt Workshop design reminder: informational pages are concise field notes, using spacious editorial typography and not marketing language. */
import { Link, useRoute } from "wouter";
import { useTranslation } from "@/contexts/AppSettingsContext";
const map = { about: ["static.about.title", "static.about.copy"], "how-to": ["static.how.title", "static.how.copy"], privacy: ["static.privacy.title", "static.privacy.copy"] } as const;
export default function InfoPage() { const [, params] = useRoute("/:slug"); const { t } = useTranslation(); const pair = map[params?.slug as keyof typeof map] ?? map.about; return <div className="site-frame page-space"><article className="info-sheet"><p className="eyebrow">TOOLS & GAMES BD</p><h1>{t(pair[0])}</h1><p>{t(pair[1])}</p><Link href="/tools" className="text-link">{t("home.tools")} →</Link></article></div>; }
