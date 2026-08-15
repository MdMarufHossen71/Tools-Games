export type PlayfulEffectKey = "cat" | "trail" | "buddy";
export type PlayfulEffects = Record<PlayfulEffectKey, boolean>;

export const defaultPlayfulEffects: PlayfulEffects = { cat: false, trail: false, buddy: false };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizePlayfulEffects(value: unknown): PlayfulEffects | null {
  if (!isRecord(value)) return null;
  const source = isRecord(value.playfulEffects) ? value.playfulEffects : value;
  if (!["cat", "trail", "buddy"].some(key => typeof source[key] === "boolean")) return null;
  return {
    cat: source.cat === true,
    trail: source.trail === true,
    buddy: source.buddy === true,
  };
}

export function readLocalPlayfulEffects() {
  try { return normalizePlayfulEffects(JSON.parse(localStorage.getItem("toolshub-playful-effects") || "null")) ?? defaultPlayfulEffects; }
  catch { return defaultPlayfulEffects; }
}

export function desktopEffectsAllowed() {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
