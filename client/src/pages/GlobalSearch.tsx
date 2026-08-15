import { Gamepad2, Search, Wrench } from "lucide-react";
import { Link, useSearch } from "wouter";
import { Globe2 } from "lucide-react";
import { tools } from "@/data/catalog";
import { useSettings } from "@/contexts/AppSettingsContext";
import { trpc } from "@/lib/trpc";

const games = ["Wordle", "2048", "Snake", "Chess", "Tic Tac Toe", "Memory Match", "Sudoku", "Minesweeper"];

export default function GlobalSearch() {
  const search = useSearch(); const params = new URLSearchParams(search); const query = (params.get("q") || "").trim();
  const { language, t } = useSettings();
  const articleQuery = trpc.blog.list.useQuery(query ? { query } : undefined);
  const usefulLinksQuery = trpc.usefulLinks.list.useQuery();
  const platformConfig = trpc.platform.config.useQuery();
  const needle = query.toLocaleLowerCase();
  const toolResults = query ? tools.filter((tool) => !platformConfig.data?.hiddenToolSlugs.includes(tool.slug) && `${tool.name} ${tool.description[language]} ${tool.category}`.toLocaleLowerCase().includes(needle)).slice(0, 12) : [];
  const gameResults = query ? games.filter((game) => game.toLocaleLowerCase().includes(needle)) : [];
  const linkResults = query ? (usefulLinksQuery.data ?? []).filter((link) => `${link.name} ${link.nameBn ?? ""} ${link.description} ${link.category} ${link.categoryBn ?? ""}`.toLocaleLowerCase().includes(needle)).slice(0, 15) : [];
  const count = toolResults.length + gameResults.length + (articleQuery.data?.length ?? 0) + linkResults.length;
  return <main className="page-shell search-results"><header className="page-heading"><p className="eyebrow"><Search size={15} /> {t("common.search")}</p><h1>{query || t("search.placeholder")}</h1><p>{count} {t("tools.found")}</p></header>{!query ? <div className="blog-empty">{t("search.placeholder")}</div> : <div className="search-sections">
    <section><h2><Wrench size={18} /> {t("nav.tools")}</h2><div className="search-list">{toolResults.map((tool) => <Link href={`/tools/${tool.slug}`} key={tool.slug}><strong>{tool.name}</strong><span>{tool.description[language]}</span></Link>)}{toolResults.length === 0 && <p>{t("blog.empty")}</p>}</div></section>
    <section><h2><Gamepad2 size={18} /> {t("nav.games")}</h2><div className="search-list">{gameResults.map((game) => <Link href="/games" key={game}><strong>{game}</strong><span>{t("games.play")}</span></Link>)}{gameResults.length === 0 && <p>{t("blog.empty")}</p>}</div></section>
    <section><h2><Globe2 size={18} /> {t("nav.links")}</h2><div className="search-list">{linkResults.map((link) => <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.id}><strong>{language === "bn" && link.nameBn ? link.nameBn : link.name}</strong><span>{link.description}</span></a>)}{!usefulLinksQuery.isLoading && linkResults.length === 0 && <p>{t("blog.empty")}</p>}</div></section>
    <section><h2><Search size={18} /> {t("nav.blog")}</h2><div className="search-list">{articleQuery.data?.map((article) => <Link href={`/blog/${article.slug}`} key={article.id}><strong>{article.title}</strong><span>{article.excerpt}</span></Link>)}{!articleQuery.isLoading && (articleQuery.data?.length ?? 0) === 0 && <p>{t("blog.empty")}</p>}</div></section>
  </div>}</main>;
}
