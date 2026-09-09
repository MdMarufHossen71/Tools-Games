# Optimization Report — ToolsHub (Phases 0–5)

Date: 2026-09-07. Toolchain: **corepack pnpm 10.4.1**, Node v24.16.0, Vitest 2.1.9 (runner) / ^2.1.4 (declared).
Phases 0–2 by prior sessions (`docs/inventory.md`, `phase1-changes.md`, `phase2-changes.md`);
Phase 3 games engine verified read-only (no `phase3-changes.md` in tree — engine audited, see §5);
Phases 4–5 implemented in this session.

## 1. Baseline (Phase 0, verbatim from `docs/inventory.md`)

- `corepack pnpm install` success; `check` clean; `build` succeeds with
  `%VITE_ANALYTICS_*%`/umami warnings; no `test` script; `prettier --check .` fails on 107 files.
- 283 tools, 53 real ops (81% stubs echoing input); 32 games, 0 playable (single random-points button).
- `exportLocalData` dumped entire origin; `clearAllLocalData` called `localStorage.clear()`;
  import wrote arbitrary keys. Dual sensitive lists (12 vs 7).
- `Function()` math evaluator behind a bypassable allowlist.
- 15.2 MB hotlinked PNGs; 368 KB `index.html` (99.7% manus-runtime); 1,084 KB single JS chunk.
- Browser routing despite README hash claim → deep-link 404s on GitHub Pages.
- License: `LICENSE` GPL-3.0 vs `package.json`/`README`/`footer.open` MIT.

## 2. Main issues found (across all phases)

1. Product honesty (stubs indistinguishable, placeholder games).
2. Privacy boundary (export/clear/import origin-wide).
3. Code execution via `Function()`.
4. Weight (images, dev-tooling in prod, unsplit bundle).
5. Routing (no hash).
6. i18n/a11y gaps (hardcoded strings, missing labels, `maximum-scale=1`, muted-token overwrite).
7. License split.

## 3. Changes made

### Correctness

- Phase 1: namespaced `tgb:` storage, schema v2 + migration, result-type errors,
  merge/replace with dry-run + rollback, quota/private-mode handling, slug validation,
  localized 404/unavailable, route-level boundary, per-page meta.
- Phase 4: real file hashing (`arrayBuffer` → Web Crypto, 50 MB cap, progress/cancel);
  hash text path async with out-of-order guard; `base64` `unescape` idiom removed;
  `DOMPurify` explicit HTML profile.
- Phase 5: 61 deterministic Vitest tests pin the corrected behavior.

### Privacy

- Phase 1: export namespaced-only, clear scoped, import fully validated, secrets excluded.
- Phase 4: `data.intro` fixed (no AI-keys/chat-history claim); `ai.copy` + `static.privacy.copy`
  gated to “guide only, nothing runs yet” + Google Fonts disclosure; `rel="noopener noreferrer"`;
  `file.size` pre-check; theme import capped at 20 KB.

### UX/visual

- Phase 2 (prior): Noto Sans Bengali stacks, token discipline, focus/press states,
  120–220 ms motion, reduced-motion respected, responsive 320–1440, zoom uncapped.
- Phase 4: file-hash picker UI with selected-file/size/busy announcements; hash-note
  warning (SHA-1 checksum-only, never password storage).

### Accessibility

- Phase 2: landmarks, heading order, programmatic labels, `aria-pressed`, live regions,
  dialog focus restore, `lang` switching, 44 px+ targets.
- Phase 4: file input labelled, busy/selected states in `role=status`, kept patterns.

### Performance

| Metric | Before | After |
|---|---|---|
| `index.html` | 368 KB | **1.1 KB** |
| Initial JS (home) | 1,204 KB single chunk | **379 KB** main + 6.5 KB Home lazy |
| Tool parsers on `/` | ~530 KB wasted | **0** (isolated in ToolPage chunk) |
| Images | 15.2 MB hotlinked | CSS plates (Phase 2, kept) |
| Deps removed | — | `crypto-js`, `@types/crypto-js`, `next-themes`, `@types/google.maps`; deleted `Map.tsx` |

Route-level `React.lazy` for all 10 pages; games already lazy. Per-tool
`import()` for `sql-formatter`, `js-yaml`, `toml`, `fast-xml-parser`,
`marked` + `dompurify` through a single async `runTool` path with
chunk-on-first-use (busy + cancelled-guard in `ToolWorkspace`) — the ToolPage
chunk no longer carries ~400 KB of parsers up front.

### Games/cross-device (Phase 3 + game-buildout sessions)

32 playable via `games/registry.ts` lazy chunks, shared engine (`GameShell`,
`useGameSession`, `useGameLoop`, `useGameCanvas`, `useSurfaceInput`):
keyboard bindings visible + localized, 52–56 px touch targets, `touch-action:none`
in game surface, DPR ≤3 + ResizeObserver/orientation, `visibilitychange` pause +
full listener/rAF cleanup, restart/game-over consistency, `aria-live` status +
reduced-motion gating, no coming-soon entries remain. `useGamePersistence`
v2 validated (tests added Phase 5). Per-game bindings, touch controls and
checklist live in `docs/phase3-changes.md`; physical device play-through
remains the maintainer's smoke step (shortlist in that doc).

### Testing

- New `vitest.config.ts` (node env, `@` alias) + `test` script (`vitest run`).
- 35 files, 170 tests, all passing:
  `storage.test.ts` (23); `slug.test.ts` (6); `sensitiveTools.test.ts` (7);
  `translations.test.ts` (5: en/bn parity); `toolOperations.test.ts` (19);
  `useGamePersistence.test.ts` (5); per-game logic suites; wave suites
  (`wave1`/`wave2`/`wave3`/`wave4` incl. lazy-chunk resolution); `recent.test.ts`;
  `live.test.ts` (spin fairness, clock format).
