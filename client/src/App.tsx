import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { tools } from "@/data/catalog";
import { gameBySlug } from "@/data/games";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { SiteShell } from "./components/SiteShell";
import { AppSettingsProvider } from "./contexts/AppSettingsContext";
import "./blog.css";
import "./blog-enhancements.css";
import "./search.css";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import BlogAuthor from "./pages/BlogAuthor";
import AdminBlog from "./pages/AdminBlog";
import AdminConsole from "./pages/AdminConsole";
import AdminLinks from "./pages/AdminLinks";
import AiSuite from "./pages/AiSuite";
import GlobalSearch from "./pages/GlobalSearch";
import GamesArcade, { GamePlayerPage } from "./pages/GamesArcade";
import Home from "./pages/Home";
import UsefulLinksLibrary from "./pages/UsefulLinksLibrary";
import { InfoPage } from "./pages/InfoPage";
import MyData from "./pages/MyData";
import MultiplayerLobby from "./pages/MultiplayerLobby";
import MultiplayerRoom from "./pages/MultiplayerRoom";
import Profile from "./pages/Profile";
import PrivacyPage from "./pages/PrivacyPage";
import { ContactReportPage, LegalPolicyPage } from "./pages/LegalPages";
import Settings from "./pages/Settings";
import ToolPage from "./pages/ToolPage";
import Tools from "./pages/Tools";
import NotFound from "./pages/NotFound";

const defaultDescription = "ToolsHUB — free online tools, browser games and AI tools. No signup needed.";
const linksDescription = "ToolsHUB — 2,100+ curated useful websites, links and research tools.";
const socialCard = "/manus-storage/toolshub-social-card_ac486587.png";
function setMeta(selector: string, value: string) { document.querySelector(selector)?.setAttribute("content", value); }
function DocumentMeta() { const [location] = useLocation(); const tool = location.startsWith("/tools/") ? tools.find((item) => item.slug === location.split("/").at(-1)) : undefined; const game = location.startsWith("/games/") ? gameBySlug(location.split("/").at(-1) ?? "") : undefined; const page = tool?.name ?? game?.name ?? ({ "/": "Welcome", "/tools": "Tools", "/games": "Games", "/ai": "AI Suite", "/links": "Useful Links", "/my-data": "My Data", "/privacy": "Privacy", "/settings": "Settings", "/profile": "Profile", "/blog": "Blog", "/admin": "Admin", "/admin/users": "Admin — Users", "/admin/content": "Admin — Content", "/admin/system": "Admin — System", "/admin/blog": "Admin — Blog", "/admin/links": "Admin — Links" } as Record<string, string>)[location] ?? "Page not found"; const title = `ToolsHUB — ${page}`; const description = location === "/links" ? linksDescription : defaultDescription; useEffect(() => { document.title = title; setMeta('meta[name="description"]', description); setMeta('meta[property="og:title"]', title); setMeta('meta[property="og:description"]', description); setMeta('meta[property="og:image"]', socialCard); setMeta('meta[name="twitter:title"]', title); setMeta('meta[name="twitter:description"]', description); setMeta('meta[name="twitter:image"]', socialCard); }, [title, description]); return null; }
function Router() { return <><DocumentMeta /><SiteShell><Switch><Route path="/" component={Home} /><Route path="/search" component={GlobalSearch} /><Route path="/tools" component={Tools} /><Route path="/tools/:slug" component={ToolPage} /><Route path="/blog" component={Blog} /><Route path="/blog/author/:username" component={BlogAuthor} /><Route path="/blog/:slug" component={BlogArticle} /><Route path="/admin/links" component={AdminLinks} /><Route path="/admin/blog" component={AdminBlog} /><Route path="/admin/users" component={AdminConsole} /><Route path="/admin/content" component={AdminConsole} /><Route path="/admin/system" component={AdminConsole} /><Route path="/admin" component={AdminConsole} /><Route path="/games/lobby" component={MultiplayerLobby} /><Route path="/games/room/:roomToken">{(params) => <MultiplayerRoom roomToken={params.roomToken} />}</Route><Route path="/games/:slug">{(params) => <GamePlayerPage slug={params.slug} />}</Route><Route path="/games" component={GamesArcade} /><Route path="/ai" component={AiSuite} /><Route path="/links" component={UsefulLinksLibrary} /><Route path="/my-data" component={MyData} /><Route path="/privacy" component={PrivacyPage} /><Route path="/privacy-policy"><LegalPolicyPage slug="privacy-policy" /></Route><Route path="/terms"><LegalPolicyPage slug="terms" /></Route><Route path="/acceptable-use"><LegalPolicyPage slug="acceptable-use" /></Route><Route path="/cookies"><LegalPolicyPage slug="cookies" /></Route><Route path="/contact" component={ContactReportPage} /><Route path="/settings" component={Settings} /><Route path="/profile" component={Profile} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></SiteShell></>; }
export default function App() { return <ErrorBoundary><AppSettingsProvider><TooltipProvider><Toaster richColors position="top-right" /><Router /></TooltipProvider></AppSettingsProvider></ErrorBoundary>; }
