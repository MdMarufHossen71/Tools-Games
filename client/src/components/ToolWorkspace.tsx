/** Cobalt Workshop design reminder: the workbench presents input, output and actions as a fast visual loop; every result is local and inspectable. */
import { useEffect, useState } from "react";
import { Check, Clipboard, Download, History, Play, RotateCcw, ShieldCheck, Trash2, TriangleAlert, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Tool } from "@/data/tools";
import { useToolInputMemory } from "@/hooks/useToolInputMemory";
import { isToolImplemented, runTool, toolPlaceholder } from "@/lib/toolOperations";
import { isSensitiveTool } from "@/lib/sensitiveTools";
import { useTranslation } from "@/contexts/AppSettingsContext";
import type { TranslationKey } from "@/i18n/translations";

const needsMode = new Set(["reverse-text", "sort-list", "base64-text", "url-encode-decode", "html-entities", "yaml-json-toml-xml-converter", "random-number-generator", "uuid-generator"]);

/** Mode values are stable identifiers; their labels come from the dictionary. */
const MODE_OPTIONS: Array<{ value: string; key: TranslationKey }> = [
  { value: "default", key: "tool.mode.default" },
  { value: "decode", key: "tool.mode.decode" },
  { value: "words", key: "tool.mode.words" },
  { value: "lines", key: "tool.mode.lines" },
  { value: "desc", key: "tool.mode.desc" },
  { value: "bulk", key: "tool.mode.bulk" },
  { value: "yaml", key: "tool.mode.yaml" },
  { value: "xml", key: "tool.mode.xml" },
  { value: "unescape", key: "tool.mode.unescape" },
];

