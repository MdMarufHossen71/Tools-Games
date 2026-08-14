/** Cobalt Workshop design reminder: game progress is treated as a private local save-state, never a server leaderboard. */
import { useEffect, useState } from "react";
import { gameStateKey, safeGet, safeSet } from "@/lib/storage";

export type GameSave = { highScore: number; score: number; level: number; resources: number; updatedAt: string };
const emptySave: GameSave = { highScore: 0, score: 0, level: 1, resources: 0, updatedAt: "" };

export function useGamePersistence(slug: string) {
  const [save, setSave] = useState<GameSave>(() => safeGet(gameStateKey(slug), emptySave));
  const [storageWarning, setStorageWarning] = useState(false);
  useEffect(() => {
    const result = safeSet(gameStateKey(slug), { ...save, updatedAt: new Date().toISOString() });
    if (!result.ok) setStorageWarning(true);
  }, [save, slug]);
  const update = (patch: Partial<GameSave>) => setSave((current) => ({
    ...current, ...patch, highScore: Math.max(current.highScore, patch.score ?? current.score, patch.highScore ?? 0),
  }));
  const reset = () => setSave((current) => ({ ...emptySave, highScore: current.highScore }));
  return { save, update, reset, storageWarning };
}
