import { DatabaseZap, Network, ShieldCheck } from "lucide-react";
import { useSettings } from "@/contexts/AppSettingsContext";

export default function PrivacyPage() {
  const { t } = useSettings();
  const sections = [
    { icon: Network, title: t("privacy.relayTitle"), copy: t("privacy.relayCopy") },
    { icon: DatabaseZap, title: t("privacy.dataTitle"), copy: t("privacy.dataCopy") },
    { icon: ShieldCheck, title: t("privacy.controlTitle"), copy: t("privacy.controlCopy") },
  ];

  return (
    <main className="site-frame listing-page py-10 sm:py-14">
      <header className="page-intro max-w-3xl">
        <span className="eyebrow">ToolsHUB</span>
        <h1>{t("footer.privacyTitle")}</h1>
        <p>{t("privacy.intro")}</p>
      </header>

      <div className="privacy-badge mb-7 w-fit">{t("privacy.badge")}</div>

      <section aria-label={t("footer.privacyTitle")} className="grid gap-4 md:grid-cols-3">
        {sections.map(({ icon: Icon, title, copy }) => (
          <article key={title} className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
            <span className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon aria-hidden="true" size={22} /></span>
            <h2 className="mb-2 text-lg font-semibold">{title}</h2>
            <p className="text-sm leading-6 text-muted-foreground">{copy}</p>
          </article>
        ))}
      </section>

      <aside className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm leading-6 text-foreground">
        <strong className="block text-base">ToolsHUB</strong>
        {t("privacy.note")}
      </aside>
    </main>
  );
}
