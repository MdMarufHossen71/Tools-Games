import { ArrowUpRight, Clock3 } from "lucide-react";
import { Link } from "wouter";
import { useSettings } from "@/contexts/AppSettingsContext";

export type ArticleCardRecord = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  authorName: string;
  categories: unknown;
  coverImage: string | null;
  readingMinutes: number;
  publishedAt: Date | string | null;
  isFeatured: boolean;
};

function readableDate(value: Date | string | null, locale: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default function ArticleCard({ article, featured = false }: { article: ArticleCardRecord; featured?: boolean }) {
  const { language, t } = useSettings();
  const categories = Array.isArray(article.categories) ? article.categories.filter((item): item is string => typeof item === "string") : [];
  return <article className={`article-card ${featured ? "article-card-featured" : ""}`}>
    <Link href={`/blog/${article.slug}`} className="article-cover" aria-label={article.title}>
      {article.coverImage ? <img src={article.coverImage} alt="" /> : <div className="article-cover-art"><span>ToolsHUB</span><i /><b>{categories[0] || "Tools & Tips"}</b></div>}
    </Link>
    <div className="article-card-body">
      <div className="article-meta"><span>{categories[0] || "Tools & Tips"}</span><span>{readableDate(article.publishedAt, language)}</span></div>
      <h2><Link href={`/blog/${article.slug}`}>{article.title}</Link></h2>
      <p>{article.excerpt}</p>
      <div className="article-card-footer"><span><Clock3 size={15} /> {article.readingMinutes} {t("blog.minuteRead")}</span><Link href={`/blog/${article.slug}`} className="article-link">{t("blog.readArticle")} <ArrowUpRight size={16} /></Link></div>
    </div>
  </article>;
}
