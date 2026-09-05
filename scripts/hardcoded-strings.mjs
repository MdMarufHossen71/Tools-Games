/**
 * Hardcoded user-facing text audit.
 *
 * The translation dictionary is meant to be the only source of user-facing prose. A
 * string typed straight into a component bypasses it silently: it typechecks, it
 * renders, and it shows English to a Bangla reader with nothing to flag it. This
 * catches the two ways that happens in JSX — text between tags, and a localizable
 * attribute given a literal instead of a `t(...)` call.
 *
 * Only files the application actually reaches are scanned. `client/src/components/ui`
 * carries the full shadcn set, most of which this app never renders; auditing dead
 * vendor files would bury the real findings. The reachable set is walked from
 * `main.tsx` through its imports, so a primitive becomes subject to the check the
 * moment something imports it.
 *
 * This is a text scan, not a parser. It is deliberately shallow so it stays cheap to
 * run and easy to read; `ALLOWED` below carries the handful of literals that are
 * correct as written, each with the reason.
 *
 * Run with:  node scripts/hardcoded-strings.mjs
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "client", "src");
const ENTRY = path.join(SRC, "main.tsx");

/** Attributes whose value is read out or shown to a person. */
const LOCALIZABLE_ATTRIBUTES = ["aria-label", "aria-description", "aria-roledescription", "aria-placeholder", "aria-valuetext", "placeholder", "title", "alt"];

/**
 * Literals that are correct as a literal. Matched case-sensitively against the
 * trimmed text.
 */
const ALLOWED = new Set([
  // Wordmark. The visible letters are `aria-hidden`; the link's accessible name comes
  // from `a11y.home`, so this is decoration and stays Latin in both locales.
  "TOOLS",
  "GAMES",
  "BANGLADESH",
  "BD",
  // Language switch label. It is the name of the *other* language, written in that
  // language, which is what a reader needs to see on the button.
  "বাংলা",
  "English",
]);

/** Text with no prose in it: punctuation, separators, digits, single letters. */
function isProse(text) {
  if (!/\p{L}{2}/u.test(text)) return false;
  // A lone JSX entity or a bare symbol run.
  if (/^&[a-z]+;$/i.test(text)) return false;
  // The `>` … `<` pattern also spans a pair of comparison operators in ordinary
  // TypeScript, so `saved.length > 0 && saved.length < 64` reads as a text node. Any
  // of these means the match came from an expression rather than from JSX.
  if (/&&|\|\||===|!==|=>|\?\?|\.length|\(\)/.test(text)) return false;
  return true;
}

/** Resolves an import specifier to a file inside `client/src`, or null. */
function resolveImport(specifier, fromFile) {
  let base;
  if (specifier.startsWith("@/")) base = path.join(SRC, specifier.slice(2));
  else if (specifier.startsWith(".")) base = path.resolve(path.dirname(fromFile), specifier);
  else return null;

  const candidates = [base, `${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx"), path.join(base, "index.ts")];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Every module reachable from the entry point, in discovery order. */
function reachableModules() {
  const seen = new Set();
  const queue = [ENTRY];
  const order = [];
  while (queue.length) {
    const file = queue.shift();
    if (seen.has(file)) continue;
    seen.add(file);
    order.push(file);
    const source = readFileSync(file, "utf8");
    // The optional `(` picks up dynamic imports as well as static ones. The game
    // registry reaches every game module through `lazy(() => import("./snake"))`, so
    // without it the whole `client/src/games` tree — the shell, the coming-soon state
    // and each game — was outside the audit while the run still reported success.
    for (const match of source.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
      const resolved = resolveImport(match[1], file);
      if (resolved) queue.push(resolved);
    }
  }
  return order;
}

/**
 * True when the `>` at `index` really closes a JSX tag rather than being half of an
 * operator. A closing bracket always follows the last character of the tag — a letter,
 * a digit, a quote, a brace or a self-closing slash. An arrow function (`=>`), a
 * comparison (`axis > 0`) and a generic argument list all fail that test, and every one
 * of those was being reported as JSX text.
 */
function closesTag(source, index) {
  return TAG_END.test(source[index - 1] ?? "");
}

/** Line number of a character offset, 1-based. */
function lineAt(source, index) {
  return source.slice(0, index).split("\n").length;
}

const TAG_END = new RegExp("[A-Za-z0-9_\"'}\]/]");

const findings = [];

for (const file of reachableModules()) {
  if (!file.endsWith(".tsx")) continue;
  const source = readFileSync(file, "utf8");
  const relative = path.relative(ROOT, file).replace(/\\/g, "/");

  // Text between two tags, with no braces in it — an expression would mean the value
  // comes from somewhere else, and `t(...)` is the expected somewhere.
  for (const match of source.matchAll(/>([^<>{}\n]+)</g)) {
    const text = match[1].trim();
    if (!text || !closesTag(source, match.index) || !isProse(text) || ALLOWED.has(text)) continue;
    findings.push({ relative, line: lineAt(source, match.index), kind: "text", text });
  }

  for (const attribute of LOCALIZABLE_ATTRIBUTES) {
    const pattern = new RegExp(`${attribute}=(?:"([^"]*)"|'([^']*)')`, "g");
    for (const match of source.matchAll(pattern)) {
      const text = (match[1] ?? match[2] ?? "").trim();
      if (!text || !isProse(text) || ALLOWED.has(text)) continue;
      findings.push({ relative, line: lineAt(source, match.index), kind: attribute, text });
    }
  }
}

const scanned = reachableModules().filter((file) => file.endsWith(".tsx")).length;
console.log(`Scanned ${scanned} reachable component file(s) for hardcoded user-facing text.`);

if (findings.length) {
  console.log(`\n${findings.length} hardcoded string(s) found:\n`);
  for (const { relative, line, kind, text } of findings) {
    console.log(`  ${relative}:${line}  [${kind}]  ${JSON.stringify(text.length > 70 ? `${text.slice(0, 70)}…` : text)}`);
  }
  console.log("\nMove each of these into client/src/i18n/translations.ts and read it with t().");
} else {
  console.log("No hardcoded user-facing text in any reachable component.");
}

process.exit(findings.length ? 1 : 0);
