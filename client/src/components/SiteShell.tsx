/** Cobalt Workshop design reminder: navigation resembles a responsive workbench rail—dense enough for utility, calm enough for everyday use. */
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { Gamepad2, Languages, Menu, Moon, Search, Sun, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/AppSettingsContext";

const navItems = [
  { href: "/tools", label: "nav.tools" as const, icon: Wrench },
  { href: "/games", label: "nav.games" as const, icon: Gamepad2 },
  { href: "/ai", label: "nav.ai" as const, icon: SparklesPlaceholder },
  { href: "/links", label: "nav.links" as const, icon: Languages },
];
function SparklesPlaceholder({ className }: { className?: string }) { return <span className={className}>✦</span>; }

export function SiteShell({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, theme, toggleTheme, t } = useSettings();
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const onSearch = (event: FormEvent) => { event.preventDefault(); setLocation(`/tools?search=${encodeURIComponent(query)}`); setOpen(false); };
  const isActive = (href: string) => location.startsWith(href);
  return <div className="min-h-screen bg-background text-foreground">
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Tools & Games BD home"><span className="brand-mark" aria-hidden="true" /><span>TOOLS<span className="text-primary">&</span>GAMES<small>BANGLADESH</small></span></Link>
        <form onSubmit={onSearch} className="header-search"><Search className="size-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search.placeholder")} aria-label={t("search.aria")} /></form>
        <nav className="nav-links" aria-label="Main navigation">{navItems.map(({ href, label }) => <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined}>{t(label)}</Link>)}</nav>
        <div className="header-actions"><Button variant="ghost" size="icon" className="header-icon" onClick={toggleTheme} aria-label={t("theme.toggle")}>{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button><Button variant="ghost" size="sm" className="header-icon language-toggle" onClick={() => setLanguage(language === "bn" ? "en" : "bn")}>{t("language.switch")}</Button><Button variant="ghost" size="icon" className="header-icon mobile-menu-button" onClick={() => setOpen(!open)} aria-label="Open menu">{open ? <X className="size-4" /> : <Menu className="size-4" />}</Button></div>
      </div>
      {open && <div className="mobile-drawer"><form onSubmit={onSearch} className="header-search"><Search className="size-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search.placeholder")} /></form><div>{navItems.map(({ href, label }) => <Link key={href} href={href} onClick={() => setOpen(false)}>{t(label)}</Link>)}<Link href="/settings" onClick={() => setOpen(false)}>{t("footer.settings")}</Link></div></div>}
    </header>
    <main>{children}</main>
    <footer className="site-footer"><div className="site-frame footer-grid"><div className="footer-brand"><div className="brand"><span className="brand-mark" /><span>TOOLS<span className="text-primary">&</span>GAMES<small>BD</small></span></div><p>{t("footer.privacy")}</p><p>{t("footer.open")}</p></div><div className="footer-column"><h3>{t("footer.browse")}</h3><Link href="/tools">{t("footer.allTools")}</Link><Link href="/games">{t("footer.games")}</Link><Link href="/links">{t("footer.links")}</Link></div><div className="footer-column"><h3>{t("footer.settings")}</h3><Link href="/settings">{t("footer.settings")}</Link><Link href="/privacy">{t("footer.privacyLink")}</Link><Link href="/how-to">{t("footer.howTo")}</Link></div></div><div className="site-frame footer-bottom"><span>© 2026 Tools & Games BD</span><span>{t("footer.open")}</span></div></footer>
  </div>;
}
