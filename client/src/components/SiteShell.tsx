import { type FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpenText, Boxes, ChevronDown, Check, Gamepad2, Globe2, Megaphone, Menu, MoonStar, Search, Sparkles, SunMedium, UserRound, Wrench, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useSettings } from "@/contexts/AppSettingsContext";
import { getLocaleOption, localeOptions } from "@/i18n";
import { trpc } from "@/lib/trpc";
import PlayfulEffects from "@/components/PlayfulEffects";

const nav = [
  { href: "/tools", key: "nav.tools" as const, icon: Wrench }, { href: "/games", key: "nav.games" as const, icon: Gamepad2 },
  { href: "/ai", key: "nav.ai" as const, icon: Sparkles }, { href: "/blog", key: "nav.blog" as const, icon: BookOpenText },
  { href: "/links", key: "nav.links" as const, icon: Globe2 }, { href: "/my-data", key: "nav.data" as const, icon: UserRound },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, appearance, setAppearance, theme, t } = useSettings();
  const { isAuthenticated, user } = useAuth();
  const platformConfig = trpc.platform.config.useQuery();
  const [location, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentLocale = getLocaleOption(language);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") { event.preventDefault(); inputRef.current?.focus(); }
      if (event.key === "Escape") { setMenuOpen(false); setLanguageOpen(false); }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);

  const search = (event: FormEvent) => { event.preventDefault(); setLocation(`/search?q=${encodeURIComponent(query)}`); setMenuOpen(false); };
  const toggleTheme = () => setAppearance(theme.isDark || appearance === "dark" ? "light" : "dark");
  const openMobileSearch = () => { setMenuOpen(true); window.setTimeout(() => inputRef.current?.focus(), 0); };
  const announcement = platformConfig.data?.announcement;

  return <div className="site-shell"><PlayfulEffects /><header className="topbar"><div className="topbar-inner">
    <Link href="/" className="brand" aria-label="ToolsHUB"><span className="brand-symbol"><Boxes size={20} strokeWidth={2.2} /></span><span>Tools<span>HUB</span><small>{t("brand.tagline")}</small></span></Link>
    <form onSubmit={search} className="global-search"><Search size={17} /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search.placeholder")} aria-label={t("search.placeholder")} /><kbd>/</kbd></form>
    <nav className="desktop-nav" aria-label={t("nav.tools")}>{nav.map(({ href, key }) => <Link key={href} href={href} className={`${location.startsWith(href) ? "active " : ""}${href === "/links" ? "library-nav" : ""}`}><span>{t(key)}</span>{href === "/links" && <b>2,173</b>}</Link>)}</nav>
    <div className="top-actions">
      <button className="mobile-search-button icon-button" onClick={openMobileSearch} aria-label={t("search.placeholder")}><Search size={18} /></button>
      <button className="icon-button" onClick={toggleTheme} aria-label={t("settings.theme")}>{theme.isDark ? <SunMedium size={18} /> : <MoonStar size={18} />}</button>
      <div className="language-menu"><button className="language-pill" onClick={() => setLanguageOpen((open) => !open)} aria-expanded={languageOpen} aria-label={t("language.label")}><span>{currentLocale.flag}</span><span className="language-code">{currentLocale.nativeName}</span><ChevronDown size={14} /></button>{languageOpen && <div className="language-dropdown" role="menu" aria-label={t("language.label")}>{localeOptions.map((option) => <button key={option.code} onClick={() => { setLanguage(option.code); setLanguageOpen(false); }} className={language === option.code ? "active" : ""} role="menuitem"><span>{option.flag}</span><span>{option.nativeName}</span>{language === option.code && <Check size={15} />}</button>)}<p>{t("language.more")}</p></div>}</div>
      {isAuthenticated ? <Link href="/profile" className="avatar-button" aria-label={t("nav.profile")}>{user?.name?.slice(0, 1).toUpperCase() ?? "U"}</Link> : <button className="signin-button" onClick={() => startLogin()}>{t("auth.signin")}</button>}
      <button className="menu-button icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close navigation" : t("nav.settings")} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
    </div>
  </div>{menuOpen && <div className="mobile-menu"><form onSubmit={search} className="global-search"><Search size={17} /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search.placeholder")} aria-label={t("search.placeholder")} /></form>{nav.map(({ href, key, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={href === "/links" ? "mobile-library-link" : undefined}><Icon size={18} /><span>{t(key)}</span>{href === "/links" && <b>2,173</b>}</Link>)}<Link href="/settings" onClick={() => setMenuOpen(false)}><MoonStar size={18} />{t("nav.settings")}</Link></div>}</header>
  {announcement && <div className="upgrade-strip" role="status"><div><Megaphone size={16} />{announcement.message}</div></div>}{!isAuthenticated && <div className="upgrade-strip"><div><Sparkles size={16} />{t("auth.upgrade")}</div><button onClick={() => startLogin()}>{t("auth.signin")} →</button></div>}
  <main>{children}</main><footer className="footer"><div className="footer-grid"><div><Link href="/" className="brand footer-brand"><span className="brand-symbol"><Boxes size={20} strokeWidth={2.2} /></span><span>Tools<span>HUB</span><small>{t("brand.tagline")}</small></span></Link><p>{t("footer.privacy")}</p><p className="footer-credit">{t("footer.credit")}</p></div><div><h3>{t("footer.explore")}</h3><Link href="/tools">{t("nav.tools")}</Link><Link href="/games">{t("nav.games")}</Link><Link href="/ai">{t("nav.ai")}</Link><Link href="/blog">{t("nav.blog")}</Link><Link href="/links">{t("nav.links")} · 2,173</Link></div><div><h3>{t("footer.account")}</h3><Link href="/profile">{t("nav.profile")}</Link><Link href="/my-data">{t("nav.data")}</Link><Link href="/settings">{t("nav.settings")}</Link></div><div><h3>{t("footer.privacyTitle")}</h3><Link href="/privacy-policy">Privacy policy</Link><Link href="/terms">Terms of use</Link><Link href="/acceptable-use">Acceptable use</Link><Link href="/cookies">Cookies & local storage</Link><Link href="/contact">Contact & report</Link></div></div><div className="footer-bottom"><span>{t("footer.credit")}</span><span>{t("footer.updated")} · 15 Aug 2026</span></div></footer></div>;
}
