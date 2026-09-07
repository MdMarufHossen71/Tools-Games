/** SEO & web wave: templates, tables and honest fetch attempts. */
import { ToolError, field, type ToolRunner } from "@/lib/toolOperations";

const ENTITY_TABLE: Array<[string, string, string]> = [
  ["&", "&amp;", "AMPERSAND"], ["<", "&lt;", "LESS-THAN SIGN"], [">", "&gt;", "GREATER-THAN SIGN"],
  ["\"", "&quot;", "QUOTATION MARK"], ["'", "&#39;", "APOSTROPHE"], ["©", "&copy;", "COPYRIGHT SIGN"],
  ["®", "&reg;", "REGISTERED SIGN"], ["™", "&trade;", "TRADE MARK SIGN"], ["€", "&euro;", "EURO SIGN"],
  ["£", "&pound;", "POUND SIGN"], ["¥", "&yen;", "YEN SIGN"], ["§", "&sect;", "SECTION SIGN"],
  ["«", "&laquo;", "LEFT-POINTING DOUBLE ANGLE QUOTATION MARK"], ["»", "&raquo;", "RIGHT-POINTING DOUBLE ANGLE QUOTATION MARK"],
  ["–", "&ndash;", "EN DASH"], ["—", "&mdash;", "EM DASH"], ["…", "&hellip;", "HORIZONTAL ELLIPSIS"],
  ["•", "&bull;", "BULLET"], ["°", "&deg;", "DEGREE SIGN"], ["±", "&plusmn;", "PLUS-MINUS SIGN"],
  ["×", "&times;", "MULTIPLICATION SIGN"], ["÷", "&divide;", "DIVISION SIGN"], ["←", "&larr;", "LEFTWARDS ARROW"],
  ["↑", "&uarr;", "UPWARDS ARROW"], ["→", "&rarr;", "RIGHTWARDS ARROW"], ["↓", "&darr;", "DOWNWARDS ARROW"],
  ["↔", "&harr;", "LEFT RIGHT ARROW"], ["✓", "&check;", "CHECK MARK"], ["✔", "&heavy_check_mark;", "HEAVY CHECK MARK"],
  ["✗", "&cross;", "CROSS MARK"], ["★", "&star;", "BLACK STAR"], ["♥", "&hearts;", "BLACK HEART SUIT"],
  ["🔥", "&#128293;", "FIRE"], ["🎮", "&#127918;", "VIDEO GAME"], [" ", "&nbsp;", "NO-BREAK SPACE"],
  ["‌", "&zwnj;", "ZERO WIDTH NON-JOINER"], ["‍", "&zwj;", "ZERO WIDTH JOINER"],
];

const TWITTER_CARDS: Array<[string, string]> = [
  ["summary", "Title, description and thumbnail. The default card."],
  ["summary_large_image", "Large image preview. Best for articles and launches."],
  ["player", "Embedded audio/video player. Needs HTTPS media URLs."],
  ["app", "Mobile app install card with app-store deep links."],
];

export const runSeoTools: ToolRunner = async (slug, input, _option, _t, extra) => {
  const F = (key: string, fallback = "") => field(extra, key, fallback);

  if (slug === "htaccess-redirect-generator") {
    const from = F("from", "/old-page").trim() || "/old-page";
    const to = F("to", "https://example.com/new-page").trim();
    if (!to) throw new ToolError("tool.error.generic");
    const code = F("mode", "301") === "302" ? "302" : "301";
    return { text: `Redirect ${code} ${from} ${to}` };
  }
  if (slug === "html-entity-table") {
    const query = F("query").toLowerCase();
    const rows = ENTITY_TABLE.filter(([, entity, name]) => query === "" || entity.toLowerCase().includes(query) || name.toLowerCase().includes(query)).slice(0, 60);
    return {
      text: rows.map(([char, entity, name]) => `${char}  ${entity}  ${name}`).join("\n"),
      table: { head: ["Char", "Entity", "Name"], rows },
    };
  }
  if (slug === "seo-word-counter") {
    const text = F("text", input);
    const tokens = text.match(/[A-Za-z0-9ঀ-৿']+/g) ?? [];
    const sentences = text.split(/[.!?।]+/).filter((s) => s.trim()).length;
    return { text: JSON.stringify({ words: tokens.length, characters: text.length, sentences, readingMinutes: Number((tokens.length / 200).toFixed(2)) }, null, 2) };
  }
  if (slug === "twitter-card-info") {
    const query = F("query").toLowerCase();
    const rows = TWITTER_CARDS.filter(([name, desc]) => query === "" || name.includes(query) || desc.toLowerCase().includes(query)).map(([name, desc]) => [name, desc]);
    return {
      text: rows.map(([name, desc]) => `${name}: ${desc}`).join("\n"),
      table: { head: ["Card", "Use"], rows },
    };
  }
  if (slug === "website-text-extractor") {
    // Honest attempt: most sites block cross-origin reads, and the workspace
    // says so instead of pretending. Same-origin and CORS-open pages work.
    const url = F("url", "https://example.com").trim();
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new ToolError("tool.error.generic");
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new ToolError("tool.error.generic");
    let html: string;
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (!response.ok) throw new Error();
      html = await response.text();
    } catch {
      throw new ToolError("tool.error.generic");
    }
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 20000);
    return { text };
  }
  return null;
};
