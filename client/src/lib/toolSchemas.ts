/**
 * Per-tool input schemas for the workbench.
 *
 * A tool with no entry here gets the classic single textarea. A tool with an
 * entry renders a small form instead: named fields the branch reads by key,
 * plus an optional file picker and a one-click example. Labels are bilingual
 * inline pairs — field names are content (like tool names), so they live with
 * the schema rather than in the translation dictionary.
 */
import type { TranslationKey } from "@/i18n/translations";

export type FieldType = "text" | "number" | "select" | "checkbox" | "color" | "date" | "textarea";

export type Bilingual = { en: string; bn: string };

export type Field = {
  key: string;
  type: FieldType;
  label: Bilingual;
  default?: string;
  placeholder?: string;
  /** For `select`: value + bilingual label per option. */
  options?: Array<{ value: string; label: Bilingual }>;
  /** For `number`: passed straight to the input. */
  min?: string;
  max?: string;
  step?: string;
};

export type ToolSchema = {
  /** Named fields rendered as a form. Empty array = classic textarea. */
  fields: Field[];
  /** `accept` attribute when the tool takes files; implies the picker UI. */
  accept?: string;
  /** Allow picking several files (default single). */
  multiple?: boolean;
  /** Prefills the form or textarea. */
  example?: { text?: string; fields?: Record<string, string> };
  /** Short hint under the form; already localized at the call site. */
  hintKey?: TranslationKey;
};

const t = (en: string, bn: string): Bilingual => ({ en, bn });

const MODE_FIELD = (options: Array<{ value: string; en: string; bn: string }>, def: string): Field => ({
  key: "mode",
  type: "select",
  label: t("Mode", "মোড"),
  default: def,
  options: options.map((o) => ({ value: o.value, label: t(o.en, o.bn) })),
});

