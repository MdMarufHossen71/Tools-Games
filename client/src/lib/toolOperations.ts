/** Cobalt Workshop design reminder: results are immediate, useful, and soberly formatted; never simulate a server or collect an input. */
import { v4 as uuidv4 } from "uuid";
import { ulid } from "ulid";
import { nanoid } from "nanoid";
import { format as formatSql } from "sql-formatter";
import * as yaml from "js-yaml";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import toml from "toml";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { MathError, evaluateExpression, formatNumber } from "@/lib/safeMath";
import type { TranslationKey } from "@/i18n/translations";

const morse: Record<string, string> = { a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.", ".": ".-.-.-", ",": "--..--", "?": "..--..", "!": "-.-.--" };
const nato: Record<string, string> = { a: "Alfa", b: "Bravo", c: "Charlie", d: "Delta", e: "Echo", f: "Foxtrot", g: "Golf", h: "Hotel", i: "India", j: "Juliett", k: "Kilo", l: "Lima", m: "Mike", n: "November", o: "Oscar", p: "Papa", q: "Quebec", r: "Romeo", s: "Sierra", t: "Tango", u: "Uniform", v: "Victor", w: "Whiskey", x: "X-ray", y: "Yankee", z: "Zulu" };

const textToSlug = (input: string) => input.toLowerCase().trim().replace(/[’'"`]/g, "").replace(/[^a-z0-9ঀ-৿]+/g, "-").replace(/(^-|-$)/g, "");
const toCamel = (input: string) => input.toLowerCase().replace(/(?:^|[\s_-]+)(\w)/g, (_m, letter) => letter.toUpperCase()).replace(/^\w/, (letter) => letter.toLowerCase());
const words = (input: string) => input.match(/[A-Za-z0-9ঀ-৿']+/g) ?? [];
const escapeHtml = (input: string) => input.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);
const reverseMorse = Object.fromEntries(Object.entries(morse).map(([key, value]) => [value, key]));

/** Uniform integer in [0, bound) from `crypto`, with rejection sampling so the range is unbiased. */
function randomInt(bound: number) {
  if (bound <= 0) return 0;
  const limit = Math.floor(2 ** 32 / bound) * bound;
  const buffer = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buffer);
    if (buffer[0] < limit) return buffer[0] % bound;
  }
}

/** Fisher-Yates. The previous `sort(() => random - 0.5)` comparator was biased and not a valid ordering. */
function shuffle<T>(items: T[]): T[] {
  const output = items.slice();
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1);
    [output[index], output[swap]] = [output[swap], output[index]];
  }
  return output;
}

/**
 * Unicode-safe Base64 encode without the deprecated `unescape` idiom.
 * Chunked so a large input cannot blow the argument-length limit.
 */
export function base64EncodeUnicode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const end = Math.min(i + CHUNK, bytes.length);
    for (let j = i; j < end; j += 1) binary += String.fromCharCode(bytes[j]);
  }
  return btoa(binary);
}

