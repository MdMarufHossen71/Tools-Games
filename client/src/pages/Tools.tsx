/** Cobalt Workshop design reminder: filters behave like labeled instrument trays, with results always visible and confidently navigable. */
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import { categories, fuzzyMatch, toolRegistry, type ToolGroup } from "@/data/tools";
import { useTranslation } from "@/contexts/AppSettingsContext";

export default function Tools() {
  const { t, language } = useTranslation(); const initial = new URLSearchParams(window.location.hash.split("?")[1] || "").get("search") || ""; const initialCategory = new URLSearchParams(window.location.hash.split("?")[1] || "").get("category") as ToolGroup | null;
  const [query, setQuery] = useState(initial); const [group, setGroup] = useState<ToolGroup | "all">(initialCategory || "all");
  const results = useMemo(() => toolRegistry.filter((tool) => (group === "all" || tool.group === group) && fuzzyMatch(tool, query)), [group, query]);
  return <div className="site-frame page-space"><div className="page-intro"><p className="eyebrow">{t("tools.eyebrow")}</p><h1>{t("tools.title")}</h1><p>{t("tools.copy")}</p></div><div className="directory-bar"><div className="search-field"><Search className="size-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search.placeholder")} /></div><span className="directory-count"><SlidersHorizontal className="size-4" />{t("tools.resultCount", { count: results.length })}</span></div><div className="filter-rail" aria-label="Tool category filter"><button className={group === "all" ? "filter-chip active" : "filter-chip"} onClick={() => setGroup("all")}>{t("tools.all")}</button>{categories.map((category) => <button key={category.id} className={group === category.id ? "filter-chip active" : "filter-chip"} onClick={() => setGroup(category.id)}>{language === "bn" ? category.bn : category.label}</button>)}</div>{results.length ? <div className="tool-grid directory-grid">{results.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}</div> : <div className="empty-state">{t("tools.empty")}</div>}</div>;
}
