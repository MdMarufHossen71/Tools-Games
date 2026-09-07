/**
 * Which slugs are actually playable, and how to load them.
 *
 * Two rules this file enforces:
 *
 *  1. A slug is playable if and only if it has an entry here. `Games.tsx` reads the
 *     same map for its badge and `GamePage.tsx` for what to render, so the list page
 *     can never advertise a game the game page then fails to load.
 *  2. Every entry is a dynamic import. The site is one static bundle already past
 *     500 kB, and a visitor who opens Snake should not download thirty other games.
 *     Vite splits each of these into its own chunk automatically.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/** Props every game module's default export receives. */
export type GameModuleProps = {
  /** The registry slug, for persistence. Games pass it straight to `useGameSession`. */
  slug: string;
  /** The game's display name, used as the play surface's accessible label. */
  title: string;
};

type GameComponent = LazyExoticComponent<ComponentType<GameModuleProps>>;

/**
 * Add a slug here only once the game passes the whole Phase 3 checklist: a full round
 * on the keyboard alone, a full round on touch alone, a mid-run resize, a mid-run tab
 * switch, two clean restarts, and a persisted high score.
 */
const modules = {
  snake: lazy(() => import("./snake")),
  tetris: lazy(() => import("./tetris")),
  "2048": lazy(() => import("./2048")),
  "sky-hopper": lazy(() => import("./sky-hopper")),
  "brick-breaker": lazy(() => import("./brick-breaker")),
  "tic-tac-toe": lazy(() => import("./tic-tac-toe")),
  "connect-four": lazy(() => import("./connect-four")),
  "memory-match": lazy(() => import("./memory-match")),
  "15-puzzle": lazy(() => import("./15-puzzle")),
  hangman: lazy(() => import("./hangman")),
  "geo-quiz": lazy(() => import("./geo-quiz")),
  "math-sprint": lazy(() => import("./math-sprint")),
  "word-grid": lazy(() => import("./word-grid")),
  "anagram-sprint": lazy(() => import("./anagram-sprint")),
  "word-search": lazy(() => import("./word-search")),
  "type-blaster": lazy(() => import("./type-blaster")),
  minesweeper: lazy(() => import("./minesweeper")),
  sudoku: lazy(() => import("./sudoku")),
  "maze-runner": lazy(() => import("./maze-runner")),
  "space-defenders": lazy(() => import("./space-defenders")),
  "dino-dash": lazy(() => import("./dino-dash")),
  "water-sort": lazy(() => import("./water-sort")),
  "block-fit": lazy(() => import("./block-fit")),
  "idle-workshop": lazy(() => import("./idle-workshop")),
  asteroids: lazy(() => import("./asteroids")),
  "maze-chaser": lazy(() => import("./maze-chaser")),
  checkers: lazy(() => import("./checkers")),
  "fruit-merge": lazy(() => import("./fruit-merge")),
  "hill-rider": lazy(() => import("./hill-rider")),
  "pocket-pool": lazy(() => import("./pocket-pool")),
  "territory-loop": lazy(() => import("./territory-loop")),
  "tower-guard": lazy(() => import("./tower-guard")),
} satisfies Record<string, GameComponent>;

type PlayableSlug = keyof typeof modules;

/** Guards the index access, so a crafted URL cannot reach `Object.prototype`. */
const playable = new Set<string>(Object.keys(modules));

export const playableSlugs: string[] = Object.keys(modules);

export function isPlayable(slug: string): boolean {
  return playable.has(slug);
}

/** The lazy component for a slug, or `null` when the game is not finished. */
export function loadGame(slug: string): GameComponent | null {
  if (!playable.has(slug)) return null;
  return modules[slug as PlayableSlug];
}
