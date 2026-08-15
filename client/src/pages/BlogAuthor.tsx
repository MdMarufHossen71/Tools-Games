import { useParams } from "wouter";
import ArticleCard, { type ArticleCardRecord } from "@/components/ArticleCard";
import { useSettings } from "@/contexts/AppSettingsContext";
import { trpc } from "@/lib/trpc";

export default function BlogAuthor() {
  const { username } = useParams<{ username: string }>(); const { t } = useSettings();
  const { data = [] } = trpc.blog.list.useQuery({ author: username === "toolshub-team" ? "ToolsHUB Team" : username });
  return <main className="page-shell author-page"><span className="eyebrow">/ {t("blog.author")}</span><h1>{username === "toolshub-team" ? "ToolsHUB Team" : username}</h1><p>{t("blog.subheading")}</p><div className="article-grid">{data.map((article) => <ArticleCard key={article.id} article={article as ArticleCardRecord} />)}</div></main>;
}
