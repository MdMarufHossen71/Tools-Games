export type GameStreak = { current: number; longest: number; lastPlayedDay: string };

const asStreak = (value: unknown): Partial<GameStreak> => value && typeof value === "object" ? (value as Partial<GameStreak>) : {};

export function advanceGameStreak(resources: unknown, now = new Date()): { gameStreak: GameStreak } {
  const existing = asStreak((resources as { gameStreak?: unknown } | null)?.gameStreak);
  const today = now.toISOString().slice(0, 10);
  const current = Number.isSafeInteger(existing.current) && (existing.current ?? 0) > 0 ? Number(existing.current) : 0;
  const longest = Number.isSafeInteger(existing.longest) && (existing.longest ?? 0) > 0 ? Number(existing.longest) : 0;
  if (existing.lastPlayedDay === today) return { gameStreak: { current, longest: Math.max(current, longest), lastPlayedDay: today } };
  const prior = existing.lastPlayedDay ? Date.parse(`${existing.lastPlayedDay}T00:00:00.000Z`) : NaN;
  const consecutive = Number.isFinite(prior) && Math.round((Date.parse(`${today}T00:00:00.000Z`) - prior) / 86_400_000) === 1;
  const next = consecutive ? current + 1 : 1;
  return { gameStreak: { current: next, longest: Math.max(longest, next), lastPlayedDay: today } };
}
