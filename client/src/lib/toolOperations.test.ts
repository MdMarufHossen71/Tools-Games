import { describe, expect, it } from "vitest";
import {
  base64EncodeUnicode,
  isToolImplemented,
  runHashFile,
  runHashText,
  runTool,
} from "./toolOperations";

const t = ((key: string) => key) as Parameters<typeof runTool>[3];

describe("isToolImplemented", () => {
  it("marks real tools implemented and stubs unavailable", async () => {
    expect(isToolImplemented("word-counter")).toBe(true);
    expect(isToolImplemented("definitely-not-a-tool")).toBe(false);
    expect(await runTool("definitely-not-a-tool", "hi", "default", t)).toMatchObject({ unavailable: true });
  });

  it("resolves hash tools through the single async path", async () => {
    const out = JSON.parse((await runTool("hash-generator", "hello", "default", t)).text);
    expect(out.SHA256).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  });
});

describe("text tools incl. Unicode/Bangla", () => {
  it("word-counter handles Bangla + emoji", async () => {
    const out = JSON.parse((await runTool("word-counter", "হ্যালো world 🎮", "default", t)).text);
    // Emoji is not a word token — হ্যালো + world only.
    expect(out.words).toBe(2);
    expect(out.characters).toBe("হ্যালো world 🎮".length);
  });

  it("case-converter, reverse, slug handle Bangla", async () => {
    expect((await runTool("slug-generator", "Hello হ্যালো World", "default", t)).text).toContain("hello");
    expect((await runTool("reverse-text", "abc", "default", t)).text).toBe("cba");
    expect((await runTool("reverse-text", "a b c", "words", t)).text).toBe("c b a");
  });

  it("empty input is not an error for pure transforms", async () => {
    expect((await runTool("reverse-text", "", "default", t)).error).toBeFalsy();
  });

  it("base64 roundtrips Unicode without unescape", async () => {
    const original = "হ্যালো 🎮 hello";
    const encoded = base64EncodeUnicode(original);
    expect(encoded).not.toContain("undefined");
    const decoded = (await runTool("base64-text", encoded, "decode", t)).text;
    expect(decoded).toBe(original);
  });

  it("morse + rot13 + url roundtrip", async () => {
    expect((await runTool("morse-code", "sos", "default", t)).text).toBe("... --- ...");
    expect((await runTool("rot13-caesar-cipher", "hello", "default", t)).text).toBe("uryyb");
    const enc = (await runTool("url-encode-decode", "a b&c", "default", t)).text;
    expect((await runTool("url-encode-decode", enc, "decode", t)).text).toBe("a b&c");
  });

  it("json formatter rejects malformed input with generic error", async () => {
    const out = await runTool("json-formatter-validator", "{bad", "default", t);
    expect(out.error).toBe(true);
  });

  it("chmod validates octal", async () => {
    expect((await runTool("chmod-calculator", "755", "default", t)).error).toBeFalsy();
    expect(await runTool("chmod-calculator", "999", "default", t)).toEqual({
      text: "tool.error.octal",
      error: true,
    });
  });

  it("math evaluator never executes code", async () => {
    expect((await runTool("math-evaluator", "(12.5 * 4) / 2", "default", t)).text).toBe("25");
    // `alert` passes the character allowlist but is not a known function.
    const evil = await runTool("math-evaluator", "alert(1)", "default", t);
    expect(evil.error).toBe(true);
    expect(evil.text).toBe("tool.error.math.unknownName");
  });

  it("jwt decoder rejects malformed tokens", async () => {
    expect((await runTool("jwt-decoder-debugger", "not-a-token", "default", t)).error).toBe(true);
  });

  it("email validator + hex converter", async () => {
    expect(JSON.parse((await runTool("email-validator", "a@b.com", "default", t)).text).valid).toBe(true);
    expect((await runTool("hex-rgb-hsl-hsv-converter", "#3264FF", "default", t)).error).toBeFalsy();
    expect((await runTool("hex-rgb-hsl-hsv-converter", "zzz", "default", t)).error).toBe(true);
  });
});

describe("lazy parser chunks resolve on demand", () => {
  it("sql-formatter branch loads its chunk", async () => {
    const out = await runTool("sql-formatter", "select id,name from users where active=1 order by name;", "default", t);
    expect(out.error).toBeFalsy();
    expect(out.text.toLowerCase()).toContain("select");
  });

  it("yaml / toml / xml branches load their chunks", async () => {
    const yamlOut = await runTool("yaml-formatter", "hello: world", "default", t);
    expect(yamlOut.error).toBeFalsy();
    expect(yamlOut.text).toContain("hello");
    const tomlOut = await runTool("toml-formatter", 'title = "hi"', "default", t);
    expect(tomlOut.error).toBeFalsy();
    const xmlOut = await runTool("xml-formatter", "<a><b>1</b></a>", "default", t);
    expect(xmlOut.error).toBeFalsy();
    expect(xmlOut.text).toContain("<a>");
  });

  it("converter branch loads yaml + xml chunks", async () => {
    const out = await runTool("yaml-json-toml-xml-converter", '{"a":1}', "yaml", t);
    expect(out.error).toBeFalsy();
    expect(out.text).toContain("a:");
  });

  it("markdown chunks resolve (parse is DOM-free; sanitize needs a browser)", async () => {
    const { marked } = await import("marked");
    expect(marked.parse("# Hello") as string).toContain("<h1>");
    const sanitizer = await import("dompurify");
    // Without a `window` this is the factory, not a configured instance —
    // resolving the chunk is what this test pins, not browser sanitizing.
    expect(typeof sanitizer.default).toBe("function");
  });
});

describe("Web Crypto hash tools", () => {
  it("runHashText produces known SHA vectors", async () => {
    const out = JSON.parse((await runHashText("hello", t)).text);
    expect(out.SHA256).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
    expect(out.SHA1).toBe("aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d");
    expect(out.SHA512.length).toBe(128);
  });

  it("runHashText needs input", async () => {
    expect((await runHashText("   ", t)).text).toBe("tool.result.needsInput");
  });

  it("runHashFile hashes bytes and rejects oversize", async () => {
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });
    const out = JSON.parse((await runHashFile(file, t)).text);
    expect(out.SHA256).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
    expect(out.file).toBe("hello.txt");
    const big = new File(["x"], "big.bin");
    Object.defineProperty(big, "size", { value: 60 * 1024 * 1024 });
    expect((await runHashFile(big, t)).error).toBe(true);
  });
});
