/** Cobalt Workshop design reminder: storage stays invisible until an action needs clarity; all data remains local and action feedback is explicit. */
export type StorageResult<T> = { ok: true; value: T } | { ok: false; error: "quota" | "unavailable" | "invalid" };

export const STORAGE_PREFIX = "tgb:";
export const toolMemoryKey = (slug: string) => `${STORAGE_PREFIX}tool:${slug}:input`;
export const gameStateKey = (slug: string) => `${STORAGE_PREFIX}game:${slug}:state`;

function isQuotaError(error: unknown) {
  return error instanceof DOMException && (error.name === "QuotaExceededError" || error.code === 22 || error.code === 1014);
}

export function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw) as T;
  } catch { return fallback; }
}

export function safeSet<T>(key: string, value: T): StorageResult<null> {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { ok: true, value: null };
  } catch (error) {
    return { ok: false, error: isQuotaError(error) ? "quota" : "unavailable" };
  }
}

export function safeRemove(key: string) {
  try { localStorage.removeItem(key); return true; } catch { return false; }
}

export type DataBundle = { version: 1; createdAt: string; source: "Tools & Games BD"; localStorage: Record<string, string> };

export function exportLocalData(): DataBundle {
  const localStorageData: Record<string, string> = {};
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key) localStorageData[key] = localStorage.getItem(key) ?? "";
    }
  } catch { /* unavailable storage produces an empty but valid export */ }
  return { version: 1, createdAt: new Date().toISOString(), source: "Tools & Games BD", localStorage: localStorageData };
}

export function downloadDataBundle() {
  const blob = new Blob([JSON.stringify(exportLocalData(), null, 2)], { type: "application/json" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `tools-games-bd-data-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

export function parseDataBundle(text: string): StorageResult<DataBundle> {
  try {
    const data = JSON.parse(text) as DataBundle;
    if (data?.version !== 1 || data?.source !== "Tools & Games BD" || !data.localStorage || typeof data.localStorage !== "object") return { ok: false, error: "invalid" };
    if (Object.values(data.localStorage).some((value) => typeof value !== "string")) return { ok: false, error: "invalid" };
    return { ok: true, value: data };
  } catch { return { ok: false, error: "invalid" }; }
}

export function mergeDataBundle(bundle: DataBundle): StorageResult<number> {
  let imported = 0;
  try {
    for (const [key, value] of Object.entries(bundle.localStorage)) {
      localStorage.setItem(key, value);
      imported += 1;
    }
    return { ok: true, value: imported };
  } catch (error) { return { ok: false, error: isQuotaError(error) ? "quota" : "unavailable" }; }
}

export function clearAllLocalData() {
  try { localStorage.clear(); return true; } catch { return false; }
}