const schemas: Record<string, ToolSchema> = {
  // -- Text & String -------------------------------------------------------
  "text-repeater": {
    fields: [
      { key: "text", type: "textarea", label: t("Text", "টেক্সট"), default: "ha" },
      { key: "count", type: "number", label: t("Times", "বার"), default: "3", min: "1", max: "1000" },
      { key: "separator", type: "text", label: t("Separator", "বিভাজক"), default: "\n" },
    ],
    example: { fields: { text: "ha", count: "3", separator: "\n" } },
  },
  "find-replace": {
    fields: [
      { key: "text", type: "textarea", label: t("Text", "টেক্সট"), default: "hello world" },
      { key: "find", type: "text", label: t("Find", "খুঁজুন"), default: "world" },
      { key: "replace", type: "text", label: t("Replace with", "বদলে দিন"), default: "বাংলাদেশ" },
    ],
    example: { fields: { text: "hello world", find: "world", replace: "বাংলাদেশ" } },
  },
  "filter-lines": {
    fields: [
      { key: "text", type: "textarea", label: t("Text", "টেক্সট"), default: "apple\nbanana\navocado" },
      { key: "pattern", type: "text", label: t("Contains", "যাতে আছে"), default: "av" },
      MODE_FIELD(
        [
          { value: "keep", en: "Keep matching", bn: "মিল রেখে দিন" },
          { value: "drop", en: "Remove matching", bn: "মিল মুছে দিন" },
        ],
        "keep",
      ),
    ],
    example: { fields: { pattern: "av", mode: "keep" } },
  },
  "add-text-to-each-line": {
    fields: [
      { key: "text", type: "textarea", label: t("Text", "টেক্সট"), default: "one\ntwo" },
      { key: "prefix", type: "text", label: t("Prefix", "আগে যোগ"), default: "- " },
      { key: "suffix", type: "text", label: t("Suffix", "পরে যোগ"), default: "" },
    ],
    example: { fields: { prefix: "- " } },
  },
  "tabs-to-spaces": {
    fields: [
      { key: "text", type: "textarea", label: t("Text", "টেক্সট"), default: "\tindented" },
      { key: "spaces", type: "number", label: t("Spaces per tab", "প্রতি ট্যাবে স্পেস"), default: "4", min: "1", max: "16" },
    ],
    example: { fields: { spaces: "4" } },
  },
  "comma-inserter": {
    fields: [
      { key: "text", type: "textarea", label: t("Text", "টেক্সট"), default: "1000000" },
      MODE_FIELD(
        [
          { value: "comma", en: "Thousands comma", bn: "হাজার কমা" },
          { value: "lines", en: "Join lines with comma", bn: "লাইন কমায় জোড়া" },
        ],
        "comma",
      ),
    ],
    example: { fields: { mode: "comma" } },
  },
  "text-splitter": {
    fields: [
      { key: "text", type: "textarea", label: t("Text", "টেক্সট"), default: "a,b,c" },
      { key: "delimiter", type: "text", label: t("Delimiter", "বিভাজক"), default: "," },
    ],
    example: { fields: { delimiter: "," } },
  },
  "space-remover": {
    fields: [{ key: "text", type: "textarea", label: t("Text", "টেক্সট"), default: "hello world" }],
    example: {},
  },
  "character-remover": {
    fields: [
      { key: "text", type: "textarea", label: t("Text", "টেক্সট"), default: "Hello 123!" },
      MODE_FIELD(
        [
          { value: "nondigits", en: "Keep digits only", bn: "শুধু সংখ্যা" },
          { value: "nonletters", en: "Keep letters only", bn: "শুধু অক্ষর" },
          { value: "punct", en: "Remove punctuation", bn: "যতিচিহ্ন মুছুন" },
          { value: "digits", en: "Remove digits", bn: "সংখ্যা মুছুন" },
        ],
        "nondigits",
      ),
    ],
    example: { fields: { mode: "nondigits" } },
  },
  "string-obfuscator": {
    fields: [
      { key: "text", type: "textarea", label: t("Text", "টেক্সট"), default: "hello@example.com" },
      { key: "visible", type: "number", label: t("Visible chars", "দৃশ্যমান অক্ষর"), default: "2", min: "0", max: "20" },
    ],
    example: { fields: { visible: "2" } },
  },
  "text-censor": {
    fields: [
      { key: "text", type: "textarea", label: t("Text", "টেক্সট"), default: "this is bad and ugly" },
      { key: "words", type: "text", label: t("Words (comma separated)", "শব্দ (কমায়)"), default: "bad, ugly" },
    ],
    example: { fields: { words: "bad, ugly" } },
  },
  "text-to-unicode": {
    fields: [{ key: "text", type: "textarea", label: t("Text", "টেক্সট"), default: "Hi ক" }],
    example: {},
  },
  "zalgo-text-generator": {
    fields: [
      { key: "text", type: "textarea", label: t("Text", "টেক্সট"), default: "spooky" },
      MODE_FIELD(
        [
          { value: "mini", en: "Mini", bn: "হালকা" },
          { value: "normal", en: "Normal", bn: "সাধারণ" },
          { value: "maxi", en: "Maxi", bn: "ভারী" },
        ],
        "normal",
      ),
    ],
    example: { fields: { mode: "normal" } },
  },
  "numeronym-generator": {
    fields: [{ key: "text", type: "textarea", label: t("Text", "টেক্সট"), default: "localization internationalization" }],
    example: {},
  },
  "lorem-ipsum-generator": {
    fields: [{ key: "paras", type: "number", label: t("Paragraphs", "অনুচ্ছেদ"), default: "3", min: "1", max: "20" }],
    example: { fields: { paras: "3" } },
  },
  "random-sentence-generator": {
    fields: [{ key: "count", type: "number", label: t("Sentences", "বাক্য"), default: "3", min: "1", max: "50" }],
    example: { fields: { count: "3" } },
  },
  "regex-replacer": {
    fields: [
      { key: "text", type: "textarea", label: t("Text", "টেক্সট"), default: "Call 01711-223344 now" },
      { key: "pattern", type: "text", label: t("Pattern", "প্যাটার্ন"), default: "\\d[\\d-]*\\d" },
      { key: "flags", type: "text", label: t("Flags", "ফ্ল্যাগ"), default: "g" },
      { key: "replacement", type: "text", label: t("Replacement ($1…)", "প্রতিস্থাপন"), default: "[phone]" },
    ],
    example: { fields: { pattern: "\\d[\\d-]*\\d", flags: "g", replacement: "[phone]" } },
  },
  "emoji-kaomoji-picker": {
    fields: [
      MODE_FIELD(
        [
          { value: "emoji", en: "Emoji", bn: "ইমোজি" },
          { value: "kaomoji", en: "Kaomoji", bn: "কাওমোজি" },
        ],
        "emoji",
      ),
    ],
    example: { fields: { mode: "emoji" } },
  },
  "unicode-character-finder": {
    fields: [
      { key: "query", type: "text", label: t("Search", "খুঁজুন"), default: "bengali" },
      MODE_FIELD(
        [
          { value: "bengali", en: "Bengali block", bn: "বাংলা ব্লক" },
          { value: "latin", en: "Basic Latin symbols", bn: "ল্যাটিন চিহ্ন" },
          { value: "arrows", en: "Arrows", bn: "তীর" },
        ],
        "bengali",
      ),
    ],
    example: { fields: { query: "", mode: "bengali" } },
  },

  // -- Math & calculators --------------------------------------------------
  "area-calculator": {
    fields: [
      MODE_FIELD(
        [
          { value: "rect", en: "Rectangle", bn: "আয়তক্ষেত্র" },
          { value: "circle", en: "Circle", bn: "বৃত্ত" },
          { value: "triangle", en: "Triangle", bn: "ত্রিভুজ" },
        ],
        "rect",
      ),
      { key: "a", type: "number", label: t("Width / radius / base", "প্রস্থ / ব্যাসার্ধ / ভূমি"), default: "10" },
      { key: "b", type: "number", label: t("Height (if needed)", "উচ্চতা (লাগলে)"), default: "5" },
    ],
    example: { fields: { mode: "rect", a: "10", b: "5" } },
  },
  "rule-of-three": {
    fields: [
      { key: "a", type: "number", label: t("A", "ক"), default: "2" },
      { key: "b", type: "number", label: t("B", "খ"), default: "5" },
      { key: "c", type: "number", label: t("C", "গ"), default: "8" },
    ],
    example: { fields: { a: "2", b: "5", c: "8" } },
  },
  "trigonometry-calculator": {
    fields: [
      MODE_FIELD(
        [
          { value: "sin", en: "sin", bn: "sin" },
          { value: "cos", en: "cos", bn: "cos" },
          { value: "tan", en: "tan", bn: "tan" },
        ],
        "sin",
      ),
      { key: "angle", type: "number", label: t("Angle", "কোণ"), default: "30" },
      { key: "unit", type: "select", label: t("Unit", "একক"), default: "deg",
        options: [
          { value: "deg", label: t("Degrees", "ডিগ্রি") },
          { value: "rad", label: t("Radians", "রেডিয়ান") },
        ] },
    ],
    example: { fields: { mode: "sin", angle: "30" } },
  },
  "radians-degrees-converter": {
    fields: [
      { key: "value", type: "number", label: t("Value", "মান"), default: "180" },
      MODE_FIELD(
        [
          { value: "todeg", en: "Radians → degrees", bn: "রেডিয়ান → ডিগ্রি" },
          { value: "torad", en: "Degrees → radians", bn: "ডিগ্রি → রেডিয়ান" },
        ],
        "todeg",
      ),
    ],
    example: { fields: { value: "3.14159", mode: "torad" } },
  },
  "age-calculator": {
    fields: [{ key: "dob", type: "date", label: t("Birth date", "জন্ম তারিখ"), default: "2000-01-01" }],
    example: { fields: { dob: "2000-01-01" } },
  },
  "date-difference-calculator": {
    fields: [
      { key: "from", type: "date", label: t("From", "থেকে"), default: "2026-01-01" },
      { key: "to", type: "date", label: t("To", "পর্যন্ত"), default: "2026-12-31" },
    ],
    example: { fields: { from: "2026-01-01", to: "2026-12-31" } },
  },
  "tip-calculator": {
    fields: [
      { key: "bill", type: "number", label: t("Bill", "বিল"), default: "500" },
      { key: "percent", type: "number", label: t("Tip %", "টিপ %"), default: "10" },
      { key: "people", type: "number", label: t("People", "জন"), default: "2", min: "1" },
    ],
    example: { fields: { bill: "500", percent: "10", people: "2" } },
  },
  "ratio-calculator": {
    fields: [
      { key: "a", type: "number", label: t("A", "ক"), default: "3" },
      { key: "b", type: "number", label: t("B", "খ"), default: "4" },
      { key: "c", type: "number", label: t("C (find D)", "গ (ঘ বের করুন)"), default: "6" },
    ],
    example: { fields: { a: "3", b: "4", c: "6" } },
  },
  "unit-converter": {
    fields: [
      { key: "value", type: "number", label: t("Value", "মান"), default: "1" },
      {
        key: "unit", type: "select", label: t("Convert", "রূপান্তর"), default: "km-mi",
        options: [
          { value: "km-mi", label: t("km → miles", "কিমি → মাইল") },
          { value: "mi-km", label: t("miles → km", "মাইল → কিমি") },
          { value: "m-ft", label: t("metres → feet", "মিটার → ফুট") },
          { value: "ft-m", label: t("feet → metres", "ফুট → মিটার") },
          { value: "kg-lb", label: t("kg → pounds", "কেজি → পাউন্ড") },
          { value: "lb-kg", label: t("pounds → kg", "পাউন্ড → কেজি") },
          { value: "l-gal", label: t("litres → gallons", "লিটার → গ্যালন") },
          { value: "inch-cm", label: t("inches → cm", "ইঞ্চি → সেমি") },
          { value: "cm-inch", label: t("cm → inches", "সেমি → ইঞ্চি") },
        ],
      },
    ],
    example: { fields: { value: "5", unit: "km-mi" } },
  },
  "temperature-converter": {
    fields: [
      { key: "value", type: "number", label: t("Value", "মান"), default: "100" },
      MODE_FIELD(
        [
          { value: "c-f", en: "°C → °F", bn: "°সে → °ফা" },
          { value: "f-c", en: "°F → °C", bn: "°ফা → °সে" },
          { value: "c-k", en: "°C → K", bn: "°সে → K" },
          { value: "k-c", en: "K → °C", bn: "K → °সে" },
        ],
        "c-f",
      ),
    ],
    example: { fields: { value: "37", mode: "c-f" } },
  },
  "fibonacci-generator": {
    fields: [{ key: "count", type: "number", label: t("Terms", "পদ"), default: "10", min: "1", max: "200" }],
    example: { fields: { count: "10" } },
  },
  "prime-checker-generator": {
    fields: [
      { key: "n", type: "number", label: t("Number", "সংখ্যা"), default: "97" },
      MODE_FIELD(
        [
          { value: "check", en: "Check primality", bn: "মৌলিক কিনা" },
          { value: "list", en: "List primes up to N", bn: "N পর্যন্ত মৌলিক" },
        ],
        "check",
      ),
    ],
    example: { fields: { n: "97", mode: "check" } },
  },
  "number-base-converter": {
    fields: [
      { key: "value", type: "text", label: t("Value", "মান"), default: "255" },
      { key: "from", type: "number", label: t("From base", "কোন বেস থেকে"), default: "10", min: "2", max: "36" },
      { key: "to", type: "number", label: t("To base", "কোন বেসে"), default: "16", min: "2", max: "36" },
    ],
    example: { fields: { value: "255", from: "10", to: "16" } },
  },
  "binary-hex-octal-converter": {
    fields: [
      { key: "value", type: "text", label: t("Value", "মান"), default: "1010" },
      MODE_FIELD(
        [
          { value: "bin", en: "From binary", bn: "বাইনারি থেকে" },
          { value: "hex", en: "From hex", bn: "হেক্স থেকে" },
          { value: "oct", en: "From octal", bn: "অক্টাল থেকে" },
          { value: "dec", en: "From decimal", bn: "দশমিক থেকে" },
        ],
        "bin",
      ),
    ],
    example: { fields: { value: "1010", mode: "bin" } },
  },
  "roman-numeral-converter": {
    fields: [
      { key: "value", type: "text", label: t("Value", "মান"), default: "2026" },
      MODE_FIELD(
        [
          { value: "to-roman", en: "Number → Roman", bn: "সংখ্যা → রোমান" },
          { value: "from-roman", en: "Roman → number", bn: "রোমান → সংখ্যা" },
        ],
        "to-roman",
      ),
    ],
    example: { fields: { value: "2026", mode: "to-roman" } },
  },
  "average-min-max": {
    fields: [{ key: "text", type: "textarea", label: t("Numbers (any separator)", "সংখ্যা"), default: "4 8 15 16 23 42" }],
    example: {},
  },
  "number-list-generator": {
    fields: [
      { key: "from", type: "number", label: t("From", "থেকে"), default: "1" },
      { key: "to", type: "number", label: t("To", "পর্যন্ত"), default: "10" },
      { key: "step", type: "number", label: t("Step", "ধাপ"), default: "1" },
    ],
    example: { fields: { from: "1", to: "10", step: "1" } },
  },
  "number-to-words": {
    fields: [
      { key: "n", type: "number", label: t("Number", "সংখ্যা"), default: "2026" },
      MODE_FIELD(
        [
          { value: "en", en: "English", bn: "English" },
          { value: "bn", en: "Bangla", bn: "বাংলা" },
        ],
        "en",
      ),
    ],
    example: { fields: { n: "2026", mode: "en" } },
  },
  "percentage-fraction-decimal": {
    fields: [{ key: "value", type: "text", label: t("Value (50%, 1/2, 0.5)", "মান"), default: "3/4" }],
    example: { fields: { value: "3/4" } },
  },
  "gpa-calculator": {
    fields: [{ key: "text", type: "textarea", label: t("Grades with credits (A 3, B+ 2…)", "গ্রেড ও ক্রেডিট"), default: "A 3\nA- 3\nB+ 2" }],
    example: {},
  },
  "discount-calculator": {
    fields: [
      { key: "price", type: "number", label: t("Price", "দাম"), default: "1000" },
      { key: "percent", type: "number", label: t("Discount %", "ছাড় %"), default: "15" },
    ],
    example: { fields: { price: "1000", percent: "15" } },
  },
  "loan-emi-calculator": {
    fields: [
      { key: "principal", type: "number", label: t("Principal", "আসল"), default: "500000" },
      { key: "rate", type: "number", label: t("Yearly rate %", "বাৎসরিক সুদ %"), default: "9" },
      { key: "months", type: "number", label: t("Months", "মাস"), default: "60", min: "1", max: "600" },
    ],
    example: { fields: { principal: "500000", rate: "9", months: "60" } },
  },
  "bangla-calendar-converter": {
    fields: [
      { key: "date", type: "date", label: t("Gregorian date", "ইংরেজি তারিখ"), default: "2026-04-14" },
      MODE_FIELD(
        [
          { value: "to-bangla", en: "English → Bangla", bn: "ইংরেজি → বাংলা" },
          { value: "pohela", en: "Days to Pohela Boishakh", bn: "পহেলা বৈশাখ কতদিন" },
        ],
        "to-bangla",
      ),
    ],
    example: { fields: { date: "2026-04-14", mode: "to-bangla" } },
  },

  // -- Date & Time ---------------------------------------------------------
  "add-subtract-date": {
    fields: [
      { key: "date", type: "date", label: t("Date", "তারিখ"), default: "2026-01-01" },
      { key: "days", type: "number", label: t("Days (+/-)", "দিন (+/-)"), default: "30" },
    ],
    example: { fields: { date: "2026-01-01", days: "30" } },
  },
  "unix-timestamp-converter": {
    fields: [
      { key: "value", type: "text", label: t("Timestamp or date", "টাইমস্ট্যাম্প বা তারিখ"), default: "1767225600" },
      MODE_FIELD(
        [
          { value: "to-date", en: "Timestamp → date", bn: "টাইমস্ট্যাম্প → তারিখ" },
          { value: "to-stamp", en: "Date → timestamp", bn: "তারিখ → টাইমস্ট্যাম্প" },
          { value: "now", en: "Current timestamp", bn: "বর্তমান টাইমস্ট্যাম্প" },
        ],
        "to-date",
      ),
    ],
    example: { fields: { value: "1767225600", mode: "to-date" } },
  },
  "date-formatter": {
    fields: [
      { key: "date", type: "date", label: t("Date", "তারিখ"), default: "2026-04-14" },
      MODE_FIELD(
        [
          { value: "iso", en: "ISO", bn: "ISO" },
          { value: "long-en", en: "Long English", bn: "Long English" },
          { value: "long-bn", en: "Long Bangla", bn: "Long Bangla" },
          { value: "short", en: "Short", bn: "Short" },
        ],
        "long-en",
      ),
    ],
    example: { fields: { date: "2026-04-14", mode: "long-en" } },
  },
  "julian-date": {
    fields: [{ key: "date", type: "date", label: t("Date", "তারিখ"), default: "2026-01-01" }],
    example: { fields: { date: "2026-01-01" } },
  },
  "days-between-dates": {
    fields: [
      { key: "from", type: "date", label: t("From", "থেকে"), default: "2026-01-01" },
      { key: "to", type: "date", label: t("To", "পর্যন্ত"), default: "2026-12-31" },
    ],
    example: { fields: { from: "2026-01-01", to: "2026-12-31" } },
  },
  "working-days-calculator": {
    fields: [
      { key: "from", type: "date", label: t("From", "থেকে"), default: "2026-01-01" },
      { key: "to", type: "date", label: t("To", "পর্যন্ত"), default: "2026-01-31" },
      { key: "weekend", type: "select", label: t("Weekend", "সাপ্তাহিক ছুটি"), default: "fri-sat",
        options: [
          { value: "fri-sat", label: t("Fri–Sat (BD)", "শুক্র–শনি") },
          { value: "sat-sun", label: t("Sat–Sun", "শনি–রবি") },
        ] },
    ],
    example: { fields: { from: "2026-01-01", to: "2026-01-31", weekend: "fri-sat" } },
  },
  "timezone-converter": {
    fields: [
      { key: "time", type: "text", label: t("Time (HH:MM)", "সময়"), default: "12:00" },
      { key: "date", type: "date", label: t("Date", "তারিখ"), default: "2026-01-01" },
      {
        key: "zone", type: "select", label: t("Show in", "দেখুন"), default: "America/New_York",
        options: [
          { value: "Asia/Dhaka", label: t("Dhaka", "ঢাকা") },
          { value: "Asia/Kolkata", label: t("Kolkata", "কলকাতা") },
          { value: "UTC", label: t("UTC", "UTC") },
          { value: "Europe/London", label: t("London", "লন্ডন") },
          { value: "America/New_York", label: t("New York", "নিউইয়র্ক") },
          { value: "Asia/Dubai", label: t("Dubai", "দুবাই") },
          { value: "Asia/Singapore", label: t("সিঙ্গাপুর", "সিঙ্গাপুর") },
          { value: "Australia/Sydney", label: t("Sydney", "সিডনি") },
        ],
      },
    ],
    example: { fields: { time: "12:00", date: "2026-01-01", zone: "Asia/Dhaka" } },
  },

  // -- SEO & Web ------------------------------------------------------------
  "htaccess-redirect-generator": {
    fields: [
      { key: "from", type: "text", label: t("Old path", "পুরনো পাথ"), default: "/old-page" },
      { key: "to", type: "text", label: t("New URL", "নতুন URL"), default: "https://example.com/new-page" },
      MODE_FIELD(
        [
          { value: "301", en: "301 permanent", bn: "301 স্থায়ী" },
          { value: "302", en: "302 temporary", bn: "302 অস্থায়ী" },
        ],
        "301",
      ),
    ],
    example: { fields: { from: "/old-page", to: "https://example.com/new-page", mode: "301" } },
  },
  "html-entity-table": {
    fields: [{ key: "query", type: "text", label: t("Search", "খুঁজুন"), default: "copy" }],
    example: { fields: { query: "" } },
  },
  "seo-word-counter": {
    fields: [{ key: "text", type: "textarea", label: t("Article", "আর্টিকেল"), default: "Write your article here." }],
    example: {},
  },
  "twitter-card-info": {
    fields: [{ key: "query", type: "text", label: t("Search", "খুঁজুন"), default: "" }],
    example: { fields: { query: "" } },
  },
  "website-text-extractor": {
    fields: [{ key: "url", type: "text", label: t("URL", "URL"), default: "https://example.com" }],
    example: {},
  },

  // -- Fun & Misc (static) ---------------------------------------------------
  "age-in-seconds": {
    fields: [{ key: "dob", type: "date", label: t("Birth date", "জন্ম তারিখ"), default: "2000-01-01" }],
    example: { fields: { dob: "2000-01-01" } },
  },
  "dog-cat-years-converter": {
    fields: [
      { key: "age", type: "number", label: t("Pet age", "বয়স"), default: "3", min: "0" },
      MODE_FIELD(
        [
          { value: "dog", en: "Dog years", bn: "কুকুরের বছর" },
          { value: "cat", en: "Cat years", bn: "বিড়ালের বছর" },
        ],
        "dog",
      ),
    ],
    example: { fields: { age: "3", mode: "dog" } },
  },
  "love-calculator": {
    fields: [
      { key: "a", type: "text", label: t("First name", "প্রথম নাম"), default: "Rahim" },
      { key: "b", type: "text", label: t("Second name", "দ্বিতীয় নাম"), default: "Karim" },
    ],
    example: { fields: { a: "Rahim", b: "Karim" } },
  },
  "aspect-ratio-calculator": {
    fields: [
      { key: "w", type: "number", label: t("Width", "প্রস্থ"), default: "1920" },
      { key: "h", type: "number", label: t("Height", "উচ্চতা"), default: "1080" },
      { key: "nw", type: "number", label: t("New width (height = ?)", "নতুন প্রস্থ"), default: "1280" },
    ],
    example: { fields: { w: "1920", h: "1080", nw: "1280" } },
  },
  "aspect-ratio-cropper": {
    fields: [
      { key: "w", type: "number", label: t("Width", "প্রস্থ"), default: "1920" },
      { key: "h", type: "number", label: t("Height", "উচ্চতা"), default: "1080" },
      { key: "ratio", type: "text", label: t("Target ratio (W:H)", "লক্ষ্য অনুপাত"), default: "1:1" },
    ],
    example: { fields: { w: "1920", h: "1080", ratio: "1:1" } },
  },
  "event-countdown": {
    fields: [{ key: "date", type: "date", label: t("Event date", "ইভেন্ট তারিখ"), default: "2027-01-01" }],
    example: { fields: { date: "2027-01-01" } },
  },
  "screen-resolution-detector": { fields: [], example: {} },
};

export function getToolSchema(slug: string): ToolSchema | null {
  return schemas[slug] ?? null;
}

/** Field values merged over schema defaults. */
export function defaultFieldValues(slug: string): Record<string, string> {
  const schema = getToolSchema(slug);
  const out: Record<string, string> = {};
  if (!schema) return out;
  for (const field of schema.fields) out[field.key] = field.default ?? "";
  return out;
}
