import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, FilePlus2, ImageUp, Pencil, Save, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import { useLocation } from "wouter";
import { useSettings } from "../contexts/AppSettingsContext";
import "../admin-blog.css";

type EditorState = {
  id?: number; title: string; slug: string; excerpt: string; content: string; language: "en" | "bn" | "hi" | "ur" | "ar" | "es" | "fr" | "de";
  coverImage: string; categories: string; tags: string; status: "draft" | "scheduled" | "published"; isFeatured: boolean; isPinnedHome: boolean;
  metaTitle: string; metaDescription: string; readingMinutes: number; publishedAt: string; scheduledAt: string;
};

const blankArticle = (): EditorState => ({ title: "", slug: "", excerpt: "", content: "# A useful new guide\n\nWrite your article in **Markdown**.", language: "en", coverImage: "", categories: "Tools & Tips", tags: "", status: "draft", isFeatured: false, isPinnedHome: false, metaTitle: "", metaDescription: "", readingMinutes: 4, publishedAt: "", scheduledAt: "" });
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180);
const toDatetimeLocal = (value: Date | string | null | undefined) => value ? new Date(value).toISOString().slice(0, 16) : "";

export default function AdminBlog() {
  const { user, loading } = useAuth();
  const { t } = useSettings();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState<EditorState | null>(null);
  const [uploading, setUploading] = useState(false);
  const list = trpc.admin.blog.list.useQuery(undefined, { enabled: Boolean(user?.role === "admin") });
  const utils = trpc.useUtils();
  const save = trpc.admin.blog.save.useMutation({ onSuccess: async () => { await utils.admin.blog.list.invalidate(); setEditing(null); } });
  const upload = trpc.admin.blog.uploadCover.useMutation();
  const articles = list.data ?? [];
  const form = editing;
  const previewTitle = useMemo(() => form?.title || "Untitled article", [form?.title]);

  if (loading) return <div className="admin-state">Loading secure workspace…</div>;
  if (user?.role !== "admin") return <section className="admin-state"><ShieldCheck size={28} /><h1>{t("admin.title")}</h1><p>{t("admin.forbidden")}</p><Button onClick={() => navigate("/")}>{t("general.home")}</Button></section>;

  const editArticle = (article: typeof articles[number]) => setEditing({ id: article.id, title: article.title, slug: article.slug, excerpt: article.excerpt ?? "", content: article.content, language: article.language as EditorState["language"], coverImage: article.coverImage ?? "", categories: (article.categories as string[]).join(", "), tags: (article.tags as string[]).join(", "), status: article.status, isFeatured: article.isFeatured, isPinnedHome: article.isPinnedHome, metaTitle: article.metaTitle ?? "", metaDescription: article.metaDescription ?? "", readingMinutes: article.readingMinutes, publishedAt: toDatetimeLocal(article.publishedAt), scheduledAt: toDatetimeLocal(article.scheduledAt) });
  const update = <K extends keyof EditorState>(key: K, value: EditorState[K]) => setEditing((current) => current ? { ...current, [key]: value } : current);
  const uploadCover = async (file?: File) => {
    if (!file || !form) return;
    if (!/image\/(jpeg|png|webp)/.test(file.type)) return;
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("Could not read that image.")); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(file); });
      const result = await upload.mutateAsync({ dataUrl, filename: file.name });
      update("coverImage", result.url);
    } finally { setUploading(false); }
  };
  const submit = () => {
    if (!form) return;
    save.mutate({ id: form.id, title: form.title, slug: form.slug || slugify(form.title), excerpt: form.excerpt || null, content: form.content, language: form.language, coverImage: form.coverImage || null, categories: form.categories.split(",").map((value) => value.trim()).filter(Boolean), tags: form.tags.split(",").map((value) => value.trim()).filter(Boolean), status: form.status, isFeatured: form.isFeatured, isPinnedHome: form.isPinnedHome, metaTitle: form.metaTitle || null, metaDescription: form.metaDescription || null, readingMinutes: Math.max(1, Number(form.readingMinutes) || 1), publishedAt: form.publishedAt ? new Date(form.publishedAt) : null, scheduledAt: form.scheduledAt ? new Date(form.scheduledAt) : null });
  };

  if (!form) return <section className="admin-page container"><div className="admin-topline"><div><p className="eyebrow">ToolsHUB Admin</p><h1>{t("admin.blog")}</h1><p>Publish useful, discoverable guidance for the ToolsHUB community.</p></div><div className="admin-link-actions"><Button variant="outline" onClick={() => navigate("/admin/links")}>Manage links</Button><Button onClick={() => setEditing(blankArticle())}><FilePlus2 size={16} /> {t("admin.new")}</Button></div></div><div className="admin-article-list">{articles.map((article) => <article key={article.id} className="admin-article-row"><div><span className={`status-pill ${article.status}`}>{article.status}</span><h2>{article.title}</h2><p>/{article.slug} · {(article.categories as string[]).join(" · ")} · {article.readingMinutes} min read</p></div><Button variant="outline" onClick={() => editArticle(article)}><Pencil size={15} /> {t("admin.edit")}</Button></article>)}</div></section>;

  return <section className="admin-page container"><div className="admin-editor-top"><Button variant="ghost" onClick={() => setEditing(null)}><ArrowLeft size={16} /> {t("general.back")}</Button><div><p className="eyebrow">ToolsHUB Admin</p><h1>{t("admin.editor")}</h1></div><Button disabled={save.isPending} onClick={submit}><Save size={16} /> {save.isPending ? "Saving…" : t("admin.save")}</Button></div>{save.error ? <p className="admin-error">{save.error.message}</p> : null}<div className="admin-editor-grid"><div className="admin-form"><label>{t("admin.titleLabel")}<Input value={form.title} onChange={(event) => { update("title", event.target.value); if (!form.id) update("slug", slugify(event.target.value)); }} /></label><label>{t("admin.slug")}<Input value={form.slug} onChange={(event) => update("slug", slugify(event.target.value))} /></label><label>{t("admin.excerpt")}<Textarea value={form.excerpt} onChange={(event) => update("excerpt", event.target.value)} /></label><label>{t("admin.markdown")}<Textarea className="admin-markdown" value={form.content} onChange={(event) => update("content", event.target.value)} /></label><div className="admin-fields"><label>{t("admin.categories")}<Input value={form.categories} onChange={(event) => update("categories", event.target.value)} /></label><label>{t("admin.tags")}<Input value={form.tags} onChange={(event) => update("tags", event.target.value)} /></label><label>{t("admin.status")}<select value={form.status} onChange={(event) => update("status", event.target.value as EditorState["status"])}><option value="draft">{t("admin.draft")}</option><option value="published">{t("admin.published")}</option><option value="scheduled">{t("admin.scheduled")}</option></select></label><label>Language<select value={form.language} onChange={(event) => update("language", event.target.value as EditorState["language"])}>{["en", "bn", "hi", "ur", "ar", "es", "fr", "de"].map((locale) => <option key={locale} value={locale}>{locale.toUpperCase()}</option>)}</select></label><label>Reading time (min)<Input type="number" min="1" value={form.readingMinutes} onChange={(event) => update("readingMinutes", Number(event.target.value))} /></label><label>{t("admin.publishedAt")}<Input type="datetime-local" value={form.publishedAt} onChange={(event) => update("publishedAt", event.target.value)} /></label><label>{t("admin.scheduledAt")}<Input type="datetime-local" value={form.scheduledAt} onChange={(event) => update("scheduledAt", event.target.value)} /></label></div><div className="admin-switches"><label><Switch checked={form.isFeatured} onCheckedChange={(value) => update("isFeatured", value)} />{t("admin.featured")}</label><label><Switch checked={form.isPinnedHome} onCheckedChange={(value) => update("isPinnedHome", value)} />{t("admin.pinned")}</label></div><label>{t("admin.upload")}<span className="cover-upload"><ImageUp size={16} /> <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadCover(event.target.files?.[0])} /> {uploading ? "Uploading…" : "PNG, JPEG or WebP"}</span></label>{form.coverImage ? <img className="admin-cover-preview" src={form.coverImage} alt="Selected cover" /> : null}<label>SEO title<Input value={form.metaTitle} onChange={(event) => update("metaTitle", event.target.value)} /></label><label>SEO description<Textarea value={form.metaDescription} onChange={(event) => update("metaDescription", event.target.value)} /></label></div><aside className="admin-preview"><p className="eyebrow">{t("admin.preview")}</p><h2>{previewTitle}</h2>{form.coverImage ? <img src={form.coverImage} alt="" /> : null}<Streamdown>{form.content}</Streamdown></aside></div></section>;
}