export function ToolWorkspace({ tool }: { tool: Tool }) {
  const { t, language } = useTranslation();
  const placeholder = toolPlaceholder(tool.slug);
  const memory = useToolInputMemory(tool.slug, placeholder);
  const [option, setOption] = useState("default");
  const [output, setOutput] = useState(() => runTool(tool.slug, memory.input, option, t));
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");

  const sensitive = isSensitiveTool(tool.slug);
  const built = isToolImplemented(tool.slug);
  const description = tool.description[language] || tool.description.en;

  useEffect(() => {
    setOutput(runTool(tool.slug, memory.input, option, t));
  }, [memory.input, option, tool.slug, t]);

  // Clear a transient confirmation without leaving a timer behind on unmount.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output.text);
      setCopied(true);
      setNotice(t("tool.copied"));
    } catch {
      // Blocked clipboard permission or a non-secure context: say so instead of failing silently.
      setNotice(t("tool.copyFailed"));
    }
  };

  const download = () => {
    const extension = output.html ? "html" : "txt";
    const file = new Blob([output.text], { type: output.html ? "text/html" : "text/plain" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${tool.slug}-result.${extension}`;
    anchor.rel = "noopener";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Revoked on the next task: revoking synchronously can cancel the download.
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setNotice(t("tool.downloaded"));
  };

  const header = (
    <div className="workbench-header">
      <div>
        <p className="eyebrow">{language === "bn" ? tool.categoryBn : tool.category}</p>
        <h1 id="workbench-title">{tool.name}</h1>
        <p>{description}</p>
      </div>
      <div className="privacy-chip">
        <ShieldCheck className="size-4" aria-hidden="true" />
        {t("tool.browserOnly")}
      </div>
    </div>
  );

  // A listed-but-unbuilt tool used to echo the input back, which looked like a real
  // result. Say plainly that it does not exist yet.
  if (!built) {
    return (
      <section className="workbench" aria-labelledby="workbench-title">
        <div className="workbench-header">
          <div>
            <p className="eyebrow">{language === "bn" ? tool.categoryBn : tool.category}</p>
            <h1 id="workbench-title">{tool.name}</h1>
            <p>{description}</p>
          </div>
          <div className="privacy-chip privacy-chip-muted">
            <Wrench className="size-4" aria-hidden="true" />
            {t("tool.unavailable.badge")}
          </div>
        </div>
        <div className="bench-panel bench-unavailable" role="note">
          <h2>{t("tool.unavailable.title")}</h2>
          <p>{t("tool.unavailable.copy")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="workbench" aria-labelledby="workbench-title">
      {header}
      {memory.restoreAvailable && (
        <button type="button" className="restore-banner" onClick={memory.restore}>
          <History className="size-4" aria-hidden="true" />
          {t("memory.restore")}
        </button>
      )}
      <div className="bench-grid">
        <div className="bench-panel">
          <div className="bench-label">
            <span id="tool-input-label">{t("tool.input")}</span>
            {needsMode.has(tool.slug) && (
              <select value={option} onChange={(event) => setOption(event.target.value)} aria-label={t("tool.mode.label")}>
                {MODE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.key)}
                  </option>
                ))}
              </select>
            )}
          </div>
          <textarea value={memory.input} onChange={(event) => memory.setInput(event.target.value)} className="tool-textarea" spellCheck={false} placeholder={placeholder} aria-label={t("tool.inputLabel", { name: tool.name })} />
          <div className="bench-actions">
            <Button size="sm" onClick={() => setOutput(runTool(tool.slug, memory.input, option, t))}>
              <Play className="mr-2 size-3.5" aria-hidden="true" />
              {t("tool.run")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => memory.setInput("")}>
              <RotateCcw className="mr-2 size-3.5" aria-hidden="true" />
              {t("common.clear")}
            </Button>
            {memory.canRemember && memory.restoreAvailable && (
              <Button variant="ghost" size="sm" onClick={memory.forget}>
                <Trash2 className="mr-2 size-3.5" aria-hidden="true" />
                {t("memory.forget")}
              </Button>
            )}
          </div>
        </div>
        <div className="bench-panel bench-result">
          <div className="bench-label">
            <span>{output.label ?? t("tool.output")}</span>
            <div className="bench-label-actions">
              <Button size="icon" variant="ghost" onClick={copy} aria-label={t("common.copy")}>
                {copied ? <Check className="size-4 bench-check" aria-hidden="true" /> : <Clipboard className="size-4" aria-hidden="true" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={download} aria-label={t("common.download")}>
                <Download className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
          {output.html ? (
            <div className="tool-html-preview" dangerouslySetInnerHTML={{ __html: output.html }} />
          ) : (
            // `role="status"` so a recomputed result is announced, not just repainted.
            <pre className={output.error ? "tool-output tool-output-error" : "tool-output"} role="status" aria-live="polite">
              {output.text}
            </pre>
          )}
          <div className="bench-actions">
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? <Check className="mr-2 size-3.5" aria-hidden="true" /> : <Clipboard className="mr-2 size-3.5" aria-hidden="true" />}
              {t("common.copy")}
            </Button>
            <Button variant="outline" size="sm" onClick={download}>
              <Download className="mr-2 size-3.5" aria-hidden="true" />
              {t("common.download")}
            </Button>
          </div>
        </div>
      </div>
      {/* Copy and download give no visual result of their own, so announce them. */}
      <p className="sr-only" role="status" aria-live="polite">
        {notice}
      </p>
      {sensitive ? (
        <p className="tool-note">
          <ShieldCheck className="size-4" aria-hidden="true" />
          {t("memory.private")}
        </p>
      ) : memory.storageWarning ? (
        <p className="tool-note tool-note-warning">
          <TriangleAlert className="size-4" aria-hidden="true" />
          {t("memory.full")}
        </p>
      ) : memory.tooLarge ? (
        <p className="tool-note tool-note-warning">
          <TriangleAlert className="size-4" aria-hidden="true" />
          {t("memory.tooLarge")}
        </p>
      ) : (
        <p className="tool-note">
          <ShieldCheck className="size-4" aria-hidden="true" />
          {t("tool.privacy")}
        </p>
      )}
    </section>
  );
}
