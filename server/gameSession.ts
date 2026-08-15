export type SavedGameSession = { version: 1; savedAt: number; state: Record<string, unknown> };

function isSafeValue(value: unknown, depth = 0): boolean {
  if (depth > 6 || value === null) return value === null;
  if (typeof value === "string") return value.length <= 2_000;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length <= 256 && value.every((item) => isSafeValue(item, depth + 1));
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.length <= 64 && entries.every(([key, item]) => key.length <= 80 && isSafeValue(item, depth + 1));
  }
  return false;
}

export function normalizeGameSession(value: unknown): SavedGameSession | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Partial<SavedGameSession>;
  const savedAt = input.savedAt;
  if (input.version !== 1 || !Number.isSafeInteger(savedAt) || !savedAt || savedAt <= 0 || !input.state || typeof input.state !== "object" || Array.isArray(input.state) || !isSafeValue(input.state)) return null;
  const session: SavedGameSession = { version: 1, savedAt, state: input.state as Record<string, unknown> };
  return JSON.stringify(session).length <= 12_000 ? session : null;
}

export function sessionToRestore(value: unknown, latestLocalActionAt: number): SavedGameSession | null {
  const session = normalizeGameSession(value);
  return session && (!latestLocalActionAt || session.savedAt > latestLocalActionAt) ? session : null;
}
