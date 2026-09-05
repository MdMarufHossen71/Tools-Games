/** Cobalt Workshop design reminder: useful links are presented as a calm reference desk with clear external destination cues. */
import { ExternalLink, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { usefulLinks } from "@/data/links";
import { useTranslation } from "@/contexts/AppSettingsContext";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Links() {
  const { t, language } = useTranslation();
  usePageMeta("links.title", "links.copy");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = Array.from(new Set(usefulLinks.map((link) => link.category)));
  const results = useMemo(() => usefulLinks.filter((link) => (category === "all" || link.category === category) && `${link.name} ${link.category} ${link.description.en} ${link.description.bn}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  const categoryLabel = (item: string) => (language === "bn" ? (usefulLinks.find((link) => link.category === item)?.categoryBn ?? item) : item);

  return <div className="site-frame page-space">
    <div className="page-intro"><p className="eyebrow">{t("links.eyebrow")}</p><h1>{t("links.title")}</h1><p>{t("links.copy")}</p></div>
    <div className="directory-bar">
      <div className="search-field"><Search className="size-4" aria-hidden="true" /><label className="sr-only" htmlFor="links-search">{t("links.search")}</label><input id="links-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("links.search")} />{query && <button type="button" className="search-clear" onClick={() => setQuery("")} aria-label={t("common.clearSearch")}><X className="size-3.5" aria-hidden="true" /></button>}</div>
      {/* This page previously showed no result count at all, so filtering to nothing
          looked identical to a page that had failed to load. */}
      <p className="directory-count" role="status"><ExternalLink className="size-4" aria-hidden="true" />{t("status.linksFiltered", { count: results.length })}</p>
    </div>
    <div className="filter-rail" role="group" aria-label={t("links.filterLabel")}>
      <button type="button" className={category === "all" ? "filter-chip active" : "filter-chip"} aria-pressed={category === "all"} onClick={() => setCategory("all")}>{t("links.all")}</button>
      {categories.map((item) => <button key={item} type="button" className={category === item ? "filter-chip active" : "filter-chip"} aria-pressed={category === item} onClick={() => setCategory(item)}>{categoryLabel(item)}</button>)}
    </div>
    {/* Every row leaves the site, so each one says so in text rather than relying on
        the icon alone. `rel="noreferrer"` also keeps the referrer off the target. */}
    {results.length ? <ul className="links-list">{results.map((link) => <li key={link.url}><a className="link-directory-row" href={link.url} target="_blank" rel="noreferrer"><div><span>{categoryLabel(link.category)}</span><h2>{link.name}</h2><p>{link.description[language]}</p></div><div className="link-go"><small>{t("links.visit")}</small><ExternalLink className="size-4" aria-hidden="true" /><span className="sr-only">{t("links.newTab")}</span></div></a></li>)}</ul> : <p className="empty-state" role="status">{t("links.empty")}</p>}
  </div>;
}
