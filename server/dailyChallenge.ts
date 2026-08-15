import { randomInt } from "node:crypto";
import type { ScoreGameSlug } from "./gameScores";

export const dailyChallengeGameSlugs: ScoreGameSlug[] = ["wordle", "2048", "snake", "tetris", "memory-match", "minesweeper", "sudoku"];

export type DailyChallenge = { gameSlug: ScoreGameSlug; dateKey: string };

export function utcDateKey(value = new Date()) { return value.toISOString().slice(0, 10); }

export function dailyChallengeFor(dateKey: string): DailyChallenge {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new Error("Invalid daily challenge date");
  const numericDate = Number(dateKey.replaceAll("-", ""));
  return { dateKey, gameSlug: dailyChallengeGameSlugs[numericDate % dailyChallengeGameSlugs.length] };
}

export function randomDailyChallengeFor(dateKey: string, selection = randomInt(dailyChallengeGameSlugs.length)): DailyChallenge {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new Error("Invalid daily challenge date");
  if (!Number.isInteger(selection) || selection < 0 || selection >= dailyChallengeGameSlugs.length) throw new Error("Invalid daily challenge selection");
  return { dateKey, gameSlug: dailyChallengeGameSlugs[selection] };
}

export function readDailyChallenge(value: unknown): DailyChallenge | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { gameSlug?: unknown; dateKey?: unknown };
  if (typeof candidate.dateKey !== "string" || typeof candidate.gameSlug !== "string" || !dailyChallengeGameSlugs.includes(candidate.gameSlug as ScoreGameSlug) || !/^\d{4}-\d{2}-\d{2}$/.test(candidate.dateKey)) return null;
  return { dateKey: candidate.dateKey, gameSlug: candidate.gameSlug as ScoreGameSlug };
}
