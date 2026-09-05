/**
 * The honest state for a game that is listed but not finished.
 *
 * The alternative — shipping a board that responds to a keyboard but not a finger,
 * or awards points for pressing one button — is worse than shipping nothing, because
 * it costs the player time before they discover it does not work. This screen says
 * so plainly, in both languages, and sends them back to the games that do.
 */
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "@/contexts/AppSettingsContext";

export default function ComingSoon() {
  const { t } = useTranslation();

  return (
    <div className="game-coming-soon">
      <p className="game-coming-badge">{t("game.comingSoon.badge")}</p>
      <h2>{t("game.comingSoon.title")}</h2>
      <p>{t("game.comingSoon.copy")}</p>
      <Link href="/games" className="back-link">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t("game.exit")}
      </Link>
    </div>
  );
}
