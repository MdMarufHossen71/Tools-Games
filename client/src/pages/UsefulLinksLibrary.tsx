import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { trpc } from "@/lib/trpc";
import { useSettings } from "@/contexts/AppSettingsContext";
import { ExternalLink, FileCheck2, Landmark, Search, ShieldCheck, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import "../links-library.css";

export type LinkRecord = {
  id: number;
  section: "bd" | "awesome" | "osint";
  source: "bd_official" | "bd_app" | "bd_general" | "awesome" | "osint";
  category: string;
  categoryBn: string | null;
  name: string;
  nameBn: string | null;
  description: string;
  url: string;
  isGovernment: boolean;
  isApp: boolean;
  verified: boolean;
};

const sections = ["bd", "awesome", "osint"] as const;
const pageSize = 60;
const bdCategoryOrder = ["Government Services", "Jobs & Career", "Expatriate Services", "Health & Utility"];

export function keyboardLetter(current: string, key: "ArrowLeft" | "ArrowRight", values = ["#", ...Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ")]) {
  const index = Math.max(0, values.indexOf(current));
  return values[(index + (key === "ArrowRight" ? 1 : values.length - 1)) % values.length];
}

export function filterUsefulLinks(data: LinkRecord[] = [], query = "", letter = "#") {
  const normalized = query.trim().toLocaleLowerCase();
  return data.filter((item) => {
    const searchable = `${item.name} ${item.nameBn ?? ""} ${item.description} ${item.category} ${item.categoryBn ?? ""}`.toLocaleLowerCase();
    const first = item.name.trim().slice(0, 1).toLocaleUpperCase();
    return (!normalized || searchable.includes(normalized)) && (letter === "#" || first === letter);
  });
}

function matchText(value: string, query: string) {
  if (!query) return value;
  const bits = value.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return bits.map((bit, index) => bit.toLocaleLowerCase() === query.toLocaleLowerCase() ? <mark key={`${bit}-${index}`}>{bit}</mark> : bit);
}

function LinkCard({ item, query, bangla, labels }: { item: LinkRecord; query: string; bangla: boolean; labels: { curated: string; research: string; government: string; app: string; open: string } }) {
  const title = bangla && item.nameBn ? item.nameBn : item.name;
  const category = bangla && item.categoryBn ? item.categoryBn : item.category;
  const sourceTag = item.source === "awesome" ? labels.curated : item.source === "osint" ? labels.research : null;
  return <a className="useful-link-card" href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`${title} — ${labels.open}`}>
    <div className="useful-link-icon" aria-hidden="true">{item.isGovernment ? <Landmark size={18} /> : item.isApp ? <Smartphone size={18} /> : item.source === "osint" ? <ShieldCheck size={18} /> : <FileCheck2 size={18} />}</div>
    <div className="useful-link-content"><div className="useful-link-heading"><h3>{matchText(title, query)}</h3><ExternalLink size={15} /></div><p>{matchText(item.description, query)}</p><div className="useful-link-tags"><span className="category-tag">{category}</span>{sourceTag && <span className={item.source === "osint" ? "source-tag research" : "source-tag"}>{sourceTag}</span>}{item.isGovernment && <span className="gov-tag">{labels.government}</span>}{item.isApp && <span className="app-tag">{labels.app}</span>}{item.verified && <span className="verified-tag" title="Verified">✓</span>}</div></div>
  </a>;
}

export default function UsefulLinksLibrary() {
  const { language, t } = useSettings();
  const { data, isLoading } = trpc.usefulLinks.list.useQuery();
  const initial = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(initial.get("search") ?? "");
  const [letter, setLetter] = useState(initial.get("letter")?.slice(0, 1).toLocaleUpperCase() || "#");
  const [shown, setShown] = useState<Record<string, number>>({});
  const bangla = language === "bn";
  const letters = ["#", ...Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ")];
  const filtered = useMemo(() => filterUsefulLinks((data as LinkRecord[] | undefined) ?? [], query, letter), [data, query, letter]);
  const labels = { curated: t("links.curated"), research: t("links.research"), government: t("links.government"), app: t("links.app"), open: t("links.open") };
  const grouped = useMemo(() => {
    const categoryMaps: Record<typeof sections[number], Map<string, LinkRecord[]>> = { bd: new Map(), awesome: new Map(), osint: new Map() };
    filtered.forEach((item) => {
      const map = categoryMaps[item.section];
      const items = map.get(item.category) ?? [];
      items.push(item);
      map.set(item.category, items);
    });
    return sections.map((section) => ({
      section,
      categories: Array.from(categoryMaps[section].entries()).map(([category, items]) => ({ category, items, key: `${section}:${category}` })).sort((a, b) => {
        if (section !== "bd") return a.category.localeCompare(b.category);
        const aIndex = bdCategoryOrder.indexOf(a.category); const bIndex = bdCategoryOrder.indexOf(b.category);
        return (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex) || a.category.localeCompare(b.category);
      }),
    }));
  }, [filtered]);
  const titleFor = (section: typeof sections[number]) => section === "bd" ? t("links.bd") : section === "awesome" ? t("links.everyday") : t("links.osint");

  useEffect(() => {
    const title = "ToolsHUB — Useful Links Library";
    const description = "ToolsHUB — 2,100+ curated useful websites, links and research tools.";
    const originalTitle = document.title;
    const descriptionNode = document.querySelector('meta[name="description"]');
    const originalDescription = descriptionNode?.getAttribute("content") ?? "";
    document.title = title; descriptionNode?.setAttribute("content", description);
    const script = document.createElement("script"); script.id = "toolshub-links-jsonld"; script.type = "application/ld+json"; script.text = JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: title, description, url: `${window.location.origin}/links`, isPartOf: { "@type": "WebSite", name: "ToolsHUB" } }); document.head.appendChild(script);
    return () => { document.title = originalTitle; descriptionNode?.setAttribute("content", originalDescription); script.remove(); };
  }, []);

  return <div className="links-library site-frame">
    <header className="links-library-hero"><p className="eyebrow">{t("links.eyebrow")}</p><h1>{t("links.title")}</h1><p>{t("links.copy")}</p><div className="links-search-wrap"><Search size={19} /><input autoComplete="off" value={query} onChange={(event) => { setQuery(event.target.value); setShown({}); }} placeholder={t("links.search")} aria-label={t("links.search")} /><kbd>/</kbd></div><p className="links-result-count" aria-live="polite"><strong>{filtered.length.toLocaleString()}</strong> {t("links.results")}</p></header>
    <div className="letter-filter" aria-label="Filter by first letter" onKeyDown={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); setLetter(keyboardLetter(letter, event.key)); } }}><button className={letter === "#" ? "active" : ""} onClick={() => setLetter("#")}>{t("links.allLetters")}</button>{letters.slice(1).map((value) => <button key={value} className={letter === value ? "active" : ""} onClick={() => setLetter(value)}>{value}</button>)}</div>
    {isLoading ? <div className="links-status">{t("links.loading")}</div> : filtered.length === 0 ? <div className="links-status">{t("links.empty")}</div> : grouped.map(({ section, categories }) => categories.length > 0 && <section className={`link-source-section ${section}`} key={section}><div className="link-source-heading"><span>{section === "bd" ? <Landmark /> : section === "osint" ? <ShieldCheck /> : <FileCheck2 />}</span><div><p className="eyebrow">{section === "bd" ? "BANGLADESH" : section === "awesome" ? "CURATED COLLECTION" : "RESEARCH COLLECTION"}</p><h2>{titleFor(section)}</h2></div><b>{categories.reduce((sum, category) => sum + category.items.length, 0).toLocaleString()}</b></div><Accordion type="multiple" defaultValue={section === "bd" ? categories.slice(0, 2).map((category) => category.key) : []} className="link-accordion">{categories.map(({ category, items, key }) => { const limit = shown[key] ?? pageSize; const visible = items.slice(0, limit); const displayCategory = bangla && items[0]?.categoryBn ? items[0].categoryBn : category; return <AccordionItem value={key} key={key}><AccordionTrigger><span>{displayCategory}</span><small>{items.length.toLocaleString()}</small></AccordionTrigger><AccordionContent><div className="useful-link-grid">{visible.map((item) => <LinkCard key={item.id} item={item} query={query} bangla={bangla} labels={labels} />)}</div>{items.length > visible.length && <button className="show-more-links" onClick={() => setShown((current) => ({ ...current, [key]: limit + pageSize }))}>{t("links.showMore")} <span>({Math.min(pageSize, items.length - visible.length)})</span></button>}</AccordionContent></AccordionItem>; })}</Accordion></section>)}
  </div>;
}
