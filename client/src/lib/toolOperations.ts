const encodeBase64 = (value: string) => btoa(String.fromCharCode(...Array.from(new TextEncoder().encode(value))));
const decodeBase64 = (value: string) => new TextDecoder().decode(Uint8Array.from(atob(value), (char) => char.charCodeAt(0)));

const randomString = (length: number, alphabet: string) => Array.from(crypto.getRandomValues(new Uint32Array(length)), (value) => alphabet[value % alphabet.length]).join("");

const morse: Record<string, string> = { a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----." };

export type ToolResult = { value: string; error?: boolean };

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
      case "slug-generator": return { value: input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "") };
      case "reading-time": return { value: String(Math.max(1, Math.ceil((input.trim() ? input.trim().split(/\s+/).length : 0) / 200))) };
      case "base64-encode": return { value: encodeBase64(input) };
      case "base64-decode": return { value: decodeBase64(input.trim()) };
      case "url-encode": return { value: encodeURIComponent(input) };
      case "url-decode": return { value: decodeURIComponent(input) };
      case "rot13": return { value: input.replace(/[a-z]/gi, character => String.fromCharCode((character <= "Z" ? 90 : 122) >= character.charCodeAt(0) + 13 ? character.charCodeAt(0) + 13 : character.charCodeAt(0) - 13)) };
      case "morse-code": return { value: input.toLowerCase().split("").map(character => character === " " ? "/" : morse[character] ?? character).join(" ") };
      case "password-generator": return { value: randomString(18, "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=") };
      case "random-string": return { value: randomString(Math.min(Math.max(Number(input) || 20, 1), 128), "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789") };
      case "uuid-generator": return { value: crypto.randomUUID() };
      case "nanoid-generator": return { value: randomString(21, "_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") };
      case "random-number": { const [min = 1, max = 100] = input.split(/[,\s]+/).map(Number); return { value: String(Math.floor(Math.random() * (Math.max(min, max) - Math.min(min, max) + 1)) + Math.min(min, max)) }; }
      case "decimal-converter": { const value = Number(input); if (!Number.isFinite(value)) throw new Error(); return { value: JSON.stringify({ binary: value.toString(2), octal: value.toString(8), hexadecimal: value.toString(16).toUpperCase() }, null, 2) }; }
      case "json-formatter": return { value: JSON.stringify(JSON.parse(input), null, 2) };
      case "json-minifier": return { value: JSON.stringify(JSON.parse(input)) };
      case "json-validator": { JSON.parse(input); return { value: "✓" }; }
      case "regex-tester": { const [pattern = "", sample = ""] = input.split("\n", 2); return { value: JSON.stringify({ matches: Array.from(sample.matchAll(new RegExp(pattern, "g"))).map(match => ({ match: match[0], index: match.index })) }, null, 2) }; }
      case "email-validator": return { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim()) ? "✓" : "✕" };
      case "calculator": { if (!/^[\d+\-*/%().\s]+$/.test(input)) throw new Error(); const result = Function(`"use strict"; return (${input})`)(); return { value: String(result) }; }
      case "percentage-calculator": { const [part = 0, total = 100] = input.split(/[,\s]+/).map(Number); return { value: String(total ? (part / total) * 100 : 0) }; }
      case "hex-to-rgb": { const hex = input.trim().replace("#", ""); if (!/^[0-9a-f]{6}$/i.test(hex)) throw new Error(); return { value: `${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)}` }; }
      case "random-color": return { value: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0").toUpperCase()}` };
      case "gradient-generator": return { value: `linear-gradient(${(nonce * 47) % 360}deg, #6D5DFB 0%, #13C4A3 100%)` };
      case "unix-timestamp": { const timestamp = Number(input); const date = input.trim() && Number.isFinite(timestamp) ? new Date(timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp) : new Date(); return { value: JSON.stringify({ iso: date.toISOString(), unixSeconds: Math.floor(date.getTime() / 1000), unixMilliseconds: date.getTime() }, null, 2) }; }
      case "date-difference": { const [start, end] = input.split(/[,\n]/).map(value => new Date(value.trim())); if (Number.isNaN(start?.getTime()) || Number.isNaN(end?.getTime())) throw new Error(); return { value: String(Math.round(Math.abs(end.getTime() - start.getTime()) / 86_400_000)) }; }
      default: return { value: input };
    }
  } catch {
    return { value: "", error: true };
  }
}
