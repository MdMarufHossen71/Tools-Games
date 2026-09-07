import { describe, expect, it } from "vitest";
import { runTool, type ToolTranslate } from "../toolOperations";

const t = ((key: string) => key) as ToolTranslate;
const run = (slug: string, fields: Record<string, string>, input = "") =>
  runTool(slug, input, "default", t, { fields });

describe("Wave 1 text tools", () => {
  it("repeats, finds/replaces, filters", async () => {
    expect((await run("text-repeater", { text: "ha", count: "3", separator: "-" })).text).toBe("ha-ha-ha");
    expect((await run("find-replace", { text: "a b a", find: "a", replace: "z" })).text).toBe("z b z");
    expect((await run("filter-lines", { text: "apple\nbanana", pattern: "app", mode: "keep" })).text).toBe("apple");
    expect((await run("filter-lines", { text: "apple\nbanana", pattern: "app", mode: "drop" })).text).toBe("banana");
  });

  it("edits lines, tabs, commas, splits and strips", async () => {
    expect((await run("add-text-to-each-line", { text: "a\nb", prefix: "- ", suffix: "!" })).text).toBe("- a!\n- b!");
    expect((await run("tabs-to-spaces", { text: "\tx", spaces: "2" })).text).toBe("  x");
    expect((await run("comma-inserter", { text: "1000000", mode: "comma" })).text).toBe("1,000,000");
    expect((await run("text-splitter", { text: "a, b", delimiter: "," })).text).toBe("a\nb");
    expect((await run("space-remover", { text: "a b\nc" })).text).toBe("abc");
    expect((await run("character-remover", { text: "a1!", mode: "nondigits" })).text).toBe("1");
  });

  it("obfuscates, censors, encodes and generates", async () => {
    expect((await run("string-obfuscator", { text: "abcdef", visible: "1" })).text).toBe("a••••f");
    expect((await run("text-censor", { text: "you are bad", words: "bad" })).text).toBe("you are b**");
    expect((await run("text-to-unicode", { text: "A" })).text).toBe("U+0041");
    expect((await run("numeronym-generator", { text: "localization" })).text).toBe("l10n");
    expect((await run("lorem-ipsum-generator", { paras: "2" })).text).toContain("Lorem ipsum");
    expect((await run("random-sentence-generator", { count: "2" })).text.split(".").filter(Boolean)).toHaveLength(2);
    expect((await run("regex-replacer", { text: "ab12", pattern: "\\d+", flags: "g", replacement: "#" })).text).toBe("ab#");
    const picker = await run("emoji-kaomoji-picker", { mode: "emoji" });
    expect(picker.table?.rows.length).toBeGreaterThan(0);
    const uni = await run("unicode-character-finder", { query: "", mode: "latin" });
    expect(uni.table?.rows.length).toBeGreaterThan(0);
  });
});

describe("Wave 1 math tools", () => {
  it("computes areas, ratios, trig and conversions", async () => {
    expect(JSON.parse((await run("area-calculator", { mode: "circle", a: "1", b: "0" })).text).area).toBeCloseTo(3.1416, 4);
    expect(JSON.parse((await run("rule-of-three", { a: "2", b: "5", c: "8" })).text)["2 : 5 = 8 : x"]).toBe(20);
    expect(JSON.parse((await run("trigonometry-calculator", { mode: "sin", angle: "30", unit: "deg" })).text)["sin(30°)"]).toBe(0.5);
    expect(JSON.parse((await run("radians-degrees-converter", { value: "180", mode: "torad" })).text).result).toBeCloseTo(Math.PI, 5);
    expect(JSON.parse((await run("tip-calculator", { bill: "100", percent: "10", people: "2" })).text).perPerson).toBe(55);
    expect(JSON.parse((await run("unit-converter", { value: "1", unit: "km-mi" })).text)["1 km"]).toBeCloseTo(0.621371, 5);
    expect(JSON.parse((await run("temperature-converter", { value: "0", mode: "c-f" })).text).result).toBe(32);
  });

  it("handles sequences, bases, words and loans", async () => {
    expect((await run("fibonacci-generator", { count: "6" })).text).toBe("0, 1, 1, 2, 3, 5");
    expect(JSON.parse((await run("prime-checker-generator", { n: "7", mode: "check" })).text).prime).toBe(true);
    expect(JSON.parse((await run("number-base-converter", { value: "ff", from: "16", to: "10" })).text).decimal).toBe(255);
    expect(JSON.parse((await run("binary-hex-octal-converter", { value: "1010", mode: "bin" })).text).hex).toBe("A");
    expect(JSON.parse((await run("roman-numeral-converter", { value: "2026", mode: "to-roman" })).text).roman).toBe("MMXXVI");
    expect(JSON.parse((await run("roman-numeral-converter", { value: "xiv", mode: "from-roman" })).text).number).toBe(14);
    expect((await run("number-to-words", { n: "42", mode: "en" })).text).toBe("forty-two");
    expect((await run("number-to-words", { n: "42", mode: "bn" })).text).toBe("বিয়াল্লিশ");
    expect(JSON.parse((await run("average-min-max", { text: "1 2 3" })).text).average).toBe(2);
    expect((await run("number-list-generator", { from: "1", to: "5", step: "2" })).text).toBe("1, 3, 5");
    expect(JSON.parse((await run("percentage-fraction-decimal", { value: "50%" })).text).decimal).toBe(0.5);
    expect(JSON.parse((await run("gpa-calculator", { text: "A 3\nB 3" })).text).gpa).toBe(3.5);
    expect(JSON.parse((await run("discount-calculator", { price: "200", percent: "25" })).text).payable).toBe(150);
    const emi = await run("loan-emi-calculator", { principal: "100000", rate: "12", months: "12" });
    expect(JSON.parse(emi.text).emi).toBeGreaterThan(8000);
    expect(emi.table?.head).toContain("EMI");
    expect(JSON.parse((await run("date-difference-calculator", { from: "2026-01-01", to: "2026-01-11" })).text).days).toBe(10);
    expect(JSON.parse((await run("bangla-calendar-converter", { date: "2026-04-14", mode: "to-bangla" })).text).month).toBe("বৈশাখ");
    expect(JSON.parse((await run("bangla-calendar-converter", { date: "2026-04-14", mode: "to-bangla" })).text).year).toBe(1433);
  });
});

