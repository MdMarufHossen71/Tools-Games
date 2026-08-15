const encodeBase64 = (value: string) => btoa(String.fromCharCode(...Array.from(new TextEncoder().encode(value))));
const decodeBase64 = (value: string) => new TextDecoder().decode(Uint8Array.from(atob(value), (char) => char.charCodeAt(0)));

const randomString = (length: number, alphabet: string) => Array.from(crypto.getRandomValues(new Uint32Array(length)), (value) => alphabet[value % alphabet.length]).join("");

const decodeEntities = (value: string) => value.replace(/&(amp|lt|gt|quot|#39);/g, (match, entity: string) => ({ amp: "&", lt: "<", gt: ">", quot: "\"", "#39": "'" }[entity] ?? match));
const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const emailExpression = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const cleanEmailPart = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");

const morse: Record<string, string> = { a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----." };

export type ToolResult = { value: string; error?: boolean };

/**
 * Concrete browser-local processors implemented by `runTool`.
 * Catalogue entries outside this list intentionally use the shared private workspace
 * until a dedicated processor is added; this avoids representing a passthrough as a
 * completed specialized transformation.
 */
export const localOperationSlugs = [
  "word-counter", "case-converter", "reverse-text", "sort-lines", "shuffle-lines", "remove-extra-spaces", "remove-empty-lines", "remove-duplicates", "add-text-to-lines", "text-repeater", "text-to-binary", "binary-to-text", "url-extractor", "line-numberer", "sentence-counter", "find-replace", "slug-generator", "reading-time", "gmail-alias-variations", "email-syntax-advisor", "email-extractor", "email-pattern-builder", "mailto-link-builder", "email-size-estimator", "html-to-text", "email-signature-builder", "spam-wording-advisor", "subject-line-advisor",
  "base64-encode", "base64-decode", "image-to-base64", "file-to-base64", "pdf-metadata", "url-encode", "url-decode", "html-entity-encode", "html-entity-decode", "rot13", "morse-code", "password-generator", "random-string", "uuid-generator", "nanoid-generator", "random-number", "number-sorter", "average-calculator", "binary-converter", "decimal-converter",
  "json-formatter", "json-minifier", "json-validator", "csv-converter", "html-beautifier", "css-minifier", "regex-tester", "email-validator", "url-parser", "query-string-parser", "json-escape", "calculator", "percentage-calculator", "hex-to-rgb", "random-color", "invert-color", "gradient-generator", "unix-timestamp", "date-difference", "file-size-converter", "file-type-identifier", "fancy-text", "coin-flipper", "dice-roller",
] as const;

export function runTool(slug: string, input: string, nonce = 0): ToolResult {
  try {
    switch (slug) {
      case "word-counter": {
        const words = input.trim() ? input.trim().split(/\s+/).length : 0;
        return { value: JSON.stringify({ words, characters: input.length, charactersWithoutSpaces: input.replace(/\s/g, "").length, lines: input ? input.split(/\n/).length : 0 }, null, 2) };
      }
      case "case-converter": return { value: [input.toUpperCase(), input.toLowerCase(), input.replace(/\b\w/g, char => char.toUpperCase()), input.replace(/\s+/g, "-").toLowerCase()].join("\n") };
      case "reverse-text": return { value: Array.from(input).reverse().join("") };
      case "sort-lines": return { value: input.split("\n").sort((a, b) => a.localeCompare(b)).join("\n") };
      case "shuffle-lines": return { value: input.split("\n").map(value => ({ value, order: Math.random() })).sort((a, b) => a.order - b.order).map(item => item.value).join("\n") };
      case "remove-extra-spaces": return { value: input.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim() };
      case "remove-empty-lines": return { value: input.split("\n").filter(line => line.trim()).join("\n") };
      case "remove-duplicates": return { value: Array.from(new Set(input.split("\n"))).join("\n") };
      case "add-text-to-lines": { const [prefix = "", ...lines] = input.split("\n"); return { value: lines.map(line => `${prefix}${line}`).join("\n") }; }
      case "text-repeater": { const [count = 2, ...text] = input.split("\n"); return { value: Array.from({ length: Math.min(Math.max(Number(count) || 2, 1), 100) }, () => text.join("\n")).join("\n") }; }
      case "text-to-binary": return { value: Array.from(input).map(character => character.codePointAt(0)!.toString(2).padStart(8, "0")).join(" ") };
      case "binary-to-text": return { value: input.trim().split(/\s+/).map(value => /^[01]{1,21}$/.test(value) ? String.fromCodePoint(parseInt(value, 2)) : "").join("") };
      case "url-extractor": return { value: Array.from(new Set(input.match(/https?:\/\/[^\s<>"]+/g) ?? [])).join("\n") };
      case "line-numberer": return { value: input.split("\n").map((line, index) => `${index + 1}. ${line}`).join("\n") };
      case "sentence-counter": return { value: String((input.trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).filter(Boolean).length) };
      case "find-replace": { const [find = "", replacement = "", ...text] = input.split("\n"); return { value: text.join("\n").split(find).join(replacement) }; }
      case "slug-generator": return { value: input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "") };
      case "reading-time": return { value: String(Math.max(1, Math.ceil((input.trim() ? input.trim().split(/\s+/).length : 0) / 200))) };
      case "gmail-alias-variations": {
        const value = input.trim().toLowerCase();
        const [local, domain] = value.split("@");
        if (!local || !/^(gmail\.com|googlemail\.com)$/i.test(domain ?? "") || !/^[a-z0-9.]+$/.test(local)) throw new Error();
        const clean = local.replace(/\./g, "");
        if (clean.length < 2) throw new Error();
        const variants = new Set([`${clean}@${domain}`, `${clean.slice(0, 1)}.${clean.slice(1)}@${domain}`, `${clean.slice(0, 2)}.${clean.slice(2)}@${domain}`, `${clean}+personal@${domain}`, `${clean}+newsletters@${domain}`, `${clean}+receipts@${domain}`, `${clean}+shopping@${domain}`]);
        return { value: `Aliases only — these are not new email accounts.\n${Array.from(variants).slice(0, 7).join("\n")}` };
      }
      case "email-syntax-advisor": {
        const value = input.trim().toLowerCase(); const [local = "", domain = ""] = value.split("@");
        const flags = [!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && "Use a standard local@domain.tld format", local.length > 64 && "Local part is longer than 64 characters", domain.length > 253 && "Domain is longer than 253 characters", /\.\./.test(value) && "Avoid consecutive dots", /@gmail\.con$/.test(value) && "Did you mean gmail.com?"].filter(Boolean);
        return { value: JSON.stringify({ syntax: flags.length ? "needs review" : "format looks valid", localPart: local || null, domain: domain || null, warnings: flags, limitation: "Local format checks only; this does not verify that a mailbox exists or can receive mail." }, null, 2) };
      }
      case "email-extractor": return { value: Array.from(new Set(input.match(emailExpression) ?? [])).slice(0, 100).join("\n") };
      case "email-pattern-builder": {
        const [firstRaw = "", lastRaw = "", domainRaw = ""] = input.split(/[\n,]/); const first = cleanEmailPart(firstRaw); const last = cleanEmailPart(lastRaw); const domain = domainRaw.trim().toLowerCase().replace(/^@/, "");
        if (!first || !last || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) throw new Error();
        const candidates = [`${first}`, `${last}`, `${first}${last}`, `${first}.${last}`, `${first[0]}${last}`, `${first[0]}.${last}`, `${first}${last[0]}`, `${first}.${last[0]}`, `${last}${first}`, `${last}.${first}`, `${last}${first[0]}`, `${last}.${first[0]}`].map(local => `${local}@${domain}`);
        return { value: `Unverified naming patterns — do not treat these as confirmed contact addresses.\n${Array.from(new Set(candidates)).join("\n")}` };
      }
      case "mailto-link-builder": { const [to = "", subject = "", ...body] = input.split("\n"); const recipients = to.split(/[;,\s]+/).filter(Boolean); if (!recipients.every(value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) throw new Error(); const params = new URLSearchParams(); if (subject) params.set("subject", subject); if (body.join("\n")) params.set("body", body.join("\n")); return { value: `mailto:${recipients.join(",")}${params.size ? `?${params.toString()}` : ""}` }; }
      case "email-size-estimator": { const bytes = new TextEncoder().encode(input).length; return { value: JSON.stringify({ characters: input.length, utf8Bytes: bytes, estimatedBase64Bytes: Math.ceil(bytes / 3) * 4, limitation: "Text-body estimate only; transport and attachment overhead can vary." }, null, 2) }; }
      case "html-to-text": return { value: decodeEntities(input.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()) };
      case "email-signature-builder": { const [name = "", title = "", company = "", phone = "", website = ""] = input.split("\n").map(value => value.trim()); if (!name) throw new Error(); const text = [name, [title, company].filter(Boolean).join(" · "), phone, website].filter(Boolean).join("\n"); const html = [escapeHtml(name), escapeHtml([title, company].filter(Boolean).join(" · ")), escapeHtml(phone), escapeHtml(website)].filter(Boolean).join("<br>"); return { value: `${text}\n\nHTML:\n${html}` }; }
      case "spam-wording-advisor": { const words = ["act now", "click here", "free", "guarantee", "urgent", "winner", "100%", "risk-free", "limited time", "buy now"]; const lower = input.toLowerCase(); const matches = words.filter(word => lower.includes(word)); return { value: JSON.stringify({ flaggedPhrases: matches, advisory: matches.length ? "Review the flagged wording and make claims specific and supportable." : "No phrases from this small local advisory list were found.", limitation: "This local heuristic cannot predict spam-folder placement, reputation, or deliverability." }, null, 2) }; }
      case "subject-line-advisor": { const subject = input.trim(); const flags = [subject.length === 0 && "Add a subject line", subject.length > 60 && "Consider a shorter mobile-friendly subject", /^[A-Z\s\d!?.]+$/.test(subject) && subject.length > 2 && "Avoid all-capital wording", (subject.match(/!/g) ?? []).length > 1 && "Limit repeated exclamation marks"].filter(Boolean); return { value: JSON.stringify({ characters: subject.length, guidance: flags.length ? flags : ["Length and punctuation look balanced."], limitation: "Editorial guidance only; this cannot predict open rates or inbox placement." }, null, 2) }; }
      case "base64-encode": return { value: encodeBase64(input) };
      case "base64-decode": return { value: decodeBase64(input.trim()) };
      case "image-to-base64":
      case "file-to-base64": return { value: input.includes(",") ? input.slice(input.indexOf(",") + 1) : input };
      case "pdf-metadata": {
        const isPdf = input.startsWith("data:application/pdf") || input.startsWith("JVBERi");
        return { value: isPdf ? "PDF document detected in browser memory" : "Select a PDF file or paste a PDF data URL" };
      }
      case "url-encode": return { value: encodeURIComponent(input) };
      case "url-decode": return { value: decodeURIComponent(input) };
      case "html-entity-encode": return { value: input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;") };
      case "html-entity-decode": return { value: decodeEntities(input) };
      case "rot13": return { value: input.replace(/[a-z]/gi, character => String.fromCharCode((character <= "Z" ? 90 : 122) >= character.charCodeAt(0) + 13 ? character.charCodeAt(0) + 13 : character.charCodeAt(0) - 13)) };
      case "morse-code": return { value: input.toLowerCase().split("").map(character => character === " " ? "/" : morse[character] ?? character).join(" ") };
      case "password-generator": return { value: randomString(18, "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=") };
      case "random-string": return { value: randomString(Math.min(Math.max(Number(input) || 20, 1), 128), "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789") };
      case "uuid-generator": return { value: crypto.randomUUID() };
      case "nanoid-generator": return { value: randomString(21, "_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") };
      case "random-number": { const [min = 1, max = 100] = input.split(/[,\s]+/).map(Number); return { value: String(Math.floor(Math.random() * (Math.max(min, max) - Math.min(min, max) + 1)) + Math.min(min, max)) }; }
      case "number-sorter": return { value: input.split(/[,\s]+/).map(Number).filter(Number.isFinite).sort((a, b) => a - b).join("\n") };
      case "average-calculator": { const values = input.split(/[,\s]+/).map(Number).filter(Number.isFinite); return { value: values.length ? String(values.reduce((sum, value) => sum + value, 0) / values.length) : "0" }; }
      case "binary-converter": { const value = input.trim(); if (!/^[01]+$/.test(value)) throw new Error(); return { value: String(parseInt(value, 2)) }; }
      case "decimal-converter": { const value = Number(input); if (!Number.isFinite(value)) throw new Error(); return { value: JSON.stringify({ binary: value.toString(2), octal: value.toString(8), hexadecimal: value.toString(16).toUpperCase() }, null, 2) }; }
      case "json-formatter": return { value: JSON.stringify(JSON.parse(input), null, 2) };
      case "json-minifier": return { value: JSON.stringify(JSON.parse(input)) };
      case "json-validator": { JSON.parse(input); return { value: "✓" }; }
      case "csv-converter": { const rows = input.split("\n").filter(Boolean).map(row => row.split(",").map(value => value.trim())); const [headers = [], ...body] = rows; return { value: JSON.stringify(body.map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))), null, 2) }; }
      case "html-beautifier": return { value: input.replace(/>\s*</g, ">\n<").split("\n").map((line, index, all) => `${"  ".repeat(Math.max(0, index - all.slice(0, index).filter(item => /^<\//.test(item)).length))}${line.trim()}`).join("\n") };
      case "css-minifier": return { value: input.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{}:;,])\s*/g, "$1").trim() };
      case "regex-tester": { const [pattern = "", sample = ""] = input.split("\n", 2); return { value: JSON.stringify({ matches: Array.from(sample.matchAll(new RegExp(pattern, "g"))).map(match => ({ match: match[0], index: match.index })) }, null, 2) }; }
      case "email-validator": return { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim()) ? "✓" : "✕" };
      case "url-parser": { const url = new URL(input.trim()); return { value: JSON.stringify({ protocol: url.protocol, host: url.host, hostname: url.hostname, pathname: url.pathname, query: url.search, hash: url.hash }, null, 2) }; }
      case "query-string-parser": { const raw = input.trim(); const source = raw.startsWith("?") ? raw.slice(1) : raw.includes("://") ? new URL(raw).search.slice(1) : raw; return { value: JSON.stringify(Object.fromEntries(new URLSearchParams(source)), null, 2) }; }
      case "json-escape": return { value: JSON.stringify(input) };
      case "calculator": { if (!/^[\d+\-*/%().\s]+$/.test(input)) throw new Error(); const result = Function(`"use strict"; return (${input})`)(); return { value: String(result) }; }
      case "percentage-calculator": { const [part = 0, total = 100] = input.split(/[,\s]+/).map(Number); return { value: String(total ? (part / total) * 100 : 0) }; }
      case "hex-to-rgb": { const hex = input.trim().replace("#", ""); if (!/^[0-9a-f]{6}$/i.test(hex)) throw new Error(); return { value: `${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)}` }; }
      case "random-color": return { value: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0").toUpperCase()}` };
      case "invert-color": { const hex = input.trim().replace("#", ""); if (!/^[0-9a-f]{6}$/i.test(hex)) throw new Error(); return { value: `#${(0xffffff ^ parseInt(hex, 16)).toString(16).padStart(6, "0").toUpperCase()}` }; }
      case "gradient-generator": return { value: `linear-gradient(${(nonce * 47) % 360}deg, #6D5DFB 0%, #13C4A3 100%)` };
      case "unix-timestamp": { const timestamp = Number(input); const date = input.trim() && Number.isFinite(timestamp) ? new Date(timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp) : new Date(); return { value: JSON.stringify({ iso: date.toISOString(), unixSeconds: Math.floor(date.getTime() / 1000), unixMilliseconds: date.getTime() }, null, 2) }; }
      case "date-difference": { const [start, end] = input.split(/[,\n]/).map(value => new Date(value.trim())); if (Number.isNaN(start?.getTime()) || Number.isNaN(end?.getTime())) throw new Error(); return { value: String(Math.round(Math.abs(end.getTime() - start.getTime()) / 86_400_000)) }; }
      case "file-size-converter": { const bytes = Number(input); if (!Number.isFinite(bytes) || bytes < 0) throw new Error(); return { value: JSON.stringify({ bytes, kilobytes: bytes / 1024, megabytes: bytes / 1048576, gigabytes: bytes / 1073741824 }, null, 2) }; }
      case "file-type-identifier": { const signature = input.trim().replace(/\s/g, "").toLowerCase(); const types: Record<string, string> = { "89504e47": "PNG image", "ffd8ff": "JPEG image", "25504446": "PDF document", "504b0304": "ZIP archive" }; return { value: Object.entries(types).find(([key]) => signature.startsWith(key))?.[1] ?? "Unknown signature" }; }
      case "fancy-text": return { value: Array.from(input).map(char => /[A-Za-z]/.test(char) ? String.fromCodePoint(char.toUpperCase().charCodeAt(0) + 0x1d400 - 65) : char).join("") };
      case "coin-flipper": return { value: crypto.getRandomValues(new Uint8Array(1))[0] % 2 ? "Heads" : "Tails" };
      case "dice-roller": return { value: String((crypto.getRandomValues(new Uint8Array(1))[0] % 6) + 1) };
      default: return { value: input };
    }
  } catch {
    return { value: "", error: true };
  }
}
