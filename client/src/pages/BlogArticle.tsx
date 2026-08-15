import { Copy, Facebook, Heart, Loader2, MessageCircle, Share2 } from "lucide-react";
import { Streamdown } from "streamdown";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import ArticleCard, { type ArticleCardRecord } from "@/components/ArticleCard";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSettings } from "@/contexts/AppSettingsContext";
import { trpc } from "@/lib/trpc";
import { useEffect, useMemo, useState } from "react";

const YOUTUBE_URL = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/g;
const DEFAULT_SOCIAL_CARD = "/manus-storage/toolshub-social-card_ac486587.png";
function displayDate(value: Date | string | null, locale: string) { return value ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(value)) : ""; }

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useSettings(); const { isAuthenticated } = useAuth(); const utils = trpc.useUtils();
  const { data, isLoading } = trpc.blog.bySlug.useQuery({ slug: slug || "" });
  const relatedQuery = trpc.blog.list.useQuery();
  const [progress, setProgress] = useState(0); const [translated, setTranslated] = useState<{ title: string; excerpt: string; content: string; language: string; translated: boolean } | null>(null);
  const like = trpc.blog.toggleLike.useMutation({ onSuccess: () => utils.blog.bySlug.invalidate({ slug: slug || "" }) });
  const translate = trpc.blog.translate.useMutation({ onSuccess: (result) => { if (result) setTranslated(result); }, onError: () => toast.error(t("tool.invalid")) });
  useEffect(() => { setTranslated(null); }, [language, slug]);
  useEffect(() => {
    const article = data?.article;
    if (!article) return;
    const title = `ToolsHUB — ${article.metaTitle || article.title}`;
    const description = article.metaDescription || article.excerpt || "ToolsHUB editorial guidance for better work online.";
    const image = article.coverImage || DEFAULT_SOCIAL_CARD;
    const setMeta = (selector: string, value: string) => document.querySelector(selector)?.setAttribute("content", value);
    document.title = title;
    setMeta('meta[name="description"]', description); setMeta('meta[property="og:title"]', title); setMeta('meta[property="og:description"]', description); setMeta('meta[property="og:image"]', image); setMeta('meta[name="twitter:title"]', title); setMeta('meta[name="twitter:description"]', description); setMeta('meta[name="twitter:image"]', image);
    const scriptId = "toolshub-article-jsonld"; document.getElementById(scriptId)?.remove();
    const schema = document.createElement("script"); schema.id = scriptId; schema.type = "application/ld+json"; schema.text = JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: article.title, description, image: [image], datePublished: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined, dateModified: article.updatedAt ? new Date(article.updatedAt).toISOString() : undefined, author: { "@type": "Organization", name: article.authorName || "ToolsHUB Team" }, publisher: { "@type": "Organization", name: "ToolsHUB", logo: { "@type": "ImageObject", url: DEFAULT_SOCIAL_CARD } }, mainEntityOfPage: { "@type": "WebPage", "@id": window.location.href.split("?")[0] } }); document.head.appendChild(schema);
    return () => document.getElementById(scriptId)?.remove();
  }, [data?.article]);
  useEffect(() => { const update = () => { const maximum = document.documentElement.scrollHeight - window.innerHeight; setProgress(maximum > 0 ? Math.min(100, Math.max(0, window.scrollY / maximum * 100)) : 0); }; update(); window.addEventListener("scroll", update, { passive: true }); return () => window.removeEventListener("scroll", update); }, []);
  const videoIds = useMemo(() => Array.from((translated?.content ?? data?.article.content ?? "").matchAll(YOUTUBE_URL)).map((match) => match[1]), [data?.article.content, translated?.content]);
  if (isLoading) return <main className="page-shell article-loader"><Loader2 className="spin" /></main>;
  if (!data) return <main className="page-shell blog-empty">{t("blog.empty")}</main>;
  const { article, reaction } = data; const displayed = translated ?? { title: article.title, excerpt: article.excerpt ?? "", content: article.content, language: article.language, translated: false }; const categories = Array.isArray(article.categories) ? article.categories.filter((item): item is string => typeof item === "string") : [];
  const related = (relatedQuery.data ?? []).filter((item) => item.id !== article.id && Array.isArray(item.categories) && item.categories.some((category) => categories.includes(String(category)))).slice(0, 3) as ArticleCardRecord[];
  const copyLink = async () => { try { await navigator.clipboard.writeText(window.location.href); toast.success(t("blog.copied")); } catch { toast.error(t("tool.copyFailed")); } };
  const shareText = encodeURIComponent(`${displayed.title} — ToolsHUB`); const shareUrl = encodeURIComponent(window.location.href);
  return <main className="article-page"><div className="reading-progress" style={{ transform: `scaleX(${progress / 100})` }} />
    <header className="article-hero page-shell"><div className="article-meta">{categories.map((category) => <span key={category}>{category}</span>)}</div><h1>{displayed.title}</h1><p>{displayed.excerpt}</p><div className="article-byline"><span>{t("blog.by")} <Link href="/blog/author/toolshub-team">{article.authorName}</Link></span><span>{displayDate(article.publishedAt, language)}</span><span>{article.readingMinutes} {t("blog.minuteRead")}</span></div></header>
    <section className="page-shell article-layout"><article className="article-prose"><div className="article-utility"><button onClick={copyLink}><Copy size={16} /> {t("blog.copyLink")}</button><a href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /></a><a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noreferrer"><Facebook size={17} /></a><button onClick={() => isAuthenticated ? like.mutate({ articleId: article.id }) : startLogin()} title={isAuthenticated ? t("blog.like") : t("blog.loginToLike")} className={reaction.liked ? "liked" : ""}><Heart size={17} fill={reaction.liked ? "currentColor" : "none"} /> {reaction.count}</button></div>
      <Streamdown>{displayed.content.replace(YOUTUBE_URL, "")}</Streamdown>{videoIds.map((id) => <div className="youtube-embed" key={id}><iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title="YouTube video" loading="lazy" allowFullScreen /></div>)}
    </article><aside className="article-aside"><button className="translation-action" disabled={translate.isPending || article.language === language} onClick={() => translate.mutate({ slug: article.slug, language })}><Share2 size={16} /> {translate.isPending ? t("blog.translating") : t("blog.readInLanguage")}</button>{translated?.translated && <p className="translation-note">{t("blog.readInLanguage")}</p>}<h2>{t("blog.related")}</h2>{related.map((item) => <ArticleCard key={item.id} article={item} />)}</aside></section>
  </main>;
}
