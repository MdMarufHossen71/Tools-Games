/** Cobalt Workshop design reminder: navigation resembles a responsive workbench rail—dense enough for utility, calm enough for everyday use. */
import { FormEvent, useEffect, useRef, useState } from "react";
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
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawerInput = useRef<HTMLInputElement>(null);
  const onSearch = (event: FormEvent) => { event.preventDefault(); setLocation(`/tools?search=${encodeURIComponent(query)}`); setOpen(false); };
  const isActive = (href: string) => location.startsWith(href);

  // The drawer is a disclosure rather than a modal, so focus moves into it on open
  // and back to the trigger on close, but it is not trapped: the rest of the header
  // stays reachable, which is what a sighted user sees too.
  useEffect(() => { if (open) drawerInput.current?.focus(); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); menuButton.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  // A route change closes the drawer, otherwise it stays open over the new page.
  useEffect(() => { setOpen(false); }, [location]);

  return <div className="min-h-screen bg-background text-foreground">
    {/* First focusable element on the page, visible only once focused. */}
    <a href="#main-content" className="skip-link">{t("a11y.skip")}</a>
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label={t("a11y.home")}><span className="brand-mark" aria-hidden="true" /><span aria-hidden="true">TOOLS<span className="text-primary">HUB</span><small>BANGLADESH</small></span></Link>
        <form onSubmit={onSearch} className="header-search" role="search"><Search className="size-4" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search.placeholder")} aria-label={t("search.aria")} /></form>
        <nav className="nav-links" aria-label={t("a11y.mainNav")}>{navItems.map(({ href, label }) => <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined}>{t(label)}</Link>)}</nav>
        <div className="header-actions">
          <Button variant="ghost" size="icon" className="header-icon" onClick={toggleTheme} aria-label={t("theme.toggle")}>{theme === "dark" ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}</Button>
          <Button variant="ghost" size="sm" className="header-icon language-toggle" onClick={() => setLanguage(language === "bn" ? "en" : "bn")} aria-label={t("a11y.switchLanguage")} lang={language === "bn" ? "en" : "bn"}>{t("language.switch")}</Button>
          <Button ref={menuButton} variant="ghost" size="icon" className="header-icon mobile-menu-button" onClick={() => setOpen(!open)} aria-label={open ? t("a11y.closeMenu") : t("a11y.openMenu")} aria-expanded={open} aria-controls="site-drawer">{open ? <X className="size-4" aria-hidden="true" /> : <Menu className="size-4" aria-hidden="true" />}</Button>
        </div>
      </div>
      {open && <div className="mobile-drawer" id="site-drawer">
        <form onSubmit={onSearch} className="header-search" role="search"><Search className="size-4" aria-hidden="true" /><input ref={drawerInput} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search.placeholder")} aria-label={t("a11y.searchDrawer")} /></form>
        <nav aria-label={t("a11y.drawerNav")}>{navItems.map(({ href, label }) => <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined}>{t(label)}</Link>)}<Link href="/settings">{t("footer.settings")}</Link></nav>
      </div>}
    </header>
    <main id="main-content">{children}</main>
    <footer className="site-footer">
      <div className="site-frame footer-grid">
        <div className="footer-brand"><div className="brand"><span className="brand-mark" aria-hidden="true" /><span aria-hidden="true">TOOLS<span className="text-primary">HUB</span><small>BD</small></span></div><p>{t("footer.privacy")}</p><p>{t("footer.open")}</p></div>
        {/* The footer columns are top-level sections of the footer landmark, so their
            headings are h2. They were h3, which skipped a level on every page whose
            main content has no h2 of its own — an info page or a tool page goes
            straight from its h1 to the footer heading in document order. */}
        <nav className="footer-column" aria-labelledby="footer-browse"><h2 id="footer-browse">{t("footer.browse")}</h2><Link href="/tools">{t("footer.allTools")}</Link><Link href="/games">{t("footer.games")}</Link><Link href="/links">{t("footer.links")}</Link></nav>
        <nav className="footer-column" aria-labelledby="footer-settings"><h2 id="footer-settings">{t("footer.settings")}</h2><Link href="/settings">{t("footer.settings")}</Link><Link href="/privacy">{t("footer.privacyLink")}</Link><Link href="/how-to">{t("footer.howTo")}</Link></nav>
      </div>
      <div className="site-frame footer-bottom"><span>{t("footer.copyright", { year: new Date().getFullYear() })}</span><span>{t("footer.open")}</span></div>
    </footer>
  </div>;
}
