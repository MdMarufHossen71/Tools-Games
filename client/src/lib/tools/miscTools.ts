/** Fun & misc static wave. Live toys (timers, canvas, overlays) arrive in Wave 5. */
import { ToolError, field, type ToolRunner } from "@/lib/toolOperations";

function hashSeed(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export const runMiscTools: ToolRunner = async (slug, _input, _option, _t, extra) => {
  const F = (key: string, fallback = "") => field(extra, key, fallback);

  if (slug === "age-in-seconds") {
    const dob = new Date(`${F("dob", "2000-01-01")}T00:00:00`);
    if (Number.isNaN(dob.getTime()) || dob > new Date()) throw new ToolError("tool.error.generic");
    const seconds = Math.floor((Date.now() - dob.getTime()) / 1000);
    return { text: JSON.stringify({ seconds, minutes: Math.floor(seconds / 60), days: Math.floor(seconds / 86400) }, null, 2) };
  }
  if (slug === "dog-cat-years-converter") {
    const age = Number(F("age", "3"));
    if (!Number.isFinite(age) || age < 0) throw new ToolError("tool.error.number");
    // Common veterinary curve: 15 + 9 + 4/5 per further year.
    const converted = age <= 0 ? 0 : age <= 1 ? 15 * age : age <= 2 ? 15 + 9 * (age - 1) : 24 + (F("mode", "dog") === "cat" ? 4 : 5) * (age - 2);
    return { text: JSON.stringify({ petYears: Number(converted.toFixed(1)) }, null, 2) };
  }
  if (slug === "love-calculator") {
    // Deterministic novelty: same pair, same score, every visit.
    const pair = `${F("a").trim().toLowerCase()}♥${F("b").trim().toLowerCase()}`;
    if (F("a").trim() === "" || F("b").trim() === "") throw new ToolError("tool.error.generic");
    const score = 40 + (hashSeed(pair) % 61);
    return { text: JSON.stringify({ score: `${score}%` }, null, 2) };
  }
  if (slug === "aspect-ratio-calculator") {
    const w = Number(F("w", "1920"));
    const h = Number(F("h", "1080"));
    const nw = Number(F("nw", "1280"));
    if (![w, h, nw].every(Number.isFinite) || w <= 0 || h <= 0) throw new ToolError("tool.error.number");
    const divisor = gcd(Math.round(w), Math.round(h)) || 1;
    return { text: JSON.stringify({ ratio: `${Math.round(w) / divisor}:${Math.round(h) / divisor}`, heightForNewWidth: Number(((nw * h) / w).toFixed(2)) }, null, 2) };
  }
  if (slug === "aspect-ratio-cropper") {
    const w = Number(F("w", "1920"));
    const h = Number(F("h", "1080"));
    const match = F("ratio", "1:1").match(/^\s*(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*$/);
    if (![w, h].every(Number.isFinite) || w <= 0 || h <= 0 || !match) throw new ToolError("tool.error.generic");
    const target = Number(match[1]) / Number(match[2]);
    const current = w / h;
    const crop = current > target ? { width: Math.floor(h * target), height: Math.floor(h) } : { width: Math.floor(w), height: Math.floor(w / target) };
    return { text: JSON.stringify({ ...crop, offsetX: Math.floor((w - crop.width) / 2), offsetY: Math.floor((h - crop.height) / 2) }, null, 2) };
  }
  if (slug === "event-countdown") {
    const date = new Date(`${F("date", "2027-01-01")}T00:00:00`);
    if (Number.isNaN(date.getTime())) throw new ToolError("tool.error.generic");
    const diff = date.getTime() - Date.now();
    const abs = Math.abs(diff);
    const parts = { days: Math.floor(abs / 86400000), hours: Math.floor((abs / 3600000) % 24), minutes: Math.floor((abs / 60000) % 60) };
    return { text: JSON.stringify({ past: diff < 0, ...parts }, null, 2) };
  }
  if (slug === "screen-resolution-detector") {
    return {
      text: JSON.stringify(
        {
          screen: `${window.screen.width}×${window.screen.height}`,
          viewport: `${window.innerWidth}×${window.innerHeight}`,
          devicePixelRatio: window.devicePixelRatio,
          colorDepth: window.screen.colorDepth,
          orientation: window.screen.orientation?.type ?? "unknown",
        },
        null,
        2,
      ),
    };
  }
  return null;
};
