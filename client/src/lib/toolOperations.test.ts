import { describe, expect, it } from "vitest";
import {
  base64EncodeUnicode,
  isAsyncTool,
  isToolImplemented,
  runHashFile,
  runHashText,
  runTool,
} from "./toolOperations";

const t = ((key: string) => key) as Parameters<typeof runTool>[3];

describe("isToolImplemented / isAsyncTool", () => {
  it("marks real tools implemented and stubs unavailable", () => {
    expect(isToolImplemented("word-counter")).toBe(true);
    expect(isToolImplemented("definitely-not-a-tool")).toBe(false);
    expect(runTool("definitely-not-a-tool", "hi", "default", t)).toMatchObject({ unavailable: true });
  });

  it("routes hash tools through Web Crypto async path", () => {
    expect(isAsyncTool("hash-generator")).toBe(true);
    expect(isAsyncTool("file-hash-calculator")).toBe(true);
    expect(isAsyncTool("word-counter")).toBe(false);
  });
});

describe("text tools incl. Unicode/Bangla", () => {
  it("word-counter handles Bangla + emoji", () => {
    const out = JSON.parse(runTool("word-counter", "হ্যালো world 🎮", "default", t).text);
    // Emoji is not a word token — হ্যালো + world only.
    expect(out.words).toBe(2);
    expect(out.characters).toBe("হ্যালো world 🎮".length);
  });

  it("case-converter, reverse, slug handle Bangla", () => {
    expect(runTool("slug-generator", "Hello হ্যালো World", "default", t).text).toContain("hello");
    expect(runTool("reverse-text", "abc", "default", t).text).toBe("cba");
    expect(runTool("reverse-text", "a b c", "words", t).text).toBe("c b a");
  });

  it("empty input is not an error for pure transforms", () => {
    expect(runTool("reverse-text", "", "default", t).error).toBeFalsy();
  });

  it("base64 roundtrips Unicode without unescape", () => {
    const original = "হ্যালো 🎮 hello";
    const encoded = base64EncodeUnicode(original);
    expect(encoded).not.toContain("undefined");
    const decoded = runTool("base64-text", encoded, "decode", t).text;
    expect(decoded).toBe(original);
  });

  it("morse + rot13 + url roundtrip", () => {
    expect(runTool("morse-code", "sos", "default", t).text).toBe("... --- ...");
    expect(runTool("rot13-caesar-cipher", "hello", "default", t).text).toBe("uryyb");
    const enc = runTool("url-encode-decode", "a b&c", "default", t).text;
    expect(runTool("url-encode-decode", enc, "decode", t).text).toBe("a b&c");
  });

  it("json formatter rejects malformed input with generic error", () => {
    const out = runTool("json-formatter-validator", "{bad", "default", t);
    expect(out.error).toBe(true);
  });

  it("chmod validates octal", () => {
    expect(runTool("chmod-calculator", "755", "default", t).error).toBeFalsy();
    expect(runTool("chmod-calculator", "999", "default", t)).toEqual({
      text: "tool.error.octal",
      error: true,
    });
  });

  it("math evaluator never executes code", () => {
    expect(runTool("math-evaluator", "(12.5 * 4) / 2", "default", t).text).toBe("25");
    // `alert` passes the character allowlist but is not a known function.
    const evil = runTool("math-evaluator", "alert(1)", "default", t);
    expect(evil.error).toBe(true);
    expect(evil.text).toBe("tool.error.math.unknownName");
  });

  it("jwt decoder rejects malformed tokens", () => {
    expect(runTool("jwt-decoder-debugger", "not-a-token", "default", t).error).toBe(true);
  });

  it("email validator + hex converter", () => {
    expect(JSON.parse(runTool("email-validator", "a@b.com", "default", t).text).valid).toBe(true);
    expect(runTool("hex-rgb-hsl-hsv-converter", "#3264FF", "default", t).error).toBeFalsy();
    expect(runTool("hex-rgb-hsl-hsv-converter", "zzz", "default", t).error).toBe(true);
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
