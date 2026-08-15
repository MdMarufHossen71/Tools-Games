import { Check, Clipboard, Download, FileImage, FileText, Info, LockKeyhole, RefreshCw, Sparkles, WandSparkles, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import React, { type DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getCategory, tools } from "@/data/catalog";
import { localOperationSlugs, runTool } from "@/lib/toolOperations";
import { inputAfterToolChange, toolInputPrivacyPolicy } from "@/lib/toolPrivacy";
import { fileInputMode } from "@/lib/fileToolInput";
import { getToolWorkspaceModel } from "@/lib/toolWorkspaceModel";
import { canvasImageAction, imageOutputExtension } from "@/lib/imageToolOptions";
import { imageCropRect, type CropAspect } from "@/lib/imageCrop";
import { boundedCanvasSize, imageSourceForProcessing } from "@/lib/imageProcessing";
import { useSettings } from "@/contexts/AppSettingsContext";
import { trpc } from "@/lib/trpc";
import "@/tool-page.css";
import "@/tool-page-image.css";

const generateTools = new Set(["password-generator", "random-string", "uuid-generator", "nanoid-generator", "random-number", "random-color", "gradient-generator"]);
const processors = new Set<string>(localOperationSlugs);

const examples: Record<string, string> = {
  "json-formatter": '{"name":"ToolsHUB","free":true}',
  "csv-converter": "name,score\nAsha,9",
  "find-replace": "old\nnew\nReplace old with new",
  "email-signature-builder": "Asha Rahman\nDesigner\nToolsHUB\n+880 1XXXXXXXXX\nhttps://example.com",
  "email-pattern-builder": "Asha\nRahman\nexample.com",
  "mailto-link-builder": "hello@example.com\nHello from ToolsHUB\nYour message here",
  "random-number": "1, 100",
  "regex-tester": "\\btool\\b\nToolsHUB tool",
  "query-string-parser": "https://example.com/?ref=toolshub&lang=bn",
};

export default function ToolPage() {
  const [location] = useLocation();
  const slug = location.split("/").filter(Boolean).at(-1) ?? "";
  const platformConfig = trpc.platform.config.useQuery();
  const tool = platformConfig.data?.hiddenToolSlugs.includes(slug) ? undefined : tools.find(item => item.slug === slug);
  const { language, t } = useSettings();
  const copy = {
    choose: t("workspace.choose"), upload: t("workspace.upload"), drop: t("workspace.drop"), ready: t("workspace.ready"), remove: t("workspace.remove"), active: t("workspace.active"), guided: t("workspace.guided"), example: t("workspace.example"), noOutput: t("workspace.noOutput"), processing: t("workspace.processing"), imageReady: t("workspace.imageReady"), resize: t("workspace.resize"), rotate: t("workspace.rotate"), flip: t("workspace.flip"), horizontal: t("workspace.horizontal"), vertical: t("workspace.vertical"), format: t("workspace.format"), quality: t("workspace.quality"), processedImage: t("workspace.processedImage"),
  };
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [copied, setCopied] = useState(false);
  const [imageOutput, setImageOutput] = useState("");
  const [imageError, setImageError] = useState(false);
  const [imageScale, setImageScale] = useState(100);
  const [imageRotation, setImageRotation] = useState(90);
  const [flipAxis, setFlipAxis] = useState<"horizontal" | "vertical">("horizontal");
  const [imageMime, setImageMime] = useState<"image/png" | "image/jpeg" | "image/webp">("image/png");
  const [imageQuality, setImageQuality] = useState(82);
  const [cropZoom, setCropZoom] = useState(100);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropAspect, setCropAspect] = useState<CropAspect>("free");
  const previousToolSlug = useRef<string | undefined>(undefined);
  const cropPointer = useRef<{ id: number; clientX: number; clientY: number; cropX: number; cropY: number } | null>(null);
  const workspace = tool ? getToolWorkspaceModel(tool.category) : getToolWorkspaceModel("text");
  const isFileTool = workspace.acceptsFile;
  const imageAction = tool ? canvasImageAction(tool.slug) : undefined;
  const usesCanvasImage = Boolean(imageAction);
  const hasProcessor = Boolean(tool && (processors.has(tool.slug) || usesCanvasImage));
  const needsGenerate = Boolean(tool && generateTools.has(tool.slug));
  const result = useMemo(() => tool ? (!input.trim() && !needsGenerate ? { value: "" } : runTool(tool.slug, input, nonce)) : { value: "" }, [tool, input, needsGenerate, nonce]);

  useEffect(() => {
    setInput(current => inputAfterToolChange(previousToolSlug.current, tool?.slug, current));
    setSelectedFile(null); setImageOutput(""); setImageError(false); setHasRun(false); previousToolSlug.current = tool?.slug;
  }, [tool?.slug]);

  if (!tool) return <div className="site-frame empty-page"><p className="eyebrow">ToolsHUB</p><h1>{t("notFound.title")}</h1><p>{t("notFound.copy")}</p><Link href="/tools" className="primary-cta">{t("common.back")}</Link></div>;
  const category = getCategory(tool.category);
  const related = tools.filter(item => item.category === tool.category && item.slug !== tool.slug).slice(0, 5);
  const spec = { accept: workspace.accept ?? "*/*", type: workspace.fileType ?? "file" };
  const example = examples[tool.slug];
  const output = result.error ? t("tool.invalid") : result.value;
  const clear = () => { setInput(""); setSelectedFile(null); setImageOutput(""); setImageError(false); setHasRun(false); setCropZoom(100); setCropX(0); setCropY(0); setCropAspect("free"); setNonce(value => value + 1); };
  const loadFile = (file?: File) => {
    if (!file) return;
    setSelectedFile(file); setImageOutput(""); setImageError(false); setHasRun(false);
    if (imageAction === "crop") { setCropZoom(100); setCropX(0); setCropY(0); setCropAspect("free"); }
    if (!hasProcessor) { setInput(""); return; }
    const mode = fileInputMode(tool.slug);
    if (mode === "name") { setInput(file.name); return; }
    if (mode === "size") { setInput(String(file.size)); return; }
    const reader = new FileReader();
    reader.onload = () => setInput(String(reader.result ?? ""));
    if (mode === "text") reader.readAsText(file);
    else reader.readAsDataURL(file);
  };
  const onDrop = (event: DragEvent<HTMLLabelElement>) => { event.preventDefault(); loadFile(event.dataTransfer.files?.[0]); };
  const run = async () => {
    setHasRun(true);
    if (usesCanvasImage && selectedFile) {
      const fallbackSource = URL.createObjectURL(selectedFile);
      const source = imageSourceForProcessing(input, fallbackSource);
      const revokeFallback = () => URL.revokeObjectURL(fallbackSource);
      const failImageProcessing = () => { revokeFallback(); setImageError(true); toast.error(t("tool.invalid")); };
      const image = new Image();
      image.onload = () => {
        try {
          if (!image.naturalWidth || !image.naturalHeight) throw new Error("Image has no readable dimensions");
          if (imageAction === "crop") {
            const crop = imageCropRect(image.naturalWidth, image.naturalHeight, cropZoom, cropX, cropY, cropAspect);
            const outputSize = boundedCanvasSize(crop.sw, crop.sh);
            const canvas = document.createElement("canvas");
            canvas.width = outputSize.width;
            canvas.height = outputSize.height;
            const context = canvas.getContext("2d");
            if (!context) throw new Error("Canvas is unavailable");
            context.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, outputSize.width, outputSize.height);
            setImageOutput(canvas.toDataURL("image/png"));
            setImageError(false);
            revokeFallback();
            return;
          }
          const scale = imageAction === "resize" ? Math.min(200, Math.max(10, imageScale)) / 100 : 1;
          const logicalSize = boundedCanvasSize(image.naturalWidth * scale, image.naturalHeight * scale);
          const sourceWidth = logicalSize.width;
          const sourceHeight = logicalSize.height;
          const rotation = imageAction === "rotate" ? imageRotation : 0;
          const sideways = rotation === 90 || rotation === 270;
          const canvas = document.createElement("canvas");
          canvas.width = sideways ? sourceHeight : sourceWidth;
          canvas.height = sideways ? sourceWidth : sourceHeight;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas is unavailable");
          context.translate(canvas.width / 2, canvas.height / 2);
          context.rotate((rotation * Math.PI) / 180);
          if (imageAction === "flip") context.scale(flipAxis === "horizontal" ? -1 : 1, flipAxis === "vertical" ? -1 : 1);
          context.drawImage(image, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);
          const outputMime = imageAction === "compress" ? "image/jpeg" : imageAction === "convert" ? imageMime : "image/png";
          setImageOutput(canvas.toDataURL(outputMime, imageAction === "compress" || imageAction === "convert" ? imageQuality / 100 : undefined));
          setImageError(false);
          revokeFallback();
        } catch {
          failImageProcessing();
        }
      };
      image.onerror = failImageProcessing;
      image.src = source;
      return;
    }
    setNonce(value => value + 1);
  };
  const copyOutput = async () => { const value = imageOutput || output; if (!value) return toast.error(t("tool.invalid")); try { await navigator.clipboard.writeText(value); setCopied(true); toast.success(t("tool.copied")); window.setTimeout(() => setCopied(false), 1800); } catch { toast.error(t("tool.copyFailed")); } };
  const downloadOutput = () => { const value = imageOutput || output; if (!value) return toast.error(t("tool.invalid")); const anchor = document.createElement("a"); if (imageOutput) { const mime = imageOutput.match(/^data:([^;]+);/)?.[1] ?? "image/png"; anchor.href = imageOutput; anchor.download = `${tool.slug}.${imageOutputExtension(mime)}`; } else { const href = URL.createObjectURL(new Blob([output], { type: "text/plain" })); anchor.href = href; anchor.download = `${tool.slug}.txt`; window.setTimeout(() => URL.revokeObjectURL(href), 0); } anchor.click(); toast.success(t("tool.downloadText")); };
  const speakText = () => { if (!input.trim() || !("speechSynthesis" in window)) return toast.error(t("tool.invalid")); window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(input)); };
  const displayOutput = !hasRun ? copy.noOutput : usesCanvasImage ? imageOutput ? copy.imageReady : imageError ? copy.noOutput : copy.processing : isFileTool && !hasProcessor ? copy.guided : output || t("tool.invalid");

  return <div className={`site-frame tool-page workspace-${workspace.kind}`} dir={language === "ar" || language === "ur" ? "rtl" : "ltr"}>
    <nav className="crumbs"><Link href="/tools">{t("nav.tools")}</Link><span>/</span><Link href={`/tools?category=${tool.category}`}>{t(`category.${category.id}`)}</Link><span>/</span><strong>{tool.name}</strong></nav>
    <section className="tool-intro"><div><p className="eyebrow">{category.name.toUpperCase()} / {t("tool.private")}</p><h1>{tool.name}</h1><p>{tool.description[language]}</p></div><span className={`category-icon ${category.color}`}><category.icon /></span></section>
    <div className="tool-layout"><section className="tool-workbench">
      <div className="workbench-head"><div><h2>{t("tool.input")}</h2><span><LockKeyhole size={14} /> {t("tool.private")}</span></div><button className="subtle-button" onClick={clear}><RefreshCw size={15} />{t("tool.reset")}</button></div>
      <section className="tool-steps" aria-label={t("tool.how")}><strong><Info size={15} />{t("tool.how")}</strong><ol><li>{isFileTool ? copy.choose : t("tool.input")}</li><li>{t("tool.run")}</li><li>{t("tool.output")}</li></ol></section>
      {isFileTool ? <>
        <label className="file-dropzone" onDragOver={event => event.preventDefault()} onDrop={onDrop}><>{tool.category === "images" ? <FileImage size={30} /> : <FileText size={30} />}</><strong>{copy.choose}</strong><span>{copy.upload}</span><small>{copy.drop} · {spec.type}</small><input type="file" accept={spec.accept} onChange={event => loadFile(event.target.files?.[0])} aria-label={`${copy.choose} ${spec.type}`} /></label>
        {selectedFile && <div className="selected-file"><span><Check size={16} />{copy.ready}: <strong>{selectedFile.name}</strong><small>{Math.max(1, Math.ceil(selectedFile.size / 1024))} KB</small></span><button className="subtle-button" onClick={clear}><X size={15} />{copy.remove}</button></div>}
        {usesCanvasImage && <div className="image-controls">{imageAction === "resize" && <label>{copy.resize} <input type="number" min="10" max="200" value={imageScale} onChange={event => setImageScale(Number(event.target.value) || 100)} />%</label>}{imageAction === "rotate" && <label>{copy.rotate} <select value={imageRotation} onChange={event => setImageRotation(Number(event.target.value))}><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></label>}{imageAction === "flip" && <label>{copy.flip} <select value={flipAxis} onChange={event => setFlipAxis(event.target.value as "horizontal" | "vertical")}><option value="horizontal">{copy.horizontal}</option><option value="vertical">{copy.vertical}</option></select></label>}{imageAction === "convert" && <label>{copy.format} <select value={imageMime} onChange={event => setImageMime(event.target.value as typeof imageMime)}><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select></label>}{imageAction === "compress" && <label>{copy.quality} <input type="range" min="20" max="95" value={imageQuality} onChange={event => setImageQuality(Number(event.target.value))} /> {imageQuality}%</label>}</div>}
        {imageAction === "crop" && selectedFile && input.startsWith("data:image/") && <fieldset className="crop-workspace"><legend>{tool.name}</legend><div className="crop-stage" style={{ aspectRatio: cropAspect === "free" ? undefined : cropAspect }} onPointerDown={event => { cropPointer.current = { id: event.pointerId, clientX: event.clientX, clientY: event.clientY, cropX, cropY }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={event => { const start = cropPointer.current; if (!start || start.id !== event.pointerId) return; const bounds = event.currentTarget.getBoundingClientRect(); setCropX(Math.max(-100, Math.min(100, start.cropX - ((event.clientX - start.clientX) / bounds.width) * 200))); setCropY(Math.max(-100, Math.min(100, start.cropY - ((event.clientY - start.clientY) / bounds.height) * 200))); }} onPointerUp={() => { cropPointer.current = null; }} onPointerCancel={() => { cropPointer.current = null; }}><img src={input} alt="" draggable={false} style={{ transform: `translate(${-cropX / 2}%, ${-cropY / 2}%) scale(${cropZoom / 100})` }} /><span aria-hidden="true" /></div><div className="crop-ratios" role="group" aria-label={tool.name}>{(["free", "1:1", "4:3", "16:9"] as CropAspect[]).map(aspect => <button type="button" key={aspect} className={cropAspect === aspect ? "active" : ""} onClick={() => setCropAspect(aspect)} aria-pressed={cropAspect === aspect}>{aspect === "free" ? "◻" : aspect}</button>)}</div><div className="crop-ranges"><label>{copy.resize}<input type="range" min="100" max="300" value={cropZoom} onChange={event => setCropZoom(Number(event.target.value))} aria-label={copy.resize} /><output>{cropZoom}%</output></label><label>X<input type="range" min="-100" max="100" value={cropX} onChange={event => setCropX(Number(event.target.value))} aria-label="X" /></label><label>Y<input type="range" min="-100" max="100" value={cropY} onChange={event => setCropY(Number(event.target.value))} aria-label="Y" /></label></div></fieldset>}
        <div className={`processor-status ${hasProcessor ? "implemented" : "guided"}`}><Info size={16} />{hasProcessor ? copy.active : copy.guided}</div>
      </> : <>
        {example && <button className="example-chip" type="button" onClick={() => setInput(example)}><Sparkles size={14} />{copy.example}</button>}
        <textarea value={input} onChange={event => { if (!toolInputPrivacyPolicy.shouldPersist()) setInput(event.target.value); }} placeholder={example || t("tool.placeholder")} aria-label={t("tool.input")} inputMode={workspace.inputMode} spellCheck={false} autoComplete="off" data-lpignore="true" />
      </>}
      <div className="workbench-actions"><button className="primary-cta compact" onClick={run} disabled={isFileTool && !selectedFile}>{needsGenerate ? <WandSparkles size={17} /> : <Sparkles size={17} />}{needsGenerate ? t("tool.generate") : t("tool.run")}</button>{tool.slug === "text-to-speech" && <button className="subtle-button" onClick={speakText}><Sparkles size={15} />{t("tool.run")}</button>}</div>
      <div className="output-card"><div className="workbench-head"><div><h2>{t("tool.output")}</h2></div><div className="output-actions"><button className="icon-button" onClick={copyOutput} disabled={!hasRun || !(imageOutput || output)} aria-label={t("common.copy")}>{copied ? <Check size={17} /> : <Clipboard size={17} />}</button><button className="icon-button" onClick={downloadOutput} disabled={!hasRun || !(imageOutput || output)} aria-label={t("tool.downloadText")}><Download size={17} /></button></div></div>{imageOutput && <img className="image-output-preview" src={imageOutput} alt={copy.processedImage} />}<pre className={result.error && hasRun ? "error-output" : ""}>{displayOutput}</pre></div>
      <details className="how-card"><summary>{t("tool.how")}</summary><p>{t("tool.howCopy")}</p><p className="privacy-exceptions">{t("tool.privacyExceptions")}</p></details>
    </section><aside className="tool-aside"><div className="tool-aside-card"><h2>{t("tool.related")}</h2>{related.map(item => <Link href={`/tools/${item.slug}`} key={item.slug}><span>{item.name}</span><span>→</span></Link>)}</div></aside></div>
  </div>;
}