describe("Wave 1 time tools", () => {
  it("computes dates, stamps and zones", async () => {
    expect(JSON.parse((await run("add-subtract-date", { date: "2026-01-01", days: "30" })).text).result).toBe("2026-01-31");
    expect(JSON.parse((await run("unix-timestamp-converter", { value: "0", mode: "to-date" })).text).iso).toContain("1970");
    expect(JSON.parse((await run("date-formatter", { date: "2026-04-14", mode: "iso" })).text).formatted).toBe("2026-04-14");
    expect(JSON.parse((await run("julian-date", { date: "2026-01-01" })).text).dayOfYear).toBe(1);
    expect(JSON.parse((await run("days-between-dates", { from: "2026-01-01", to: "2026-01-02" })).text).days).toBe(1);
    expect(JSON.parse((await run("working-days-calculator", { from: "2026-01-05", to: "2026-01-09", weekend: "sat-sun" })).text).workingDays).toBe(5);
    const tz = await run("timezone-converter", { time: "12:00", date: "2026-01-01", zone: "UTC" });
    expect(tz.error).toBeFalsy();
  });
});

describe("Wave 1 seo + misc tools", () => {
  it("builds templates and tables", async () => {
    expect((await run("htaccess-redirect-generator", { from: "/a", to: "https://x.com/b", mode: "301" })).text).toBe("Redirect 301 /a https://x.com/b");
    const entities = await run("html-entity-table", { query: "copy" });
    expect(entities.table?.rows.length).toBeGreaterThan(0);
    expect(JSON.parse((await run("seo-word-counter", { text: "one two three" })).text).words).toBe(3);
    const cards = await run("twitter-card-info", { query: "" });
    expect(cards.table?.rows.length).toBe(4);
  });

  it("computes novelty values", async () => {
    const age = await run("age-in-seconds", { dob: "2000-01-01" });
    expect(JSON.parse(age.text).days).toBeGreaterThan(9000);
    expect(JSON.parse((await run("dog-cat-years-converter", { age: "2", mode: "dog" })).text).petYears).toBe(24);
    expect(JSON.parse((await run("love-calculator", { a: "a", b: "b" })).text).score).toMatch(/%$/);
    expect(JSON.parse((await run("aspect-ratio-calculator", { w: "1920", h: "1080", nw: "1280" })).text).heightForNewWidth).toBe(720);
    expect(JSON.parse((await run("aspect-ratio-cropper", { w: "1920", h: "1080", ratio: "1:1" })).text).width).toBe(1080);
    expect(JSON.parse((await run("event-countdown", { date: "2099-01-01" })).text).past).toBe(false);
    const res = await run("screen-resolution-detector", {});
    // No `window` under node: the branch must fail gracefully, never throw.
    if (typeof window === "undefined") expect(res.error).toBe(true);
    else expect(JSON.parse(res.text).viewport).toBeDefined();
  });
});
