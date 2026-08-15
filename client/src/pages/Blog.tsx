import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import ArticleCard, { type ArticleCardRecord } from "@/components/ArticleCard";
import { useSettings } from "@/contexts/AppSettingsContext";
import { trpc } from "@/lib/trpc";

const categories = ["Tech News", "Tools & Tips", "How-to Guides", "App Reviews", "AI", "বাংলাদেশ"];

export default function Blog() {
  const { t } = useSettings();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("all");
  const queryInput = useMemo(() => ({ query: search || undefined, category: selected === "all" ? undefined : selected }), [search, selected]);
  const { data: articles = [], isLoading } = trpc.blog.list.useQuery(queryInput);
  const featured = articles.find((article) => article.isFeatured) as ArticleCardRecord | undefined;
  const remainder = articles.filter((article) => article.id !== featured?.id) as ArticleCardRecord[];
  return <main className="page-shell blog-page">
    <section className="blog-head"><div><span className="eyebrow">/ editorial</span><h1>{t("blog.heading")}</h1><p>{t("blog.subheading")}</p></div><div className="blog-search"><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("blog.search")} aria-label={t("blog.search")} /></div></section>
    <section className="blog-filters" aria-label={t("blog.allCategories")}><SlidersHorizontal size={17} /><button className={selected === "all" ? "active" : ""} onClick={() => setSelected("all")}>{t("blog.allCategories")}</button>{categories.map((category) => <button key={category} className={selected === category ? "active" : ""} onClick={() => setSelected(category)}>{category}</button>)}</section>
    {isLoading ? <div className="blog-loading" /> : articles.length === 0 ? <p className="blog-empty">{t("blog.empty")}</p> : <>
      {featured && <section className="blog-featured"><p className="section-kicker">{t("blog.featured")}</p><ArticleCard article={featured} featured /></section>}
      <section className="blog-list"><div className="section-heading"><p className="section-kicker">{t("blog.latest")}</p><span>{remainder.length}</span></div><div className="article-grid">{remainder.map((article) => <ArticleCard key={article.id} article={article} />)}</div></section>
    </>}
  </main>;
}
