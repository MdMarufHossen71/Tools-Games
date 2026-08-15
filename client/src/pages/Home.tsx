import { ArrowRight, Gamepad2, LockKeyhole, Search, Sparkles, WandSparkles } from "lucide-react";
import { Link } from "wouter";
import ArticleCard, { type ArticleCardRecord } from "@/components/ArticleCard";
import { featuredTools, getCategory, toolCategories, tools } from "@/data/catalog";
import { useSettings } from "@/contexts/AppSettingsContext";
import { trpc } from "@/lib/trpc";

const games = [
  { name: "Wordle", type: "game.words", color: "lime", icon: "W" },
  { name: "2048", type: "game.puzzle", color: "orange", icon: "2K" },
  { name: "Snake", type: "game.arcade", color: "mint", icon: "S" },
  { name: "Chess", type: "game.strategy", color: "violet", icon: "♞" },
] as const;

export default function Home() {
  const { language, t } = useSettings();
  const { data: articles = [] } = trpc.blog.list.useQuery();
  const platformConfig = trpc.platform.config.useQuery();
  const isVisibleTool = (slug: string) => !platformConfig.data?.hiddenToolSlugs.includes(slug);
  const renderTool = (tool: (typeof tools)[number]) => {
    const category = getCategory(tool.category);
    const Icon = category.icon;
    return <Link key={tool.slug} href={`/tools/${tool.slug}`} className="tool-card"><span className={`tool-icon tone-${category.color}`}><Icon size={20} /></span><div className="tool-card-copy"><div><h3>{tool.name}</h3>{tool.ai && <span className="ai-chip">AI</span>}</div><p>{tool.description[language]}</p><span>{t(`category.${category.id}`)}</span></div><ArrowRight size={16} /></Link>;
  };
  return <>
    <section className="hero"><div className="hero-mesh" /><div className="site-frame hero-grid"><div className="hero-copy"><p className="eyebrow"><Sparkles size={15} />{t("hero.eyebrow")}</p><h1>{t("hero.title")}</h1><p className="hero-description">{t("hero.copy")}</p><div className="hero-actions"><Link href="/tools" className="primary-cta">{t("hero.explore")} <ArrowRight size={18} /></Link><Link href="/games" className="secondary-cta"><Gamepad2 size={18} />{t("hero.play")}</Link></div><div className="trust-row"><span><LockKeyhole size={15} />{t("hero.private")}</span><span>244+</span><span>40+</span></div></div><div className="hero-visual" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="visual-card visual-search"><Search /><span>JSON Formatter</span><i>↵</i></div><div className="visual-card visual-palette"><span>Color Lab</span><div><i /><i /><i /><i /></div></div><div className="visual-card visual-ai"><WandSparkles /><span>AI</span></div><div className="hero-core"><span>T</span><small>HUB</small></div></div></div></section>
    <section className="site-frame section-block"><div className="section-title-row"><div><p className="eyebrow">01 / {t("home.discover")}</p><h2>{t("home.categories")}</h2><p>{t("home.categoriesCopy")}</p></div><Link href="/tools" className="text-link">{t("common.viewAll")} <ArrowRight size={16} /></Link></div><div className="category-grid">{toolCategories.map((category) => { const Icon = category.icon; return <Link href={`/tools?category=${category.id}`} className={`category-card tone-${category.color}`} key={category.id}><span className="category-icon"><Icon size={22} /></span><div><h3>{t(`category.${category.id}`)}</h3><p>{category.count}+</p></div><ArrowRight size={17} /></Link>; })}</div></section>
    <section className="soft-section"><div className="site-frame section-block"><div className="section-title-row"><div><p className="eyebrow">02 / {t("home.work")}</p><h2>{t("home.popular")}</h2></div><Link href="/tools" className="text-link">{t("common.viewAll")} <ArrowRight size={16} /></Link></div><div className="tool-grid">{featuredTools.filter((tool) => isVisibleTool(tool.slug)).slice(0, 8).map(renderTool)}</div></div></section>
    <section className="site-frame section-block"><div className="section-title-row"><div><p className="eyebrow">03 / {t("home.discover")}</p><h2>{t("home.new")}</h2><p>{t("tools.copy")}</p></div><Link href="/tools" className="text-link">{t("common.viewAll")} <ArrowRight size={16} /></Link></div><div className="tool-grid">{tools.filter((tool) => isVisibleTool(tool.slug)).slice(-4).map(renderTool)}</div></section>
    <section className="soft-section"><div className="site-frame section-block game-section"><div className="section-title-row"><div><p className="eyebrow">04 / {t("home.break")}</p><h2>{t("home.games")}</h2><p>{t("hero.detail")}</p></div><Link href="/games" className="text-link">{t("common.viewAll")} <ArrowRight size={16} /></Link></div><div className="game-grid">{games.map((game) => <Link href="/games" className={`game-card game-${game.color}`} key={game.name}><div className="game-icon">{game.icon}</div><div><span>{t(game.type)}</span><h3>{game.name}</h3></div><Gamepad2 size={18} /></Link>)}</div></div></section>
    <section className="site-frame section-block home-blog"><div className="section-title-row"><div><p className="eyebrow">05 / {t("home.blog")}</p><h2>{t("home.blog")}</h2><p>{t("home.blogCopy")}</p></div><Link href="/blog" className="text-link">{t("common.viewAll")} <ArrowRight size={16} /></Link></div><div className="article-grid home-article-grid">{articles.slice(0, 3).map((article) => <ArticleCard key={article.id} article={article as ArticleCardRecord} />)}</div></section>
  </>;
}
