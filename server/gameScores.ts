export const scoreGameSlugs = ["wordle", "2048", "snake", "tetris", "memory-match", "tic-tac-toe", "minesweeper", "sudoku"] as const;
export type ScoreGameSlug = (typeof scoreGameSlugs)[number];

const scoreCaps: Record<ScoreGameSlug, number> = { wordle: 1_000, "2048": 1_000_000, snake: 100_000, tetris: 1_000_000, "memory-match": 100_000, "tic-tac-toe": 1_000, minesweeper: 100_000, sudoku: 10_000 };

export function validateGameScore(gameSlug: string, score: number) {
  if (!scoreGameSlugs.includes(gameSlug as ScoreGameSlug)) throw new Error("This game does not accept score submissions");
  if (!Number.isSafeInteger(score) || score < 0 || score > scoreCaps[gameSlug as ScoreGameSlug]) throw new Error("Score is outside the permitted range for this game");
  return { gameSlug: gameSlug as ScoreGameSlug, score };
}
