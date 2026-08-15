import { gameBySlug, games, type GameCategory } from "@/data/games";
import { useSettings } from "@/contexts/AppSettingsContext";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Gamepad2, GamepadIcon, Play, Puzzle, Search, Trophy, Type, Users, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { PlayableGame } from "./PlayableGame";
import "../games.css";
import "../games-fixes.css";
import "../games-status.css";

const categoryIcons: Record<GameCategory, typeof Puzzle> = { puzzle: Puzzle, arcade: Zap, words: Type, casual: GamepadIcon, multiplayer: Users };
const categoryKeys: Record<GameCategory, "game.puzzle" | "game.arcade" | "game.words" | "games.casual" | "games.multiplayer"> = { puzzle: "game.puzzle", arcade: "game.arcade", words: "game.words", casual: "games.casual", multiplayer: "games.multiplayer" };

export default function GamesArcade() {
  const { t, language } = useSettings();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<GameCategory | "all">("all");
  const dailyChallenge = trpc.games.dailyChallenge.useQuery();
  const dailyLeaderboard = trpc.games.dailyLeaderboard.useQuery();
  const challengeSlug = dailyChallenge.data?.gameSlug ?? "wordle";
  const challengeGame = gameBySlug(challengeSlug);
  const results = useMemo(() => games.filter((game) => game.playable && (category === "all" || game.category === category) && `${game.name} ${game.description[language]}`.toLowerCase().includes(query.toLowerCase())), [category, language, query]);
  return <main className="site-frame games-page">
    <section className="games-hero">
      <div><p className="eyebrow">ToolsHUB / {games.length} GAMES</p><h1>{t("games.title")}</h1><p>{t("games.heroCopy")}</p></div>
      <div className="games-hero-art" aria-hidden="true"><span>＋</span><span>◈</span><span>↗</span><span>◎</span></div>
    </section>
    <section className="games-toolbar" aria-label={t("games.menu")}>
      <label className="games-search"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search.placeholder")} aria-label={t("search.placeholder")} /></label>
      <div className="game-filter-list" role="tablist" aria-label={t("games.menu")}>
        <button type="button" role="tab" aria-selected={category === "all"} className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>{t("games.all")}</button>
        {(Object.keys(categoryKeys) as GameCategory[]).map((item) => { const Icon = categoryIcons[item]; return <button type="button" role="tab" aria-selected={category === item} key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}><Icon size={14}/>{t(categoryKeys[item])}</button>; })}
      </div>
    </section>
    <section className="daily-challenge-card" aria-label={t("games.daily")}>
      <div className="daily-challenge-copy"><p className="eyebrow"><Trophy size={14}/>{t("games.daily")}</p><h2>{challengeGame?.name ?? challengeSlug}</h2><p>{dailyChallenge.data?.dateKey}</p></div>
      <div className="daily-standings" aria-label={t("games.leaderboard")}>{dailyLeaderboard.data?.entries.slice(0, 3).map((entry) => <span key={entry.userId}><b>#{entry.rank}</b>{entry.score.toLocaleString()}</span>) ?? <span>—</span>}</div>
      <Link className="game-play-link" href={`/games/${challengeSlug}`}><Play size={15} fill="currentColor"/>{t("games.play")}</Link>
    </section>
    <section className="games-results" aria-live="polite"><span>{results.length} {t("games.available")}</span><span className="games-release-note">Every game below is ready to play in your browser.</span><Link className="daily-pill" href={`/games/${challengeSlug}`}><Trophy size={15}/>{t("games.daily")}</Link><Link className="daily-pill" href="/games/lobby"><Users size={15}/>{t("games.multiplayer")}</Link></section>
    <section className="game-card-grid">{results.map((game) => { const Icon = categoryIcons[game.category]; return <article className="game-card" key={game.slug}>
      <div className={`game-card-art ${game.category}`}><Icon size={30}/><span>{game.name.slice(0, 2).toUpperCase()}</span></div>
      <div className="game-card-body"><div className="game-card-meta"><span>{t(categoryKeys[game.category])}</span>{game.multiplayer && <span className="multiplayer-dot"><Users size={12}/>{t("games.online")}</span>}</div><h2>{game.name}</h2><p>{game.description[language]}</p>
      <Link href={`/games/${game.slug}`} className="game-play-link"><Play size={15} fill="currentColor"/>{t("games.play")}</Link></div>
    </article>; })}</section>
    {!results.length && <div className="games-empty"><Gamepad2 size={32}/><p>{t("games.empty")}</p></div>}
  </main>;
}

export function GamePlayerPage({ slug }: { slug: string }) {
  const { t, language } = useSettings(); const [, navigate] = useLocation(); const game = gameBySlug(slug);
  if (!game || !game.playable) return <main className="site-frame games-player-error"><Link href="/games"><ArrowLeft size={16}/>{t("common.back")}</Link><h1>{game?.name ?? t("games.notFound")}</h1><p>{game ? t("common.soon") : t("games.choose")}</p></main>;
  return <main className="site-frame game-player-page"><Link href="/games" className="game-back"><ArrowLeft size={16}/>{t("games.title")}</Link><section className="game-player-head"><div><p className="eyebrow">TOOLS HUB / PLAY</p><h1>{game.name}</h1><p>{game.description[language]}</p></div>{game.multiplayer && <Link href={`/games/lobby?game=${game.slug}`} className="game-lobby-link"><Users size={16}/>{t("games.multiplayer")}</Link>}</section><PlayableGame slug={game.slug}/></main>;
}
