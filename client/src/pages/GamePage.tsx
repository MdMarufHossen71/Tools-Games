/** Cobalt Workshop design reminder: each compact game session is a tactile local cartridge—score, level and progress persist without a leaderboard server. */
import { ArrowLeft, Gamepad2, RotateCcw, Trophy } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { findGame } from "@/data/games";
import { useGamePersistence } from "@/hooks/useGamePersistence";
import { useTranslation } from "@/contexts/AppSettingsContext";
import NotFound from "@/pages/NotFound";

export default function GamePage() {
  const [, params] = useRoute("/games/:slug");
  const game = findGame(params?.slug ?? "");
  const { t, language } = useTranslation();
  const progress = useGamePersistence(game?.slug ?? "unknown");
  if (!game) return <NotFound />;
  const Icon = game.icon;
  const play = () => {
    const points = Math.max(10, Math.floor(Math.random() * 125));
    const next = progress.save.score + points;
    progress.update({ score: next, highScore: Math.max(progress.save.highScore, next), level: Math.floor(next / 300) + 1, resources: progress.save.resources + 1 });
  };
  return <div className="site-frame page-space"><Link href="/games" className="back-link"><ArrowLeft className="size-4" />{t("game.exit")}</Link><section className="game-arena"><div className="game-arena-head"><div><p className="eyebrow">{language === "bn" ? game.genreBn : game.genre}</p><h1>{game.name}</h1><p>{game.description[language]}</p></div><span className="game-title-icon"><Icon className="size-7" /></span></div><div className="game-playfield"><div className="game-orbit orbit-a" /><div className="game-orbit orbit-b" /><button onClick={play} className="game-action-button"><Gamepad2 className="size-7" /><span>{t("common.play")}</span></button><p>{t("game.instructions")}: {language === "bn" ? "Play চাপুন, দ্রুত score তুলুন ও নিজের সেরা স্কোর ভাঙুন।" : "Press Play, collect points quickly, and beat your personal best."}</p></div><div className="game-stats"><div><small>{t("game.score")}</small><strong>{progress.save.score}</strong></div><div><small>{t("game.best")}</small><strong><Trophy className="game-trophy mr-1 inline size-4" />{progress.save.highScore}</strong></div><div><small>{t("game.level")}</small><strong>{progress.save.level}</strong></div><div><small>{t("game.resources")}</small><strong>{progress.save.resources}</strong></div></div><div className="mt-5 flex gap-2"><Button variant="outline" size="sm" onClick={progress.reset}><RotateCcw className="mr-2 size-4" />{t("common.reset")}</Button>{progress.storageWarning && <p className="my-auto text-xs text-destructive">{t("game.storageFull")}</p>}</div></section></div>;
}
