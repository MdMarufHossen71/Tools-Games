import { useCallback, useEffect, useRef, useState } from "react";
import { gameStateKey, safeGet, safeRemove, safeSet } from "@/lib/storage";

export const GAME_SAVE_VERSION = 2;

export type GameSave = {
  version: number;
  highScore: number;
  score: number;
  level: number;
  resources: number;
  updatedAt: string;
};

const emptySave: GameSave = { version: GAME_SAVE_VERSION, highScore: 0, score: 0, level: 1, resources: 0, updatedAt: "" };

const MAX_SCORE = Number.MAX_SAFE_INTEGER;

const clampCount = (value: unknown, fallback: number) => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(Math.max(Math.trunc(numeric), 0), MAX_SCORE);
};

/**
 * Accepts only a save this build understands. Anything else — a corrupted value, a
 * future version, an object with string scores — yields fresh state instead of
 * being handed to a game that would then read `undefined` and crash.
 */
export function parseGameSave(value: unknown): GameSave | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<GameSave>;
  const version = typeof candidate.version === "number" ? candidate.version : 0;
  if (version > GAME_SAVE_VERSION) return null;
  /*
   * Saves below version 2 are discarded rather than migrated.
   *
   * Before version 2 there were no games. Every slug rendered one shared placeholder
   * whose only control awarded `Math.max(10, Math.floor(Math.random() * 125))` points
   * per press, so a stored score of 4,180 records nothing a player did and no skill
   * they have. Carrying those numbers into a real game would show them a personal
   * best they never earned, which is worse than starting them at zero. `loadSave`
   * removes the rejected key, so this happens once per browser and silently.
   */
  if (version < 2) return null;
  if (typeof candidate.highScore !== "number" && typeof candidate.score !== "number") return null;
  return {
    version: GAME_SAVE_VERSION,
    highScore: clampCount(candidate.highScore, 0),
    score: clampCount(candidate.score, 0),
    level: Math.max(1, clampCount(candidate.level, 1)),
    resources: clampCount(candidate.resources, 0),
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : "",
  };
}

function loadSave(slug: string): GameSave {
  const raw = safeGet<unknown>(gameStateKey(slug), null);
  if (raw === null) return emptySave;
  const parsed = parseGameSave(raw);
  if (parsed) return parsed;
  // Unusable state is discarded rather than left to fail on every visit.
  safeRemove(gameStateKey(slug));
  return emptySave;
}

/**
 * Per-game progress.
 *
 * Two things this deliberately does not do:
 *  - It does not write on mount. Previously, merely opening a game's page created a
 *    storage key, so "clear my data" had nothing to do with what the user played.
 *  - It does not persist across a slug change without re-reading. wouter reuses the
 *    component instance when only the route param changes, so the old code wrote
 *    game A's score into game B's key on navigation.
 */
export function useGamePersistence(slug: string) {
  const [save, setSave] = useState<GameSave>(() => loadSave(slug));
  const [storageWarning, setStorageWarning] = useState(false);

  const currentSlug = useRef(slug);
  const dirty = useRef(false);

  useEffect(() => {
    if (currentSlug.current === slug) return;
    currentSlug.current = slug;
    dirty.current = false;
    setStorageWarning(false);
    setSave(loadSave(slug));
  }, [slug]);

  useEffect(() => {
    if (!dirty.current) return;
    if (currentSlug.current !== slug) return;
    const result = safeSet(gameStateKey(slug), save);
    if (!result.ok) setStorageWarning(true);
  }, [save, slug]);

  const update = useCallback((patch: Partial<Omit<GameSave, "version" | "updatedAt">>) => {
    dirty.current = true;
    setSave((current) => {
      const next: GameSave = {
        ...current,
        ...patch,
        version: GAME_SAVE_VERSION,
        score: clampCount(patch.score ?? current.score, current.score),
        level: Math.max(1, clampCount(patch.level ?? current.level, current.level)),
        resources: clampCount(patch.resources ?? current.resources, current.resources),
        updatedAt: new Date().toISOString(),
      };
      next.highScore = Math.max(clampCount(current.highScore, 0), next.score, clampCount(patch.highScore ?? 0, 0));
      return next;
    });
  }, []);

  /** Clears the current run and keeps the high score. */
  const reset = useCallback(() => {
    dirty.current = true;
    setSave((current) => ({ ...emptySave, highScore: current.highScore, updatedAt: new Date().toISOString() }));
  }, []);

  /** Removes the stored save entirely, high score included. */
  const forget = useCallback(() => {
    dirty.current = false;
    safeRemove(gameStateKey(slug));
    setSave(emptySave);
    setStorageWarning(false);
  }, [slug]);

  return { save, update, reset, forget, storageWarning };
}
