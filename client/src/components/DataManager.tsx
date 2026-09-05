/** Cobalt Workshop design reminder: data actions are calm, explicit and locally scoped, with cobalt for safe actions and red reserved for irreversible clearing. */
import { useCallback, useRef, useState } from "react";
import { AlertTriangle, Download, FolderUp, HardDrive, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSettings } from "@/contexts/AppSettingsContext";
import type { TranslationKey } from "@/i18n/translations";
import { applyDataBundle, clearAppData, downloadDataBundle, parseDataBundle, type DataBundle, type ImportMode, type StorageFailure } from "@/lib/storage";

/** Each validation failure gets its own message so the user knows what to fix. */
const FAILURE_KEYS: Record<StorageFailure, TranslationKey> = {
  quota: "data.error.quota",
  unavailable: "data.error.unavailable",
  invalid: "data.error.invalid",
  version: "data.error.version",
  source: "data.error.source",
  shape: "data.error.shape",
  namespace: "data.error.namespace",
  size: "data.error.size",
};

type Status = { tone: "ok" | "error"; message: string };

export function DataManager({ compact = false }: { compact?: boolean }) {
  const { t, refreshFromStorage } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  // The two confirmation dialogs below are controlled rather than opened by a
  // `DialogTrigger`, so Radix has no trigger element to hand focus back to when they
  // close and focus falls to `<body>`. A keyboard user who cancelled a confirmation
  // would lose their place entirely, even though the outer dialog is still open.
  // These point at the buttons that opened each one.
  const importButtonRef = useRef<HTMLButtonElement>(null);
  const clearButtonRef = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState<{ bundle: DataBundle; name: string } | null>(null);
  const [mode, setMode] = useState<ImportMode>("merge");
  const [confirmClear, setConfirmClear] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  /** Sends focus back to the control that opened a confirmation dialog. */
  const restoreFocus = (target: React.RefObject<HTMLButtonElement | null>) => (event: Event) => {
    if (!target.current) return;
    event.preventDefault();
    target.current.focus();
  };

  const fail = useCallback((error: StorageFailure) => setStatus({ tone: "error", message: t(FAILURE_KEYS[error]) }), [t]);

  const download = () => {
    const result = downloadDataBundle();
    if (!result.ok) return fail(result.error);
    if (result.value === 0) return setStatus({ tone: "error", message: t("data.empty") });
    setStatus({ tone: "ok", message: t("data.downloaded", { count: result.value }) });
  };

  const readImport = async (file: File | undefined) => {
    // Reset the input so re-picking the same file fires `change` again.
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    let text: string;
    try {
      text = await file.text();
    } catch {
      setStatus({ tone: "error", message: t("data.error.read") });
      return;
    }
    const parsed = parseDataBundle(text);
    if (!parsed.ok) return fail(parsed.error);
    setMode("merge");
    setStatus(null);
    setPending({ bundle: parsed.value, name: file.name });
  };

  const commitImport = () => {
    if (!pending) return;
    const result = applyDataBundle(pending.bundle, mode);
    setPending(null);
    if (!result.ok) return fail(result.error);
    const { imported, removed, unchanged } = result.value;
    // Settings live in React state as well as storage, so re-read them now rather
    // than telling the user to reload the page.
    refreshFromStorage();
    setStatus({ tone: "ok", message: mode === "replace" ? t("data.report.replace", { imported, removed }) : t("data.report.merge", { imported, unchanged }) });
  };

  const commitClear = () => {
    const result = clearAppData();
    setConfirmClear(false);
    if (!result.ok) return fail(result.error);
    refreshFromStorage();
    setStatus({ tone: "ok", message: t("data.cleared", { count: result.value }) });
  };

  return (
    <>
      <Dialog onOpenChange={(open) => !open && setStatus(null)}>
        <DialogTrigger asChild>
          <Button variant={compact ? "ghost" : "outline"} className={compact ? "data-trigger-compact" : "data-trigger"}>
            <HardDrive className="mr-2 size-4" aria-hidden="true" />
            {t("data.title")}
          </Button>
        </DialogTrigger>
        <DialogContent className="data-dialog">
          <div className="data-dialog-head">
            <DialogHeader>
              <div className="data-dialog-mark" aria-hidden="true">
                <ShieldCheck className="size-5" />
              </div>
              <DialogTitle className="data-dialog-title">{t("data.title")}</DialogTitle>
              <DialogDescription className="data-dialog-copy">{t("data.intro")}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="data-dialog-body">
            <section className="data-action-card">
              <div>
                <h3>{t("data.download.title")}</h3>
                <p>{t("data.download.description")}</p>
              </div>
              <Button onClick={download}>
                <Download className="mr-2 size-4" aria-hidden="true" />
                {t("data.download.action")}
              </Button>
            </section>
            <section className="data-action-card">
              <div>
                <h3>{t("data.import.title")}</h3>
                <p>{t("data.import.description")}</p>
              </div>
              <Button ref={importButtonRef} variant="outline" onClick={() => fileRef.current?.click()}>
                <FolderUp className="mr-2 size-4" aria-hidden="true" />
                {t("data.import.action")}
              </Button>
              <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" aria-label={t("data.import.title")} onChange={(event) => void readImport(event.target.files?.[0])} />
            </section>
            <section className="data-action-card data-action-danger">
              <div>
                <h3>{t("data.clear.title")}</h3>
                <p>{t("data.clear.description")}</p>
              </div>
              <Button ref={clearButtonRef} variant="destructive" onClick={() => setConfirmClear(true)}>
                <Trash2 className="mr-2 size-4" aria-hidden="true" />
                {t("data.clear.action")}
              </Button>
            </section>
            {/* One live region, always mounted, so a screen reader announces every result. */}
            <p className={status ? (status.tone === "error" ? "data-status data-status-error" : "data-status") : "sr-only"} role="status" aria-live="polite">
              {status?.message ?? ""}
            </p>
          </div>
          <DialogFooter className="data-dialog-foot">
            <p className="data-dialog-note">
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              {t("data.warning")}
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sibling dialogs, not nested: a Dialog inside a DialogContent unmounts with its parent. */}
      <Dialog open={Boolean(pending)} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent className="data-confirm" onCloseAutoFocus={restoreFocus(importButtonRef)}>
          <DialogHeader>
            <DialogTitle>{t("data.restore.title")}</DialogTitle>
            <DialogDescription>{t("data.restore.description")}</DialogDescription>
          </DialogHeader>
          {pending && <p className="data-confirm-file">{t("data.selected", { name: pending.name })}</p>}
          <fieldset className="data-mode">
            <legend>{t("data.mode.label")}</legend>
            {(["merge", "replace"] as const).map((value) => (
              <label key={value} className={mode === value ? "data-mode-option active" : "data-mode-option"}>
                <input type="radio" name="import-mode" value={value} checked={mode === value} onChange={() => setMode(value)} />
                <span>
                  <strong>{t(value === "merge" ? "data.mode.merge" : "data.mode.replace")}</strong>
                  <small>{t(value === "merge" ? "data.mode.merge.description" : "data.mode.replace.description")}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              {t("data.cancel")}
            </Button>
            <Button variant={mode === "replace" ? "destructive" : "default"} onClick={commitImport}>
              {t(mode === "replace" ? "data.restore.replaceAction" : "data.restore.mergeAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Replaces the old three-press button: one explicit, readable confirmation. */}
      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent className="data-confirm" onCloseAutoFocus={restoreFocus(clearButtonRef)}>
          <DialogHeader>
            <DialogTitle>{t("data.clear.confirmTitle")}</DialogTitle>
            <DialogDescription>{t("data.clear.confirmCopy")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClear(false)}>
              {t("data.cancel")}
            </Button>
            <Button variant="destructive" onClick={commitClear}>
              <Trash2 className="mr-2 size-4" aria-hidden="true" />
              {t("data.clear.confirmAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
