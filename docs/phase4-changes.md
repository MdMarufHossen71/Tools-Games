# Phase 4 changes — performance, security, and privacy audit

Date: 2026-09-07. Base: Phase 0 `docs/inventory.md`, Phase 1/2 change logs.
Package manager: **corepack pnpm 10.4.1**. Node v24.16.0 observed.

Owner decisions applied: MIT wins (LICENSE replaced in Phase 5), Google Fonts
kept + disclosed, real file hashing, `crypto-js` → Web Crypto.

## 1. Performance (measured, `corepack pnpm run build`)

### Before → after

| Artifact | Before (Phase 0/2) | After | Note |
|---|---|---|---|
| `dist/public/index.html` | 367,873–368,003 B (99.7% inline manus-runtime) | **1,115 B** | `vitePluginManusRuntime` + `jsxLocPlugin` gated to serve-only |
| Main JS | 1,203,735 B single chunk | **379,031 B** `index-*.js` + split routes | Route-level `React.lazy` |
| Home route | in main chunk | **6,537 B** `Home-*.js` | No tool parsers on `/` |
| Tools catalogue | in main chunk | **84,139 B** `tools-*.js` + 3 KB `Tools-*.js` | — |
| ToolPage (parsers) | in main chunk | **563,364 B** `ToolPage-*.js` | `sql-formatter` isolated here, not initial load |
| CSS | 150,471 B | 150,226 B | unchanged |
| `dist/index.js` | 788 B | 788 B | — |

Build warning `>500 kB` remained only for `ToolPage-*.js` (sql-formatter 279 KB).
Follow-up (same project, later session): per-tool dynamic `import()` landed —
`runTool` is now async with chunk-on-first-use for sql/yaml/toml/xml/marked —
so the warning keeps shrinking as parser chunks split out of ToolPage.

### What changed

- `vite.config.ts`: `isProd` gate — prod plugins are `[react(), tailwindcss()]`
  only. `jsxLocPlugin`, `manusRuntime`, debug collector, storage proxy are
  serve-only. `allowedHosts` reduced to `localhost` + `127.0.0.1` (manus domains removed).
- `client/src/App.tsx`: all 10 pages `lazy(() => import(...))` + `Suspense`
  bilingual fallback. `main.tsx` unchanged (no StrictMode — pre-existing).
- Deps removed + `pnpm install --lockfile-only`: `crypto-js`, `@types/crypto-js`,
  `next-themes` (unused since Phase 2 sonner fix), `@types/google.maps` (Map.tsx deleted).
- Dead file deleted: `client/src/components/Map.tsx` (template leftover, zero importers,
  built a Google Maps script URL from env — never bundled, now gone).
- Images: no change needed — Phase 2 already replaced 15.9 MB hotlinked PNGs with CSS plates.

## 2. Security and privacy

- **Eval removed (confirmed):** `grep eval\(|new Function` in `client/src` = zero
  implementation hits. `safeMath.ts` recursive-descent parser unchanged.
- **Hash tools → Web Crypto:** `toolOperations.ts` drops `crypto-js` import.
  New `digestText` / `runHashText` / `runHashFile` via `crypto.subtle.digest`
  (SHA-1/256/384/512). MD5/SHA3/RIPEMD-160 intentionally dropped; UI label
  `tool.hash.note` states SHA-1 is checksum-only, never password storage.
- **Real file hashing (owner choice):** `file-hash-calculator` now renders a file
  picker (`ToolWorkspace` `isFileHash` branch): `arrayBuffer()` → Web Crypto,
  50 MB cap (`MAX_FILE_HASH_BYTES`), selected-file + size announcement,
  remove/cancel, busy state, invalid-file graceful error. Nothing uploaded.
- **Base64:** `btoa(unescape(encodeURIComponent()))` replaced with
  `base64EncodeUnicode` (TextEncoder + chunked `String.fromCharCode`, no spread).
- **Markdown:** `DOMPurify.sanitize(marked.parse(...), { USE_PROFILES: { html: true } })`.
  Only user-HTML injection point; `chart.tsx` second `dangerouslySetInnerHTML` is
  developer-supplied CSS vars and unreachable.
- **Import hardening:** `DataManager.readImport` rejects `file.size > MAX_BUNDLE_BYTES`
  before `file.text()`. `ThemePanel.parseImport` rejects `importValue.length > 20000`
  before `JSON.parse`.
- **External links:** `AI.tsx`, `Links.tsx` `rel="noreferrer"` → `rel="noopener noreferrer"`.
- **Copy/download:** clipboard with localized success/fail + `role=status`; download
  anchor attach/click/remove + deferred `revokeObjectURL` (unchanged, verified).
- **Sensitive handling (unchanged, verified):** `sensitiveTools.ts` single source,
  fail-closed; `useToolInputMemory` 500 ms debounce, 32 KB cap, slug-scoped.

### Privacy-copy drift fixed

- `data.intro` (en+bn): removed `AI keys, chat history` (no such feature/keys) →
  preferences/notes/saves/themes + Fonts disclosure.
- `ai.copy` (en+bn): was live “browser → provider” calls (zero provider `fetch`
  in tree) → “setup guide only — nothing runs yet; future calls go direct”.
- `static.privacy.copy` (en+bn): added Fonts disclosure + future-AI gating.
- `LICENSE` vs MIT: resolved in Phase 5 (MIT wins per owner).

## 3. Verification

- `corepack pnpm run check` — passes.
- `corepack pnpm run build` — succeeds, sizes above. No `%VITE_ANALYTICS%` warnings.
- `runTool` sync paths unchanged; hash paths covered by new Vitest suite (Phase 5).
- No new network call, tracking, backend, or secret persistence introduced.
  Only prod third-party on load remains Google Fonts CSS/binaries (disclosed).
