import { beforeEach, describe, expect, it } from "vitest";
import { getRecentTools, pushRecentTool } from "./recent";

class MemoryStorage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

beforeEach(() => {
  (globalThis as Record<string, unknown>).localStorage = new MemoryStorage();
});

describe("recent tools", () => {
  it("starts empty and records visits most-recent-first", () => {
    expect(getRecentTools()).toEqual([]);
    pushRecentTool("word-counter");
    pushRecentTool("not-a-tool");
    pushRecentTool("json-formatter-validator");
    expect(getRecentTools().map((t) => t.slug)).toEqual(["json-formatter-validator", "word-counter"]);
  });

  it("ignores unknown slugs and hand-edited garbage", () => {
    localStorage.setItem("tgb:recent-tools", JSON.stringify(["nope", 42, null, "word-counter", "word-counter"]));
    expect(getRecentTools().map((t) => t.slug)).toEqual(["word-counter"]);
  });
});
