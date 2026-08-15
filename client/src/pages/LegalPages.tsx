import { Link, useLocation } from "wouter";
import { CheckCircle2, FileText, Flag, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { legalPolicyBySlug } from "@/lib/legalContent";
import { trpc } from "@/lib/trpc";

const legalLinks = [
  ["Privacy Policy", "/privacy-policy"],
  ["Terms of Use", "/terms"],
  ["Acceptable Use", "/acceptable-use"],
  ["Cookies & Local Storage", "/cookies"],
  ["Contact & Report", "/contact"],
] as const;

export function LegalPolicyPage({ slug }: { slug: "privacy-policy" | "terms" | "acceptable-use" | "cookies" }) {
  const policy = legalPolicyBySlug(slug);
  if (!policy) return null;
  return <main className="site-frame listing-page py-10 sm:py-14" lang="en">
    <header className="page-intro max-w-3xl"><span className="eyebrow">TOOLS HUB / LEGAL</span><h1>{policy.title}</h1><p>{policy.summary}</p><p className="mt-3 text-xs text-muted-foreground">Last updated: 15 August 2026. This legal notice is currently provided in English for precision.</p></header>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <article className="rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-8">
        {policy.sections.map((section) => <section key={section.heading} className="border-b border-border/70 py-6 first:pt-0 last:border-0 last:pb-0"><h2 className="mb-3 text-xl font-semibold tracking-tight">{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className="mb-3 text-sm leading-7 text-muted-foreground">{paragraph}</p>)}{section.bullets && <ul className="space-y-2 text-sm leading-6 text-muted-foreground">{section.bullets.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0 text-primary" size={16} aria-hidden="true" />{item}</li>)}</ul>}</section>)}
      </article>
      <aside className="h-fit rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm"><div className="mb-4 flex items-center gap-2 font-semibold"><ShieldCheck className="text-primary" size={18} />Policy centre</div><nav aria-label="Legal pages" className="space-y-1">{legalLinks.map(([label, href]) => <Link key={href} href={href} className="block rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground">{label}</Link>)}</nav></aside>
    </div>
  </main>;
}

export function ContactReportPage() {
  const [, setLocation] = useLocation();
  const [kind, setKind] = useState<"support" | "bug" | "abuse" | "privacy">("support");
  const [subject, setSubject] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const submit = trpc.support.submit.useMutation({ onSuccess: () => { toast.success("Your report was received. Thank you."); setSubject(""); setEmail(""); setMessage(""); }, onError: (error) => toast.error(error.message) });
  const onSubmit = (event: React.FormEvent) => { event.preventDefault(); submit.mutate({ kind, subject, email: email || null, message, pageUrl: window.location.pathname }); };
  return <main className="site-frame listing-page py-10 sm:py-14" lang="en">
    <header className="page-intro max-w-3xl"><span className="eyebrow">TOOLS HUB / CONTACT</span><h1>Contact & Report</h1><p>Report a technical issue, misuse, privacy concern, or question about ToolsHUB. Do not include passwords, government ID numbers, payment details, or other secrets.</p></header>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"><form onSubmit={onSubmit} className="rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-8"><div className="mb-5 flex items-start gap-3 rounded-2xl bg-primary/5 p-4 text-sm leading-6 text-muted-foreground"><Flag className="mt-0.5 shrink-0 text-primary" size={18} /><p>Reports are stored encrypted at rest for review. Please share only the minimum information needed to explain the issue.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Report type<select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)} className="h-11 rounded-xl border border-input bg-background px-3 text-sm"><option value="support">Question or support</option><option value="bug">Bug or broken feature</option><option value="abuse">Safety or abuse report</option><option value="privacy">Privacy request</option></select></label><label className="grid gap-2 text-sm font-medium">Email (optional)<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" maxLength={320} placeholder="name@example.com" className="h-11 rounded-xl border border-input bg-background px-3 text-sm" /></label></div><label className="mt-4 grid gap-2 text-sm font-medium">Subject<input required value={subject} onChange={(event) => setSubject(event.target.value)} minLength={4} maxLength={180} placeholder="Briefly describe the issue" className="h-11 rounded-xl border border-input bg-background px-3 text-sm" /></label><label className="mt-4 grid gap-2 text-sm font-medium">Message<textarea required value={message} onChange={(event) => setMessage(event.target.value)} minLength={12} maxLength={4000} rows={7} placeholder="What happened? Which page or tool did you use?" className="resize-y rounded-xl border border-input bg-background p-3 text-sm" /></label><button disabled={submit.isPending} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"><Mail size={17} />{submit.isPending ? "Sending…" : "Send report"}</button></form><aside className="h-fit rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm"><div className="mb-3 flex items-center gap-2 font-semibold"><FileText className="text-primary" size={18} />Before you send</div><ul className="space-y-3 text-sm leading-6 text-muted-foreground"><li>For a bug, include the tool name and a short sequence of steps.</li><li>For a privacy request, identify the account only if necessary.</li><li>For urgent personal safety or emergency help, contact local emergency services—not ToolsHUB.</li></ul><button type="button" onClick={() => setLocation("/privacy-policy")} className="mt-5 text-sm font-semibold text-primary hover:underline">Read the Privacy Policy</button></aside></div>
  </main>;
}
