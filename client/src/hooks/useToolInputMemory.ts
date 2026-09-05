import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_VALUE_BYTES, safeGet, safeRemove, safeSet, toolMemoryKey } from "@/lib/storage";
import { canRememberToolInput, isSensitiveTool } from "@/lib/sensitiveTools";

export { canRememberToolInput, isSensitiveTool };

/** Writes are debounced so typing does not hit storage on every keystroke. */
const WRITE_DELAY_MS = 500;

/** Inputs above this are session-only: a pasted document should not fill the quota. */
const MAX_REMEMBERED_BYTES = Math.min(32 * 1024, MAX_VALUE_BYTES);

function withinLimit(value: string) {
  try {
    return new TextEncoder().encode(value).length <= MAX_REMEMBERED_BYTES;
  } catch {
    return value.length <= MAX_REMEMBERED_BYTES;
  }
}

function readSaved(slug: string) {
  const saved = safeGet<unknown>(toolMemoryKey(slug), "");
  return typeof saved === "string" ? saved : "";
}

export type ToolInputMemory = {
  input: string;
  setInput: (value: string) => void;
  restoreAvailable: boolean;
  restore: () => void;
  forget: () => void;
  canRemember: boolean;
  storageWarning: boolean;
  tooLarge: boolean;
};

/**
 * Remembers the last input for a tool, subject to three rules:
 *  1. Nothing from a crypto/security/secret-generating tool is ever written.
 *  2. Writes are debounced and size-capped.
 *  3. State is scoped to the current slug. wouter reuses the component instance
 *     across `/tools/:slug` changes, so everything keyed on the slug has to be
 *     re-read in an effect rather than in a `useState` initializer — otherwise the
 *     previous tool's saved value and restore banner leak into the next tool.
 */
export function useToolInputMemory(slug: string, initialValue = ""): ToolInputMemory {
  const canRemember = canRememberToolInput(slug);

  const [input, setInput] = useState(initialValue);
  const [savedInput, setSavedInput] = useState(() => (canRemember ? readSaved(slug) : ""));
  const [restoreAvailable, setRestoreAvailable] = useState(() => {
    const saved = canRemember ? readSaved(slug) : "";
    return Boolean(saved) && saved !== initialValue;
  });
  const [storageWarning, setStorageWarning] = useState(false);
  const [tooLarge, setTooLarge] = useState(false);

  // Re-sync when the route param changes without a remount.
  const currentSlug = useRef(slug);
  useEffect(() => {
    if (currentSlug.current === slug) return;
    currentSlug.current = slug;
    const saved = canRemember ? readSaved(slug) : "";
    setInput(initialValue);
    setSavedInput(saved);
    setRestoreAvailable(Boolean(saved) && saved !== initialValue);
    setStorageWarning(false);
    setTooLarge(false);
  }, [slug, canRemember, initialValue]);

  useEffect(() => {
    if (!canRemember) return;
    const value = input;
    if (!value.trim()) return;
    if (!withinLimit(value)) {
      setTooLarge(true);
      return;
    }
    setTooLarge(false);
    const timer = setTimeout(() => {
      const result = safeSet(toolMemoryKey(slug), value);
      if (!result.ok) setStorageWarning(true);
    }, WRITE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [canRemember, input, slug]);

  const restore = useCallback(() => {
    setInput(savedInput);
    setRestoreAvailable(false);
  }, [savedInput]);

  const forget = useCallback(() => {
    safeRemove(toolMemoryKey(slug));
    setSavedInput("");
    setRestoreAvailable(false);
    setInput("");
    setStorageWarning(false);
    setTooLarge(false);
  }, [slug]);

  return { input, setInput, restoreAvailable, restore, forget, canRemember, storageWarning, tooLarge };
}
