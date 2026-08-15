import { Check, Clipboard, Download, LockKeyhole, RefreshCw, Sparkles, WandSparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getCategory, tools } from "@/data/catalog";
import { runTool } from "@/lib/toolOperations";
import { toolInputPrivacyPolicy } from "@/lib/toolPrivacy";
import { useSettings } from "@/contexts/AppSettingsContext";
import { trpc } from "@/lib/trpc";
import "@/tool-page.css";

const generateTools = new Set(["password-generator", "random-string", "uuid-generator", "nanoid-generator", "random-number", "random-color", "gradient-generator"]);

export default function ToolPage() {
  const [location] = useLocation();
  const slug = location.split("/").filter(Boolean).at(-1) ?? "";
  const platformConfig = trpc.platform.config.useQuery();
  const tool = platformConfig.data?.hiddenToolSlugs.includes(slug) ? undefined : tools.find(item => item.slug === slug);
  const { language, t } = useSettings();
  const [input, setInput] = useState("");
  const [nonce, setNonce] = useState(0);
  const [copied, setCopied] = useState(false);
  const result = useMemo(() => tool ? (!input.trim() && !generateTools.has(tool.slug) ? { value: "" } : runTool(tool.slug, input, nonce)) : { value: "" }, [tool, input, nonce]);

  useEffect(() => {
    if (toolInputPrivacyPolicy.clearOnToolChange) setInput("");
  }, [tool?.slug]);

  if (!tool) return <div className="site-frame empty-page"><p className="eyebrow">ToolsHUB</p><h1>{t("notFound.title")}</h1><p>{t("notFound.copy")}</p><Link href="/tools" className="primary-cta">{t("common.back")}</Link></div>;
  const category = getCategory(tool.category);
  const related = tools.filter(item => item.category === tool.category && item.slug !== tool.slug).slice(0, 5);
  const output = result.error ? t("tool.invalid") : result.value;
  const copyOutput = async () => { if (!output) { toast.error(t("tool.invalid")); return; } try { await navigator.clipboard.writeText(output); setCopied(true); toast.success(t("tool.copied")); window.setTimeout(() => setCopied(false), 1800); } catch { toast.error(t("tool.copyFailed")); } };
  const downloadOutput = () => { if (!output) { toast.error(t("tool.invalid")); return; } try { const anchor = document.createElement("a"); const href = URL.createObjectURL(new Blob([output], { type: "text/plain" })); anchor.href = href; anchor.download = `${tool.slug}.txt`; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(href), 0); toast.success(t("tool.downloadText")); } catch { toast.error(t("tool.downloadFailed")); } };
  const needsGenerate = generateTools.has(tool.slug);

  return <div className="site-frame tool-page">
    <nav className="crumbs"><Link href="/tools">{t("nav.tools")}</Link><span>/</span><Link href={`/tools?category=${tool.category}`}>{t(`category.${category.id}`)}</Link><span>/</span><strong>{tool.name}</strong></nav>
    <section className="tool-intro"><div><p className="eyebrow">{category.name.toUpperCase()} / {t("tool.private")}</p><h1>{tool.name}</h1><p>{tool.description[language]}</p></div><span className={`category-icon ${category.color}`}><category.icon /></span></section>
    <div className="tool-layout"><section className="tool-workbench"><div className="workbench-head"><div><h2>{t("tool.input")}</h2><span><LockKeyhole size={14} /> {t("tool.private")}</span></div><button className="subtle-button" onClick={() => { setInput(""); setNonce(value => value + 1); }}><RefreshCw size={15} />{t("tool.reset")}</button></div><textarea value={input} onChange={event => setInput(event.target.value)} placeholder={t("tool.placeholder")} aria-label={t("tool.input")} spellCheck={false} autoComplete="off" data-lpignore="true" />
      <div className="workbench-actions"><button className="primary-cta compact" onClick={() => setNonce(value => value + 1)}>{needsGenerate ? <WandSparkles size={17} /> : <Sparkles size={17} />}{needsGenerate ? t("tool.generate") : t("tool.run")}</button></div>
      <div className="output-card"><div className="workbench-head"><div><h2>{t("tool.output")}</h2></div><div className="output-actions"><button className="icon-button" onClick={copyOutput} aria-label={t("common.copy")}>{copied ? <Check size={17} /> : <Clipboard size={17} />}</button><button className="icon-button" onClick={downloadOutput} aria-label={t("tool.downloadText")}><Download size={17} /></button></div></div><pre className={result.error ? "error-output" : ""}>{output || "—"}</pre></div>
      <details className="how-card"><summary>{t("tool.how")}</summary><p>{t("tool.howCopy")}</p><p className="privacy-exceptions">{t("tool.privacyExceptions")}</p></details>
    </section>
    <aside className="tool-aside"><div className="tool-aside-card"><h2>{t("tool.related")}</h2>{related.map(item => <Link href={`/tools/${item.slug}`} key={item.slug}><span>{item.name}</span><span>→</span></Link>)}</div></aside>
    </div>
  </div>;
}