/** Hex-encode a digest buffer. */
function hexOf(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Hash tools run through Web Crypto (`crypto.subtle`), not the unmaintained
 * `crypto-js` bundle. SHA-256/384/512 + SHA-1 are available there; MD5, SHA3
 * and RIPEMD-160 are intentionally dropped — MD5/SHA-1 are broken for security
 * and must never be presented as password storage, and SHA3 is not in WebCrypto.
 */
export const ASYNC_TOOLS: ReadonlySet<string> = new Set(["hash-generator", "file-hash-calculator"]);

export function isAsyncTool(slug: string) {
  return ASYNC_TOOLS.has(slug);
}

export async function digestText(algorithm: string, text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const out = await crypto.subtle.digest(algorithm, data);
  return hexOf(out);
}

/** Largest file we will hash in-browser (50 MB). Larger picks are rejected with a localized error. */
export const MAX_FILE_HASH_BYTES = 50 * 1024 * 1024;

/**
 * Translator injected by the caller so result prose can be localized. Falls back
 * to English when the function is used outside React (tests, direct calls).
 */
export type ToolTranslate = (key: TranslationKey, values?: Record<string, string | number>) => string;

const englishFallback: Record<string, string> = {
  "tool.result.stats": "Live statistics",
  "tool.result.preview": "Sanitized preview HTML",
  "tool.result.needsInput": "Add an input to see an immediate, browser-only result.",
  "tool.result.notesHint": "Your notes stay in this browser on this device.",
  "tool.result.signaturePresent": "Present — not verified locally",
  "tool.result.signatureMissing": "Missing",
  "tool.bmi.underweight": "Underweight",
  "tool.bmi.healthy": "Healthy range",
  "tool.bmi.overweight": "Overweight",
  "tool.bmi.obese": "Obesity range",
  "tool.error.generic": "Check the input and try again.",
  "tool.error.octal": "Enter a valid octal mode, for example 755.",
  "tool.error.hex": "Enter a 6-digit HEX colour, for example #3264FF.",
  "tool.error.jwt": "Enter a token in header.payload.signature form.",
  "tool.error.number": "Enter one or two numbers separated by a space or comma.",
  "tool.error.math.badChar": "Only numbers, operators and known function names are allowed.",
  "tool.error.math.badSyntax": "The expression is incomplete or has an unmatched bracket.",
  "tool.error.math.unknownName": "Unknown function or constant name.",
  "tool.error.math.badArgs": "That function was given the wrong number of arguments.",
  "tool.error.math.notFinite": "The result is not a finite number.",
  "tool.error.math.tooLong": "The expression is too long.",
  "tool.error.fileTooLarge": "That file is too large to hash in the browser (max 50 MB).",
  "tool.file.choose": "Choose file",
  "tool.file.selected": "Selected file: {name} ({size})",
  "tool.file.hashNote": "Files are read only on this device to compute hashes. Nothing is uploaded.",
  "tool.file.noFile": "Choose a file to compute its SHA hashes locally.",
  "tool.hash.note": "Hashes are computed locally with Web Crypto. MD5/SHA-1 are checksums only — never use them to store passwords.",
};

const identity: ToolTranslate = (key) => englishFallback[key] ?? key;

export type ToolResult = {
  text: string;
  html?: string;
  /** Already-localized caption for the output panel. */
  label?: string;
  /** Set when the result describes a failure rather than a value. */
  error?: boolean;
  /** Set when the tool has no implementation yet. */
  unavailable?: boolean;
};

/** Thrown by a tool branch to surface a localized, specific reason. */
class ToolError extends Error {
  readonly key: TranslationKey;
  constructor(key: TranslationKey) {
    super(key);
    this.name = "ToolError";
    this.key = key;
  }
}

export async function runHashText(input: string, t: ToolTranslate = identity): Promise<ToolResult> {
  if (!input.trim()) return { text: t("tool.result.needsInput") };
  if (!crypto.subtle) return { text: t("tool.error.generic"), error: true };
  try {
    const [sha1, sha256, sha384, sha512] = await Promise.all([
      digestText("SHA-1", input),
      digestText("SHA-256", input),
      digestText("SHA-384", input),
      digestText("SHA-512", input),
    ]);
    return {
      text: JSON.stringify({ SHA1: sha1, SHA256: sha256, SHA384: sha384, SHA512: sha512 }, null, 2),
      label: t("tool.hash.note"),
    };
  } catch {
    return { text: t("tool.error.generic"), error: true };
  }
}

export async function runHashFile(file: File, t: ToolTranslate = identity): Promise<ToolResult> {
  if (file.size > MAX_FILE_HASH_BYTES) return { text: t("tool.error.fileTooLarge"), error: true };
  if (!crypto.subtle) return { text: t("tool.error.generic"), error: true };
  try {
    const data = await file.arrayBuffer();
    const [sha1, sha256, sha384, sha512] = await Promise.all([
      crypto.subtle.digest("SHA-1", data).then(hexOf),
      crypto.subtle.digest("SHA-256", data).then(hexOf),
      crypto.subtle.digest("SHA-384", data).then(hexOf),
      crypto.subtle.digest("SHA-512", data).then(hexOf),
    ]);
    return {
      text: JSON.stringify(
        { file: file.name, size: file.size, type: file.type || "unknown", SHA1: sha1, SHA256: sha256, SHA384: sha384, SHA512: sha512 },
        null,
        2,
      ),
      label: t("tool.hash.note"),
    };
  } catch {
    return { text: t("tool.error.generic"), error: true };
  }
}

/**
 * Slugs that `runTool` genuinely implements. Everything else in the registry is
 * metadata only: rather than echoing the input back — which made a stub look
 * identical to a working tool — the workspace renders an explicit "not available
 * yet" state for anything missing from this set.
 */
export const IMPLEMENTED_TOOLS: ReadonlySet<string> = new Set([
  // Text & string
  "word-counter", "case-converter", "reverse-text", "remove-extra-whitespaces", "remove-empty-lines",
  "remove-line-breaks", "remove-duplicate-lines", "sort-list", "list-randomizer", "string-shuffler",
  "slug-generator", "text-to-nato-alphabet", "text-to-ascii", "text-to-binary", "text-to-hex",
  "morse-code", "rot13-caesar-cipher", "base64-text", "url-encode-decode", "html-entities",
  "email-normalizer", "html-to-plain-text", "markdown-to-html",
  // Crypto & security
  "hash-generator", "uuid-generator", "ulid-generator", "nanoid-generator", "secure-token-generator",
  "jwt-decoder-debugger",
  // Developer & data
  "markdown-editor", "json-formatter-validator", "json-minifier", "yaml-formatter", "toml-formatter",
  "xml-formatter", "yaml-json-toml-xml-converter", "sql-formatter", "url-parser",
  "keyword-density-analyzer", "chmod-calculator", "math-evaluator",
  // Colour
  "hex-rgb-hsl-hsv-converter", "color-picker",
  // Calculators
  "basic-calculator", "scientific-calculator", "percentage-calculator", "bmi-calculator",
  // Random & generators
  "random-number-generator", "random-string-generator", "email-validator",
  // File
  "file-hash-calculator",
  // Misc
  "notes-pad",
]);

export function isToolImplemented(slug: string) {
  return IMPLEMENTED_TOOLS.has(slug);
}

export function toolPlaceholder(slug: string) {
  if (slug.includes("json")) return '{\n  "hello": "world",\n  "tool": "Tools & Games BD"\n}';
  if (slug.includes("csv")) return "name,city\nAmina,Dhaka\nRahim,Chattogram";
  if (slug.includes("url")) return "https://example.com/path?source=tools#demo";
  if (slug.includes("markdown")) return "# Hello\n\nWrite **Markdown** and see the result.";
  if (slug.includes("sql")) return "select id,name from users where active=1 order by name;";
  if (slug.includes("color")) return "#3264FF";
  if (slug.includes("calculator") || slug.includes("math")) return "(12.5 * 4) / 2";
  if (slug.includes("email")) return "hello.name+news@gmail.com";
  return "Paste or type something here…";
}

export function runTool(slug: string, input: string, option = "default", t: ToolTranslate = identity): ToolResult {
  const clean = input.trim();

  if (!isToolImplemented(slug)) return { text: "", unavailable: true };

  try {
    if (slug === "word-counter") {
      const tokens = words(input); const frequency = Object.entries(tokens.reduce<Record<string, number>>((memo, word) => { const key = word.toLowerCase(); memo[key] = (memo[key] ?? 0) + 1; return memo; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 12);
      return { text: JSON.stringify({ words: tokens.length, characters: input.length, charactersNoSpace: input.replace(/\s/g, "").length, lines: input ? input.split(/\r?\n/).length : 0, bytes: new TextEncoder().encode(input).length, readingMinutes: Number((tokens.length / 200).toFixed(2)), speakingMinutes: Number((tokens.length / 130).toFixed(2)), topWords: Object.fromEntries(frequency) }, null, 2), label: t("tool.result.stats") };
    }
    if (slug === "case-converter") {
      const title = input.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
      return { text: JSON.stringify({ UPPERCASE: input.toUpperCase(), lowercase: input.toLowerCase(), "Title Case": title, camelCase: toCamel(input), snake_case: textToSlug(input).replace(/-/g, "_"), "kebab-case": textToSlug(input), "Alternating cAsE": input.split("").map((char, index) => index % 2 ? char.toLowerCase() : char.toUpperCase()).join("") }, null, 2) };
    }
    if (slug === "reverse-text") return { text: option === "words" ? input.split(/(\s+)/).reverse().join("") : option === "lines" ? input.split("\n").reverse().join("\n") : input.split("").reverse().join("") };
    if (slug === "remove-extra-whitespaces") return { text: input.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim() };
    if (slug === "remove-empty-lines") return { text: input.split("\n").filter((line) => line.trim()).join("\n") };
    if (slug === "remove-line-breaks") return { text: input.replace(/\s*\n\s*/g, " ") };
    if (slug === "remove-duplicate-lines") return { text: input.split("\n").filter((line, index, lines) => lines.indexOf(line) === index).join("\n") };
    if (slug === "sort-list") return { text: input.split("\n").filter(Boolean).sort((a, b) => option === "desc" ? b.localeCompare(a) : a.localeCompare(b, undefined, { numeric: true })).join("\n") };
    if (slug === "list-randomizer" || slug === "string-shuffler") return { text: shuffle(input.split("\n")).join("\n") };
    if (slug === "slug-generator") return { text: textToSlug(input) };
    if (slug === "text-to-nato-alphabet") return { text: input.split("").map((char) => nato[char.toLowerCase()] ?? char).join(" ") };
    if (slug === "text-to-ascii") return { text: input.split("").map((char) => char.charCodeAt(0)).join(" ") };
    if (slug === "text-to-binary") return { text: input.split("").map((char) => char.charCodeAt(0).toString(2).padStart(8, "0")).join(" ") };
    if (slug === "text-to-hex") return { text: input.split("").map((char) => char.charCodeAt(0).toString(16).padStart(2, "0")).join(" ") };
    if (slug === "morse-code") {
      const isMorse = /^[.\-/\s]+$/.test(clean);
      return { text: isMorse ? input.split(" / ").map((word) => word.split(" ").map((code) => reverseMorse[code] ?? "?").join("")).join(" ") : input.toLowerCase().split(" ").map((word) => word.split("").map((char) => morse[char] ?? char).join(" ")).join(" / ") };
    }
    if (slug === "rot13-caesar-cipher") return { text: input.replace(/[a-z]/gi, (char) => String.fromCharCode((char <= "Z" ? 65 : 97) + (char.charCodeAt(0) - (char <= "Z" ? 65 : 97) + 13) % 26)) };
    if (slug === "base64-text") return { text: option === "decode" ? new TextDecoder().decode(Uint8Array.from(atob(input), (char) => char.charCodeAt(0))) : base64EncodeUnicode(input) };
    if (slug === "url-encode-decode") return { text: option === "decode" ? decodeURIComponent(input) : encodeURIComponent(input) };
    if (slug === "html-entities") return { text: option === "unescape" ? new DOMParser().parseFromString(input, "text/html").documentElement.textContent ?? "" : escapeHtml(input) };
    if (slug === "email-normalizer") { const [local, domain] = clean.toLowerCase().split("@"); return { text: domain === "gmail.com" ? `${local.split("+")[0].replace(/\./g, "")}@gmail.com` : `${local ?? ""}@${domain ?? ""}` }; }
    if (slug === "html-to-plain-text") return { text: new DOMParser().parseFromString(input, "text/html").body.textContent ?? "" };
    if (slug === "markdown-to-html" || slug === "markdown-editor") { const html = DOMPurify.sanitize(marked.parse(input) as string, { USE_PROFILES: { html: true } }); return { text: html, html, label: t("tool.result.preview") }; }
    // Hash tools are async (Web Crypto). The sync entry returns a placeholder;
    // `ToolWorkspace` resolves the real value via `runHashText` / `runHashFile`.
    if (slug === "hash-generator" || slug === "file-hash-calculator") return { text: t("tool.result.needsInput"), label: t("tool.hash.note") };
    if (slug === "uuid-generator") return { text: Array.from({ length: option === "bulk" ? 10 : 1 }, () => uuidv4()).join("\n") };
    if (slug === "ulid-generator") return { text: ulid() };
    if (slug === "nanoid-generator") return { text: nanoid() };
    if (slug === "secure-token-generator") { const bytes = crypto.getRandomValues(new Uint8Array(32)); return { text: Array.from(bytes).map((value) => value.toString(16).padStart(2, "0")).join("") }; }
    if (slug === "jwt-decoder-debugger") {
      const [header, payload, signature] = clean.split(".");
      if (!header || !payload) throw new ToolError("tool.error.jwt");
      const decode = (section: string) => {
        const normalized = section.replace(/-/g, "+").replace(/_/g, "/");
        try {
          return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")), (char) => char.charCodeAt(0))));
        } catch {
          throw new ToolError("tool.error.jwt");
        }
      };
      return { text: JSON.stringify({ header: decode(header), payload: decode(payload), signature: signature ? t("tool.result.signaturePresent") : t("tool.result.signatureMissing") }, null, 2) };
    }
    if (slug === "json-formatter-validator") return { text: JSON.stringify(JSON.parse(input), null, 2) };
    if (slug === "json-minifier") return { text: JSON.stringify(JSON.parse(input)) };
    if (slug === "yaml-formatter") return { text: yaml.dump(yaml.load(input)) };
    if (slug === "toml-formatter") return { text: JSON.stringify(toml.parse(input), null, 2) };
    if (slug === "xml-formatter") { const parsed = new XMLParser({ ignoreAttributes: false }).parse(input); return { text: new XMLBuilder({ format: true, ignoreAttributes: false }).build(parsed) }; }
    if (slug === "yaml-json-toml-xml-converter") { const parsed = clean.startsWith("{") ? JSON.parse(input) : yaml.load(input); return { text: option === "xml" ? new XMLBuilder({ format: true }).build(parsed) : option === "yaml" ? yaml.dump(parsed) : JSON.stringify(parsed, null, 2) }; }
    if (slug === "sql-formatter") return { text: formatSql(input) };
    if (slug === "url-parser") { const url = new URL(clean); return { text: JSON.stringify({ protocol: url.protocol, host: url.host, hostname: url.hostname, port: url.port, pathname: url.pathname, parameters: Object.fromEntries(url.searchParams), hash: url.hash }, null, 2) }; }
    if (slug === "keyword-density-analyzer") { const tokens = words(input); const counts = tokens.reduce<Record<string, number>>((memo, word) => { const key = word.toLowerCase(); memo[key] = (memo[key] ?? 0) + 1; return memo; }, {}); return { text: JSON.stringify(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([word, count]) => ({ word, count, percentage: `${((count / Math.max(tokens.length, 1)) * 100).toFixed(1)}%` })), null, 2) }; }
    if (slug === "chmod-calculator") { if (!/^[0-7]{3,4}$/.test(clean)) throw new ToolError("tool.error.octal"); const parts = clean.slice(-3).split("").map((digit) => [Number(digit) & 4 ? "r" : "-", Number(digit) & 2 ? "w" : "-", Number(digit) & 1 ? "x" : "-"].join("")); return { text: JSON.stringify({ octal: clean, symbolic: `${parts[0]}${parts[1]}${parts[2]}`, decimal: Number.parseInt(clean, 8) }, null, 2) }; }
    if (slug === "math-evaluator" || slug === "basic-calculator" || slug === "scientific-calculator") {
      // Parsed by a dedicated arithmetic evaluator; user input is never executed.
      try {
        return { text: formatNumber(evaluateExpression(clean)) };
      } catch (error) {
        if (error instanceof MathError) throw new ToolError(`tool.error.math.${error.code}` as TranslationKey);
        throw error;
      }
    }
    if (slug === "percentage-calculator") { const [x, y] = clean.split(/[ ,]+/).map(Number); if (!Number.isFinite(x) || !Number.isFinite(y)) throw new ToolError("tool.error.number"); return { text: JSON.stringify({ [`${x}% of ${y}`]: (x / 100) * y, [`${x} is what % of ${y}`]: y ? (x / y) * 100 : null, change: y ? ((x - y) / y) * 100 : null }, null, 2) }; }
    if (slug === "bmi-calculator") { const [weight, height] = clean.split(/[ ,]+/).map(Number); if (!Number.isFinite(weight) || !Number.isFinite(height) || height <= 0) throw new ToolError("tool.error.number"); const bmi = weight / (height / 100) ** 2; return { text: JSON.stringify({ bmi: Number(bmi.toFixed(1)), status: bmi < 18.5 ? t("tool.bmi.underweight") : bmi < 25 ? t("tool.bmi.healthy") : bmi < 30 ? t("tool.bmi.overweight") : t("tool.bmi.obese") }, null, 2) }; }
    if (slug === "random-number-generator") { const parsed = clean.split(/[ ,]+/).filter(Boolean).map(Number); if (parsed.some((value) => !Number.isFinite(value))) throw new ToolError("tool.error.number"); const [low = 1, high = 100] = parsed; const min = Math.min(low, high); const span = Math.abs(high - low) + 1; return { text: Array.from({ length: option === "bulk" ? 10 : 1 }, () => min + randomInt(span)).join("\n") }; }
    if (slug === "random-string-generator") { const length = Math.min(Math.max(Number(clean) || 16, 1), 512); const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; return { text: Array.from({ length }, () => chars[randomInt(chars.length)]).join("") }; }
    if (slug === "email-validator") return { text: JSON.stringify({ email: clean, valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) }, null, 2) };
    if (slug === "hex-rgb-hsl-hsv-converter" || slug === "color-picker") { const hex = clean.replace("#", ""); if (!/^[0-9a-f]{6}$/i.test(hex)) throw new ToolError("tool.error.hex"); const [r, g, b] = [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16)); return { text: JSON.stringify({ hex: `#${hex.toUpperCase()}`, rgb: `rgb(${r}, ${g}, ${b})`, decimal: { r, g, b } }, null, 2) }; }
    if (slug === "notes-pad") return { text: input, label: t("tool.result.notesHint") };
    return { text: "", unavailable: true };
  } catch (error) {
    if (error instanceof ToolError) return { text: t(error.key), error: true };
    return { text: t("tool.error.generic"), error: true };
  }
}
