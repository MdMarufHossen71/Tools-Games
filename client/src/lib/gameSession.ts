export type ResumableGameSession = { version: 1; savedAt: number; state: Record<string, unknown> };

export function sessionToResume(value: unknown, latestLocalActionAt: number): ResumableGameSession | null {
  if (!value || typeof value !== "object") return null;
  const session = value as Partial<ResumableGameSession>;
  if (session.version !== 1 || !Number.isSafeInteger(session.savedAt) || !session.savedAt || session.savedAt <= 0 || !session.state || typeof session.state !== "object" || Array.isArray(session.state)) return null;
  return !latestLocalActionAt || session.savedAt > latestLocalActionAt ? session as ResumableGameSession : null;
}
