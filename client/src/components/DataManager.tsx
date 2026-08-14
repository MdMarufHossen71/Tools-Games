/** Cobalt Workshop design reminder: data actions are calm, explicit and locally scoped, with cobalt for safe actions and red reserved for irreversible clearing. */
import { useRef, useState } from "react";
import { AlertTriangle, Download, FolderUp, HardDrive, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSettings } from "@/contexts/AppSettingsContext";
import { clearAllLocalData, downloadDataBundle, mergeDataBundle, parseDataBundle, type DataBundle } from "@/lib/storage";

export function DataManager({ compact = false }: { compact?: boolean }) {
  const { t } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<DataBundle | null>(null);
  const [clearStage, setClearStage] = useState<0 | 1 | 2>(0);
  const [status, setStatus] = useState("");

  const readImport = async (file: File | undefined) => {
    if (!file) return;
    const parsed = parseDataBundle(await file.text());
    if (!parsed.ok) { setStatus(t("data.invalid")); return; }
    setPendingImport(parsed.value);
  };
  const commitImport = () => {
    if (!pendingImport) return;
    const result = mergeDataBundle(pendingImport);
    setPendingImport(null);
    setStatus(result.ok ? t("data.imported", { count: result.value }) : t("data.importFailed"));
  };
  const clearData = () => {
    if (clearStage === 0) return setClearStage(1);
    if (clearStage === 1) return setClearStage(2);
    const cleared = clearAllLocalData();
    setClearStage(0);
    setStatus(cleared ? t("data.cleared") : t("data.clearFailed"));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={compact ? "ghost" : "outline"} className={compact ? "h-auto p-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground" : "border-primary/20 bg-primary/[.04] text-primary hover:bg-primary/10"}>
          <HardDrive className="mr-2 size-4" />{t("data.title")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl border-border/70 bg-background p-0 shadow-2xl">
        <div className="border-b border-border bg-[radial-gradient(circle_at_top_right,rgba(50,100,255,.14),transparent_48%)] px-6 py-5">
          <DialogHeader>
            <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><ShieldCheck className="size-5" /></div>
            <DialogTitle className="font-display text-2xl">{t("data.title")}</DialogTitle>
            <DialogDescription className="max-w-md leading-6">{t("data.intro")}</DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-3 px-6 py-5">
          <section className="data-action-card">
            <div><h3>{t("data.download.title")}</h3><p>{t("data.download.description")}</p></div>
            <Button onClick={downloadDataBundle}><Download className="mr-2 size-4" />{t("data.download.action")}</Button>
          </section>
          <section className="data-action-card">
            <div><h3>{t("data.import.title")}</h3><p>{t("data.import.description")}</p></div>
            <Button variant="outline" onClick={() => fileRef.current?.click()}><FolderUp className="mr-2 size-4" />{t("data.import.action")}</Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => readImport(event.target.files?.[0])} />
          </section>
          <section className="data-action-card data-action-danger">
            <div><h3>{t("data.clear.title")}</h3><p>{t("data.clear.description")}</p></div>
            <Button variant="destructive" onClick={clearData}><Trash2 className="mr-2 size-4" />{clearStage === 0 ? t("data.clear.action") : clearStage === 1 ? t("data.clear.again") : t("data.clear.final")}</Button>
          </section>
          {status && <p role="status" className="rounded-xl border border-primary/15 bg-primary/[.05] px-3 py-2 text-sm leading-5 text-foreground">{status}</p>}
        </div>
        <DialogFooter className="border-t border-border px-6 py-4 text-left sm:justify-start"><p className="flex items-center gap-2 text-xs text-muted-foreground"><AlertTriangle className="size-3.5" />{t("data.warning")}</p></DialogFooter>
      </DialogContent>
      <Dialog open={Boolean(pendingImport)} onOpenChange={(open) => !open && setPendingImport(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{t("data.restore.title")}</DialogTitle><DialogDescription>{t("data.restore.description")}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setPendingImport(null)}>{t("data.cancel")}</Button><Button onClick={commitImport}>{t("data.restore.action")}</Button></DialogFooter></DialogContent>
      </Dialog>
    </Dialog>
  );
}
