/**
 * Development audit: checks each theme preset against the contrast ratios the
 * interface depends on, using the same helpers the app uses at runtime so the
 * numbers reported here are the numbers the browser will render.
 *
 * Run with `node --experimental-strip-types scripts/theme-contrast.mjs`.
 *
 * The two default presets ("light" and "dark") must pass everything: they are the
 * Cobalt Workshop palette and the fallback for every other code path. The remaining
 * presets are recognisable developer palettes the user opts into, so a shortfall
 * there is reported as a warning rather than a failure.
 */
import { contrastRatio, mix, mutedText, readableAccent, readableOn } from "../client/src/lib/color.ts";
import { themePresets } from "../client/src/data/themes.ts";

const TEXT_MIN = 4.5;
const UI_MIN = 3;
const DEFAULT_IDS = new Set(["light", "dark"]);

/** Mirrors the derivations in AppSettingsContext so the audit tests real values. */
function derive(preset) {
  const { background, surface, text, primary, border } = preset.tokens;
  // The same worst-case field the provider picks when deriving `--primary-text`.
  const accentBase = contrastRatio(primary, surface) <= contrastRatio(primary, background) ? surface : background;
  const accentText = readableAccent(primary, accentBase);
  return [
    { label: "text on surface", a: text, b: surface, min: TEXT_MIN },
    { label: "text on background", a: text, b: background, min: TEXT_MIN },
    { label: "muted-foreground on surface", a: mutedText(text, surface), b: surface, min: TEXT_MIN },
    { label: "primary-text on surface", a: accentText, b: surface, min: TEXT_MIN },
    { label: "primary-text on background", a: accentText, b: background, min: TEXT_MIN },
    { label: "primary-foreground on primary", a: readableOn(primary), b: primary, min: TEXT_MIN },
    // Cobalt fills and rules are non-text, so 3:1 is the bar that applies to them.
    { label: "primary as fill on surface", a: primary, b: surface, min: UI_MIN },
    { label: "border-strong on surface", a: mix(border, text, 0.42), b: surface, min: UI_MIN },
    { label: "border-strong on background", a: mix(border, text, 0.42), b: background, min: UI_MIN },
  ];
}

let failures = 0;
let warnings = 0;

for (const preset of themePresets) {
  const isDefault = DEFAULT_IDS.has(preset.id);
  const checks = derive(preset).map((check) => ({ ...check, ratio: contrastRatio(check.a, check.b) }));
  const short = checks.filter((check) => check.ratio < check.min);

  if (short.length === 0) {
    console.log(`PASS  ${preset.name}`);
    continue;
  }

  console.log(`${isDefault ? "FAIL" : "WARN"}  ${preset.name}${isDefault ? " (default preset)" : ""}`);
  for (const check of short) {
    console.log(`        ${check.label}: ${check.ratio.toFixed(2)}:1 (needs ${check.min}:1) — ${check.a} on ${check.b}`);
  }
  if (isDefault) failures += short.length;
  else warnings += short.length;
}

console.log(`\n${failures} failure(s) in default presets, ${warnings} warning(s) in opt-in presets.`);
if (failures > 0) process.exitCode = 1;