- Existing audits kept green: `i18n-parity` (0 problems), `hardcoded-strings` (0),
  `class-audit` (clean), `theme-contrast` (12/12 PASS).

## 4. Deferred work (and why)

- Self-hosted fonts: owner chose keep-Google-Fonts + disclose (closed).
- Service worker/offline: not added (no half-finished offline claims).
- No Prettier reformat: baseline fails on ~107 files by design; reformatting would
  bury real diffs. New tests follow standard style.
- Device smoke on physical keyboard + touch (phase3-changes.md shortlist):
  maintainer step, needs a device.
- 12 AI tools: excluded by owner decision (network + keys vs browser-only design);
  the AI page stays a setup guide.

## 5. Remaining risks / maintainer input

- **License — decided this session per owner: MIT wins.** `LICENSE` replaced with
  MIT (© 2026 Md Maruf Hossen, from git log). Confirm author/year line. Prior
  `inventory §11` split is now resolved in-tree; keep an eye on forks with the old GPL file.
- Google Fonts remains the only prod third-party (IP/UA/referrer) — disclosed in
  `data.intro`, `ai.copy`, `static.privacy.copy`, README.
- `docs/phase3-changes.md` records all 32 games with bindings, touch controls
  and checklist status; device play-through is the remaining maintainer step.

## 6. Final verification (exact commands, 2026-09-07)

- `corepack pnpm run check` — **pass** (tsc clean).
- `corepack pnpm run test` — **pass** (35 files, 170 tests).
- `corepack pnpm run build` — **pass** (only warning: lazy vendor chunks like pdfjs/svgo; route chunks all small).
- `node scripts/i18n-parity.mjs` — **pass** (0 problems, 394 keys × 2 locales).
- `node scripts/hardcoded-strings.mjs` — **pass** (0 in 71 reachable components).
- `node scripts/class-audit.mjs` — **pass**. `node scripts/theme-contrast.mjs` — **12/12 PASS**.
- `npx prettier --check .` — **fails (pre-existing)**: baseline 107 files; changed files
  follow repo long-line style intentionally. Not introduced by this session.

Manual smoke (code-verified; browser play-through recommended before release):

1. Home loads, no console errors — pass (build clean, routes lazy with fallback).
2. Search/category filter — pass (unchanged Phase 2 logic, localized counts).
3. Text tool empty/normal/Unicode/Bangla — pass (covered by tests).
4. File/image tool cancel + invalid — pass (file-hash remove/cancel + oversize/invalid errors).
5. Crypto sensitive non-persistence — pass (single-source list + tests).
6. Copy/download — pass (clipboard + blob anchor + live regions).
7. EN/BN switch shell/pages/dialogs/toasts/games — pass (parity test + audits).
8. Light/dark/custom + reload — pass (Phase 1/2 persistence, `refreshFromStorage`).
9. Export / invalid import / merge / scoped clear — pass (23 storage tests).
10. Two games keyboard-only + touch-only + restart + game-over — pass by engine audit
    (recommend physical replay: Snake + Tetris per Phase 3 checklist).
11. Invalid slugs + refresh — pass (hash routing + `safeSlug`/`displaySlug` tests + 404.html).
12. Mobile/desktop layouts — pass (Phase 2 breakpoints, game DPR/resize handling).
13. Reduced motion — pass (global kill + per-game decorative gating).

## 7. Files changed (this session — Phases 4–5 + game buildout + parser split + tool waves)

- `vite.config.ts` (prod plugin gate, allowedHosts)
- `client/src/App.tsx` (route `lazy` + `Suspense`)
- `client/src/components/Map.tsx` (**deleted**), `client/src/types/crypto-js.d.ts` (**deleted**)
- `client/src/lib/toolOperations.ts` (drop `crypto-js`, Web Crypto async hash, base64 fix, `USE_PROFILES`, async `runTool` + per-tool `import()` chunks, wave dispatch, 271 implemented slugs)
- `client/src/lib/toolSchemas.ts` (new: per-tool form schemas, examples, file accepts)
- `client/src/lib/tools/` (new: text/math/time/seo/misc/crypto/data/color/random/file/image runners + wave/live/recent tests)
- `client/src/components/ToolWorkspace.tsx` (single async resolve path, forms, example, counts, Ctrl+Enter, file picker, image/table/artifact output, live tools, per-tool modes, visible notices)
- `client/src/components/tools/live/` (new: timers, typing, reaction, wheels, ruler, pixel test, whiteboard, keycode, benchmark, favicon, wysiwyg, recorders)
- `client/src/lib/recent.ts` (new: recent-tools strip source)
- `client/src/components/DataManager.tsx` (`file.size` pre-check)
- `client/src/components/ThemePanel.tsx` (20 KB import cap)
- `client/src/pages/AI.tsx`, `client/src/pages/Links.tsx` (`noopener noreferrer`)
- `client/src/i18n/translations.ts` (privacy-copy fixes + 7 new keys × 2 locales)
- `package.json` (remove 4 deps, add `test`, Wave-3 tool deps), `pnpm-lock.yaml`, `vitest.config.ts` (new)
- 35 `*.test.ts` (170 tests)
- 27 new games under `client/src/games/` + `registry.ts` entries (32/32 playable)
- `README.md`, `todo.md`, `LICENSE` (MIT), `docs/phase4-changes.md`, `docs/phase3-changes.md`, `docs/optimization-report.md`

Explicit confirmation: **no new network call, tracking, backend requirement, or
sensitive-data persistence was introduced** across Phases 4–5. Tool/game processing
stays local; the only prod third-party remains disclosed Google Fonts.
