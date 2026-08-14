/** Cobalt Workshop design reminder: useful links are presented as a calm reference desk with clear external destination cues. */
import { ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { usefulLinks } from "@/data/links";
import { useTranslation } from "@/contexts/AppSettingsContext";

export default function Links() {
  const { t, language } = useTranslation(); const [query, setQuery] = useState(""); const [category, setCategory] = useState("all"); const categories = Array.from(new Set(usefulLinks.map((link) => link.category)));
  const results = useMemo(() => usefulLinks.filter((link) => (category === "all" || link.category === category) && `${link.name} ${link.category} ${link.description.en} ${link.description.bn}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  return <div className="site-frame page-space"><div className="page-intro"><p className="eyebrow">{t("links.eyebrow")}</p><h1>{t("links.title")}</h1><p>{t("links.copy")}</p></div><div className="directory-bar"><div className="search-field"><Search className="size-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("links.search")} /></div></div><div className="filter-rail"><button className={category === "all" ? "filter-chip active" : "filter-chip"} onClick={() => setCategory("all")}>{t("links.all")}</button>{categories.map((item) => <button key={item} className={category === item ? "filter-chip active" : "filter-chip"} onClick={() => setCategory(item)}>{language === "bn" ? usefulLinks.find((link) => link.category === item)?.categoryBn : item}</button>)}</div>{results.length ? <div className="links-list">{results.map((link) => <a key={link.url} className="link-directory-row" href={link.url} target="_blank" rel="noreferrer"><div><span>{language === "bn" ? link.categoryBn : link.category}</span><h2>{link.name}</h2><p>{link.description[language]}</p></div><div className="link-go"><small>{t("links.visit")}</small><ExternalLink className="size-4" /></div></a>)}</div> : <div className="empty-state">{t("links.empty")}</div>}</div>;
}
