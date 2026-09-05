# Tools & Games BD — Phase 0 Inventory (Ground Truth)

Date of audit: 2026-08-22. Commit at time of audit: `7c003dd`.

This document records the state of the repository **as found**, before any optimization work.
Nothing in this document is a fix. Every claim below was verified by reading source or by
running a command and reading its real output. Where a claim could not be verified, it says so.

---

## 1. Toolchain: what actually runs

Detected by reading `package.json`, the root lockfile, and `.github/workflows/`.

| Question | Answer | Evidence |
| --- | --- | --- |
| Package manager | **pnpm 10.4.1** | `packageManager: "pnpm@10.4.1+sha512.c753b..."` in `package.json`; `pnpm-lock.yaml` present at root |
| Is pnpm on PATH? | **No** | `pnpm: command not found`. All commands must be run as `corepack pnpm …` |
| Node version pin | **None** | No `engines` field, no `.nvmrc`, no `.node-version` |
| CI workflows | **None** | `.github/workflows/` does not exist. There is no CI to match. |
| Other lockfiles | None | No `package-lock.json`, no `yarn.lock` |

`pnpm` config in `package.json` that a fresh clone depends on:

- `patchedDependencies: { "wouter@3.7.1": "patches/wouter@3.7.1.patch" }` — the patch injects
  `window.__WOUTER_ROUTES__` for external tooling.
- `overrides: { "tailwindcss>nanoid": "3.3.7" }`

### Real script names

These are the only scripts that exist. There is **no `test` script** and no `lint` script.

| Script | Command |
| --- | --- |
| `dev` | `vite --host` |
| `build` | `vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist` |
| `start` | `NODE_ENV=production node dist/index.js` |
| `preview` | `vite preview --host` |
| `check` | `tsc --noEmit` |
| `format` | `prettier --write .` |

`vitest ^2.1.9` is declared in `devDependencies`, but there are **zero** test files, spec files,
or `vitest.config.*` in the repository. The test dependency is unused.

### Framework versions

Vite 7.1.9, React 19.2.1, TypeScript 5.6.3, Tailwind CSS v4 (via `@tailwindcss/vite`),
wouter 3.7.1, shadcn/ui + Radix primitives (`components.json`, `style: "new-york"`).
106 total entries across `dependencies` + `devDependencies`.

---

## 2. Baseline command results (verbatim)

All run from a clean tree at `7c003dd`.

| Command | Result |
| --- | --- |
| `git status --short` | Clean, before and after install. Lockfile unchanged by install. |
| `corepack pnpm install` | Success, 45.8s. Warning: `Ignored build scripts: @tailwindcss/oxide, esbuild.` |
| `corepack pnpm run check` | **Passes clean.** No type errors. |
| `corepack pnpm run build` | **Succeeds**, 15.12s. Warnings quoted below. |
| `corepack pnpm run test --if-present` | `ERR_PNPM_NO_SCRIPT  Missing script: test` / `Command "test" not found. Did you mean "pnpm run start"?` |
| `npx prettier --check .` | `Code style issues found in 107 files. Run Prettier with --write to fix.` |

Build warnings, verbatim:

```
%VITE_ANALYTICS_ENDPOINT% is not defined in env variables found in /index.html. Is the variable mistyped?
%VITE_ANALYTICS_WEBSITE_ID% is not defined in env variables found in /index.html. Is the variable mistyped?
<script src="%VITE_ANALYTICS_ENDPOINT%/umami"> in "/index.html" can't be bundled without type="module" attribute
(!) Some chunks are larger than 500 kB after minification.
```

Build output sizes:

```
dist/public/index.html                   367.92 kB │ gzip: 105.67 kB
dist/public/assets/index-BqbRcGV2.css    134.89 kB │ gzip:  22.95 kB
dist/public/assets/index-CoLieMdR.js   1,083.78 kB │ gzip: 320.48 kB
dist/index.js                                788 b
```

Note on Prettier: the entire repository is unformatted against the project's own Prettier
config. Source is written in very long single lines (many components are one JSX line of
1,000+ characters). Running `format` would rewrite essentially every file, which makes it a
poor first move — it would bury real diffs in later phases.

---

## 3. Step 2.5 — file existence check

All 18 named files **exist**. Eight of them live at a path deeper than the bare filename given.

| Named file | Real path | Match |
| --- | --- | --- |
| `App.tsx` | `client/src/App.tsx` | exact |
| `SiteShell.tsx` | `client/src/components/SiteShell.tsx` | differs — under `components/` |
| `ToolWorkspace.tsx` | `client/src/components/ToolWorkspace.tsx` | differs — under `components/` |
| `ToolCard.tsx` | `client/src/components/ToolCard.tsx` | differs — under `components/` |
| `GamePage.tsx` | `client/src/pages/GamePage.tsx` | differs — under `pages/` |
| `DataManager.tsx` | `client/src/components/DataManager.tsx` | differs — under `components/` |
| `ThemePanel.tsx` | `client/src/components/ThemePanel.tsx` | differs — under `components/` |
| `ErrorBoundary.tsx` | `client/src/components/ErrorBoundary.tsx` | differs — under `components/` |
| `AppSettingsContext.tsx` | `client/src/contexts/AppSettingsContext.tsx` | differs — under `contexts/` |
| `ThemeContext.tsx` | `client/src/contexts/ThemeContext.tsx` | differs — under `contexts/`; **dead file**, never imported |
| `lib/storage.ts` | `client/src/lib/storage.ts` | exact |
| `lib/toolOperations.ts` | `client/src/lib/toolOperations.ts` | exact |
| `hooks/useToolInputMemory.ts` | `client/src/hooks/useToolInputMemory.ts` | exact |
| `hooks/useGamePersistence.ts` | `client/src/hooks/useGamePersistence.ts` | exact |
| `data/tools.ts` | `client/src/data/tools.ts` | exact |
| `data/games.ts` | `client/src/data/games.ts` | exact |
| `i18n/translations.ts` | `client/src/i18n/translations.ts` | exact |
| `index.css` | `client/src/index.css` | exact |

---

## 4. Routes and their loading / error / empty states

Registered in `client/src/App.tsx`. All 12 routes are **statically imported** — there is no
`React.lazy`, no `Suspense`, and therefore **no loading state anywhere in the application**.

Wrapper tree: `ErrorBoundary > AppSettingsProvider > TooltipProvider > (Toaster, SiteShell > AppRoutes)`.
There is no `ThemeProvider` (the file exists but is dead). `main.tsx` does not use `StrictMode`.

| Route | Component | Loading state | Error state | Empty state |
| --- | --- | --- | --- | --- |
| `/` | `Home` | none | none — top-level boundary only, which replaces the whole app shell | n/a (static content) |
| `/tools` | `Tools` | none | none | **yes** — `.empty-state` with `t("tools.empty")` |
| `/tools/:slug` | `ToolPage` | none | none; unknown slug renders `NotFound` inline (correct behaviour, unlocalized UI) | n/a |
| `/games` | `Games` | none | none | **yes** — `.empty-state` with `t("games.empty")` |
| `/games/:slug` | `GamePage` | none | none; unknown slug renders `NotFound` | n/a |
| `/links` | `Links` | none | none | **yes** — `.empty-state` with `t("links.empty")` |
| `/ai` | `AI` | none | none | n/a (static content) |
| `/settings` | `Settings` | none | none | n/a |
| `/about` | `InfoPage` | none | none | falls back to the About copy for any unmapped slug |
| `/how-to` | `InfoPage` | none | none | as above |
| `/privacy` | `InfoPage` | none | none | as above |
| `/404` + catch-all | `NotFound` | none | none | n/a |

Additional route-level findings:

- **Any thrown render error takes down the entire application**, including the header, nav and
  footer, because `ErrorBoundary` wraps everything above `SiteShell`. There is no route-level
  boundary.
- `ErrorBoundary` prints `this.state.error?.stack` directly to the user in production builds.
- `ErrorBoundary` has no `componentDidCatch`, and its only recovery path is
  `window.location.reload()`.
- `t()` in `AppSettingsContext` is `interpolate(translations[language][key], values)` with no
  guard. A missing key throws inside render, which trips the global boundary and blanks the app.
- `InfoPage` matches on `useRoute("/:slug")` and silently falls back to About for anything
  unmapped, so `/anything-single-segment` reached through `InfoPage` would show About content
  rather than 404 — in practice the `App.tsx` route list prevents this, but the component is
  not defensive on its own.

### Direct-route / refresh / deep-link risk

- `README.md` line 39 claims: *"It uses hash-based routes so direct visits to tool, game,
  settings, and information screens do not require server rewrite rules."* **This is false.**
- Grep for `useHashLocation` returns **zero hits**. `main.tsx` renders `<App />` with no
  `<Router hook={…}>`. wouter 3.7.1's default `Router` uses `useBrowserLocation`
  (`node_modules/.../wouter/esm/index.js:53` — `hook: useBrowserLocation`), i.e. the History API.
- All routes are therefore real paths. With `base: "./"` and static hosting, **refreshing or
  deep-linking any route other than `/` returns a 404 on GitHub Pages.**
- `server/index.ts` does contain an Express `app.get("*")` SPA fallback, but that server is
  irrelevant to the intended static host and is not used by `pnpm run build`'s client output.

### Route param remount hazard

wouter's `Switch` renders the matched route via `cloneElement(element, { match })`
(`wouter/esm/index.js:374`) with **no `key`**. Navigating `/games/snake` → `/games/tetris`
keeps the same component instance mounted, so `useState` initializers do not re-run.
This is a live data-corruption path — see §7.

---

## 5. Tools: registry vs. real operations

`client/src/data/tools.ts` builds `toolRegistry` from 12 `seeds`, expanding pipe-delimited
name strings. `client/src/lib/toolOperations.ts` `runTool()` is the only implementation surface:
a flat chain of `if (slug === …)` branches with a catch-all at the end.

**283 registry entries. 53 have a real operation. 230 (81.3%) are metadata-only stubs.**

Every unimplemented slug falls through to:

```ts
return { text: input || "Ready. Add an input to get an immediate browser-only result." };
```

That is, the tool page renders, accepts input, and echoes it back. There is no "not
implemented" signal of any kind — a stub is visually indistinguishable from a working tool.

| Group | Category label | Registry | Real ops | Stubs | Notes |
| --- | --- | --- | --- | --- | --- |
| `text` | Text & String | 44 | 23 | 21 | best-covered group |
| `crypto` | Crypto & Security | 19 | 7 | 12 | |
| `data` | Developer & Data | 50 | 12 | 38 | largest group, least covered relative to size |
| `image` | Image Studio | 45 | **0** | 45 | **entire category is non-functional** |
| `color` | Color Lab | 17 | 2 | 15 | |
| `math` | Calculators | 27 | 4 | 23 | |
| `time` | Date & Time | 11 | **0** | 11 | **entire category is non-functional** |
| `random` | Random & Generators | 18 | 3 | 15 | |
| `file` | File & PDF | 17 | 1 | 16 | the one "real" op does not read files — see below |
| `seo` | SEO & Web | 8 | **0** | 8 | **entire category is non-functional** |
| `misc` | Fun & Misc | 15 | 1 | 14 | the one "real" op only echoes input |
| `ai` | AI Tools | 12 | **0** | 12 | **entire category is non-functional** |
| **Total** | | **283** | **53** | **230** | |

### The 53 implemented slugs

`word-counter`, `case-converter`, `reverse-text`, `remove-extra-whitespaces`,
`remove-empty-lines`, `remove-line-breaks`, `remove-duplicate-lines`, `sort-list`,
`list-randomizer`, `string-shuffler`, `slug-generator`, `text-to-nato-alphabet`,
`text-to-ascii`, `text-to-binary`, `text-to-hex`, `morse-code`, `rot13-caesar-cipher`,
`base64-text`, `url-encode-decode`, `html-entities`, `email-normalizer`, `html-to-plain-text`,
`markdown-to-html`, `hash-generator`, `hmac-generator`, `uuid-generator`, `ulid-generator`,
`nanoid-generator`, `secure-token-generator`, `jwt-decoder-debugger`, `markdown-editor`,
`json-formatter-validator`, `json-minifier`, `yaml-formatter`, `toml-formatter`,
`xml-formatter`, `yaml-json-toml-xml-converter`, `sql-formatter`, `url-parser`,
`keyword-density-analyzer`, `chmod-calculator`, `math-evaluator`, `percentage-calculator`,
`bmi-calculator`, `random-number-generator`, `random-string-generator`, `email-validator`,
`hex-rgb-hsl-hsv-converter`, `color-picker`, `notes-pad`, `basic-calculator`,
`scientific-calculator`, `file-hash-calculator`.

### Broken or misleading among the "implemented" 53

| Slug | Problem |
| --- | --- |
| `math-evaluator`, `basic-calculator`, `scientific-calculator` | **Evaluates user input with `Function()`.** The guard is `/^[0-9+\-*\/().,%\s^sqrtincoaslogpie]+$/i`. The allowed letter set `{s,q,r,t,i,n,c,o,a,l,g,p,e}` still spells `alert(1)`, `location`, `open`, `process`. `constructor` is blocked only incidentally (no `u`). This is a code-execution primitive. |
| `hmac-generator` | The signing key is permanently the literal string `"your-secret-key"`. The slug is not in `ToolWorkspace`'s `needsMode` set, so `option` is always `"default"` and the ternary can never take the user-supplied branch. Output is cryptographically meaningless. |
| `file-hash-calculator` | Shares the `hash-generator` branch. There is **no file input anywhere in the UI** — it hashes the typed text. Name promises something the tool cannot do. |
| `list-randomizer`, `string-shuffler` | Uses `.sort(() => random - 0.5)`, a well-known biased and technically invalid comparator. |
| `random-number-generator` | Uses `Math.random()` while the sibling `random-string-generator` correctly uses `crypto.getRandomValues`. Inconsistent. |
| `notes-pad` | Echoes input. Not a tool. |
| `jwt-parser` | A live `runTool` branch with **no registry entry** — unreachable dead code. |
| `markdown-to-html`, `markdown-editor` | These are safe: output is `DOMPurify.sanitize(marked.parse(input))`. Recorded here only to confirm the HTML preview path was checked. |

No duplicate slugs exist in the registry.

### Tool descriptions are generated, not authored

`describeTool()` builds every description at runtime from templates:

```ts
en: `${verb} with ${name} in a focused browser workbench. ${localLine}`,
bn: `${name} দিয়ে নির্দিষ্ট কাজটি ব্রাউজারেই করুন। আপনার কাজ এই ডিভাইসেই থাকে।`,
```

So all 283 English descriptions are hardcoded English outside the translation dictionary, and
all 283 Bangla descriptions interpolate an untranslated English tool name into Bangla prose.

---

## 6. Games: playable, partially built, or placeholder

**32 registry entries. 0 implemented. All 32 are placeholder cards.**

There is exactly one game component — `client/src/pages/GamePage.tsx`, 23 lines — and it serves
every slug. Its entire "gameplay" is:

```tsx
const play = () => {
  const points = Math.max(10, Math.floor(Math.random() * 125));
  const next = progress.save.score + points;
  progress.update({ score: next, highScore: Math.max(progress.save.highScore, next),
                    level: Math.floor(next / 300) + 1, resources: progress.save.resources + 1 });
};
```

There is no canvas, no game loop, no `requestAnimationFrame`, no per-game module, no board
state, and no rules. Pressing the button adds a random score. Nothing distinguishes Snake from
Sudoku except the name, genre label and description text rendered above the same button.

Corroborating evidence that real game shells were designed and never built: the translation
dictionary contains `game.pause`, `game.resume`, `game.fullscreen` keys in both locales that
**no component references**.

### Input handling — per game (matters for Phase 3)

This section is deliberately explicit because the answer is uniform and that uniformity is the
finding.

**Current input surface for all 32 games:** a single `<button onClick={play}>` with the class
`game-action-button`. That is the whole thing.

- **Mouse:** yes — `onClick`.
- **Keyboard:** only the implicit native behaviour of `<button>` (Enter / Space activate it
  when focused). There are **no** `onKeyDown`, `onKeyUp`, or `onKeyPress` handlers anywhere in
  `client/src`, and no `window.addEventListener("keydown", …)`.
- **Touch:** only the browser's synthesized click from a tap. There are **no** `onTouchStart`,
  `onTouchMove`, `onTouchEnd` handlers anywhere.
- **Pointer:** there are **no** `onPointerDown`/`onPointerMove`/`onPointerUp` handlers anywhere.
- **Unified pointer/input abstraction:** **does not exist.** There is no input module, no
  gesture helper, no keybinding map, no virtual D-pad, no gamepad API use.

The `Game` type declares `controls: string`, and `games.ts` sets it to the literal
`"Keyboard / Touch"` for all 32 entries. **That field is never rendered by any component.** It is
an unverified claim in data, not a description of behaviour.

`home.gamesCopy` also advertises games "designed for keyboard and touch" in both locales. That
copy is currently untrue.

| # | Game | Slug | Genre | Status | Current input | Input the description implies Phase 3 must build |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Snake | `snake` | Arcade | placeholder | single button | 4-direction discrete (arrows/WASD + swipe) |
| 2 | Tetris | `tetris` | Puzzle | placeholder | single button | discrete move/rotate/soft-drop/hard-drop + repeat-rate |
| 3 | 2048 | `2048` | Puzzle | placeholder | single button | 4-direction discrete + swipe |
| 4 | Sky Hopper | `sky-hopper` | Arcade | placeholder | single button | single-action tap/keypress, timing-sensitive |
| 5 | Brick Breaker | `brick-breaker` | Arcade | placeholder | single button | continuous 1-axis (pointer drag / held keys) |
| 6 | Space Defenders | `space-defenders` | Shooter | placeholder | single button | continuous 1-axis + fire, simultaneous |
| 7 | Dino Dash | `dino-dash` | Runner | placeholder | single button | 2 discrete actions (jump/duck), hold-duck |
| 8 | Fruit Merge | `fruit-merge` | Puzzle | placeholder | single button | aim + release (drag), continuous x |
| 9 | Asteroids | `asteroids` | Shooter | placeholder | single button | rotate + thrust + fire held simultaneously |
| 10 | Maze Chaser | `maze-chaser` | Arcade | placeholder | single button | 4-direction continuous with buffered turns |
| 11 | Minesweeper | `minesweeper` | Logic | placeholder | single button | **two-button pointer** (reveal vs. flag) + long-press on touch |
| 12 | Sudoku | `sudoku` | Logic | placeholder | single button | cell selection + numeric entry (keyboard + on-screen pad) |
| 13 | 15 Puzzle | `15-puzzle` | Puzzle | placeholder | single button | tile tap + arrow keys |
| 14 | Memory Match | `memory-match` | Memory | placeholder | single button | discrete tap/click, focusable grid |
| 15 | Tic Tac Toe | `tic-tac-toe` | Board | placeholder | single button | discrete cell selection, 3×3 grid navigation |
| 16 | Connect Four | `connect-four` | Board | placeholder | single button | column selection |
| 17 | Checkers | `checkers` | Board | placeholder | single button | select-then-move (two-step), drag optional |
| 18 | Hangman | `hangman` | Word | placeholder | single button | **text/letter entry** — physical keyboard + on-screen keys |
| 19 | Word Grid | `word-grid` | Word | placeholder | single button | text entry + per-cell state |
| 20 | Word Search | `word-search` | Word | placeholder | single button | **drag path selection** ("গ্রিডে আঙুল টানুন" — finger drag) |
| 21 | Anagram Sprint | `anagram-sprint` | Word | placeholder | single button | letter tiles: tap or drag reorder |
| 22 | Geo Quiz | `geo-quiz` | Quiz | placeholder | single button | discrete option choice, timed |
| 23 | Math Sprint | `math-sprint` | Quiz | placeholder | single button | numeric entry, timed |
| 24 | Water Sort | `water-sort` | Puzzle | placeholder | single button | select source then target (two-step) |
| 25 | Block Fit | `block-fit` | Puzzle | placeholder | single button | **drag-and-drop with drop preview** |
| 26 | Tower Guard | `tower-guard` | Strategy | placeholder | single button | placement clicks + build menu |
| 27 | Idle Workshop | `idle-workshop` | Strategy | placeholder | single button | repeated tap + upgrade buttons (closest to current stub) |
| 28 | Hill Rider | `hill-rider` | Physics | placeholder | single button | 2 held actions (gas/brake), analog feel |
| 29 | Maze Runner | `maze-runner` | Maze | placeholder | single button | 4-direction continuous |
| 30 | Territory Loop | `territory-loop` | Action | placeholder | single button | 4-direction continuous, low latency |
| 31 | Pocket Pool | `pocket-pool` | Physics | placeholder | single button | **aim drag + power drag** (2-axis analog) |
| 32 | Type Blaster | `type-blaster` | Typing | placeholder | single button | **full text entry**, high key-rate |

Phase 3 implication: the eventual input abstraction needs at minimum discrete direction events,
continuous axis input, held-key state, two-button/long-press distinction, drag paths with
preview, and raw text entry. None of those primitives exist today.

### Other game-data findings

- `en` description for all 32 is generated: `` `${name} is an original, local-first browser mini game.` `` —
  hardcoded English, outside the translation dictionary.
- `featured: index < 8` — the first eight entries are featured purely by array position.
- `Idle Workshop` Bangla text contains a mixed-script typo: `মিনি টাইcoon`.
- Icons are assigned by `index % 3`, so the icon carries no meaning.

---

## 7. Persisted data: every key, shape, and sensitivity

Storage is **localStorage only**. There is no `sessionStorage` use and no `indexedDB` use
anywhere in `client/src`.

Two different prefix conventions are in use, which is itself a defect.

| Key | Written by | Shape | Sensitivity |
| --- | --- | --- | --- |
| `tgb:tool:<slug>:input` | `useToolInputMemory` | JSON string — raw tool input | **Medium.** Whatever the user typed. Guarded by an exclusion list (below), but the list has gaps. |
| `tgb:game:<slug>:state` | `useGamePersistence` | `{highScore:number, score:number, level:number, resources:number, updatedAt:string}` | Low |
| `tgb-language` | `AppSettingsContext` | `"en"` \| `"bn"` (raw string, not JSON) | Low |
| `tgb-appearance` | `AppSettingsContext` | theme id or `"system"` (raw string) | Low |
| `tgb-custom-themes` | `AppSettingsContext` | JSON array of `{id,name,isDark,tokens,custom}` | Low |
| `tgb-theme` | — (read only, legacy) | legacy appearance value | Low |
| `theme` | `contexts/ThemeContext.tsx` | `"light"`/`"dark"` | Low — **dead code**, provider never mounted |
| `sidebar_state` | `components/ui/sidebar.tsx` | cookie, not localStorage | Low — component unused |

Note the inconsistency: persistence helpers use the colon prefix `tgb:`, while all three
settings keys use a hyphen `tgb-`. `isAppKey`-style filtering does not exist, so nothing in the
codebase can reliably enumerate "our" keys.

### Sensitive-input exclusion, and where it fails

`useToolInputMemory.ts` holds a 12-slug `sensitiveSlugs` set: `password-generator`,
`password-strength-analyzer`, `passphrase-generator`, `bcrypt-hash-compare`,
`encrypt-decrypt-text`, `rsa-key-pair-generator`, `totp-otp-generator`,
`jwt-decoder-debugger`, `secure-token-generator`, `basic-auth-header`,
`bip39-mnemonic-generator`, `hmac-generator`.

For those 12, input is not written to localStorage. That part works.

`ToolWorkspace.tsx` keeps a **second, different** set of only 7 slugs to decide whether to show
the "sensitive input is never remembered" note. The five slugs present in the hook but missing
from the component — `password-strength-analyzer`, `passphrase-generator`,
`jwt-decoder-debugger`, `bip39-mnemonic-generator`, `hmac-generator` — are protected but do
**not** tell the user so. Two lists that must agree, don't.

Additional issues in the memory hook:

- Writes on **every keystroke**, no debounce.
- No size cap. A pasted multi-megabyte document is written to localStorage in full.
- `savedInput` is captured in a `useState` initializer. Combined with the wouter no-remount
  behaviour from §4, navigating from tool A to tool B keeps tool A's restore banner and value.

### The export / clear / import boundary is where privacy actually breaks

```ts
export function exportLocalData(): DataBundle {
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key) localStorageData[key] = localStorage.getItem(key) ?? "";
  }
  …
}

export function mergeDataBundle(bundle: DataBundle): StorageResult<number> {
  for (const [key, value] of Object.entries(bundle.localStorage)) {
    localStorage.setItem(key, value);      // no namespace check, no allowlist
    imported += 1;
  }
  …
}

export function clearAllLocalData() {
  try { localStorage.clear(); return true; } catch { return false; }
}
```

Three separate defects:

1. **Export captures the entire origin.** Not just `tgb*` keys — *every* key on the origin. On
   GitHub Pages, `https://<user>.github.io` is a **single shared origin across all of that
   user's Pages projects.** So "Download my data" can silently vacuum up another app's
   localStorage — including anything sensitive that app stored — into a JSON file the user then
   shares or uploads. The careful 12-slug exclusion list is bypassed entirely at this layer.
2. **Clear wipes the entire origin.** `localStorage.clear()` destroys sibling Pages apps' data.
   `data.clear.description` promises only "All local settings, saves and history" of this app.
3. **Import writes arbitrary keys with arbitrary values.** No namespace check, no key allowlist,
   no per-value size cap, no total size cap. A hand-edited or hostile "backup" can plant or
   overwrite any key on the origin.

Also in `DataManager.tsx`: `clearStage` (0 → 1 → 2 click-to-confirm) is component state that is
**never reset when the dialog closes**. Click "Clear" twice, close the dialog, reopen it, and a
single click now wipes everything with no further confirmation.

`downloadDataBundle()` calls `URL.revokeObjectURL(anchor.href)` synchronously on the line after
`anchor.click()`, and never appends/removes the anchor from the DOM. The same pattern is
repeated in `ToolWorkspace.tsx`'s `download()`.

Import success is reported as `t("data.imported")` = *"{count} local data items restored.
Refresh the page."* — the count is truthful, but the imported settings do not apply until a
manual reload because React state is not refreshed.

---

## 8. Weight on the initial screen

### The built HTML is almost entirely a dev-tooling script

`dist/public/index.html` is **367,873 bytes**, of which **366,824 bytes (99.7%)** is a single
inline `<script id="manus-runtime">` injected by `vite-plugin-manus-runtime` (configured in
`vite.config.ts`). Because it is inline it is uncacheable, unminifiable by the app, and
parse-blocking on every single page load. This is development tooling shipped to production.

`vite.config.ts` also hardcodes `.manuspre.computer`, `.manus.computer`, `.manus-asia.computer`,
`.manuscomputer.ai`, `.manusvm.computer` into `server.allowedHosts`, and registers a
`manus-debug-collector` plugin and a `manus-storage-proxy` dev middleware.

### JavaScript: one 1,083.78 kB chunk, no code splitting

Because `App.tsx` statically imports every route, and `ToolPage → ToolWorkspace →
lib/toolOperations.ts` statically imports every tool library, **the home page downloads every
tool's parser.** Attribution below is from an `esbuild --bundle --minify --metafile` probe of
`client/src/main.tsx` (1037.8 KB accounted for; the real Vite chunk is 1083.78 KB raw /
320.48 KB gzip — the small delta is Vite's own preamble and differing minifier settings).

| Package | Minified KB | Share | On the home screen? |
| --- | --- | --- | --- |
| `sql-formatter` | 279.3 | 26.9% | **yes, and unused there** |
| `react-dom` | 176.9 | 17.0% | yes (required) |
| *app source* | 113.9 | 11.0% | yes |
| `crypto-js` | 68.9 | 6.6% | **yes, and unused there** |
| `js-yaml` | 53.3 | 5.1% | **yes, and unused there** |
| `marked` | 41.6 | 4.0% | **yes, and unused there** |
| `toml` | 35.0 | 3.4% | **yes, and unused there** |
| `sonner` | 33.5 | 3.2% | yes (Toaster mounted globally) |
| `dompurify` | 28.7 | 2.8% | **yes, and unused there** |
| `fast-xml-parser` | 26.0 | 2.5% | **yes, and unused there** |
| `tailwind-merge` | 24.1 | 2.3% | yes |
| `lucide-react` | 13.1 | 1.3% | yes |
| remainder | ~137 | ~13% | Radix primitives, `@floating-ui`, `wouter`, `uuid`, `ulid`, `nanoid` |

Roughly **530 KB minified of tool-only parsing libraries load before the user has opened a
single tool.**

### The real heaviest asset is not JavaScript

`client/src/pages/Home.tsx` renders three images hotlinked from GitHub:

```
https://raw.githubusercontent.com/MdMarufHossen71/Tools-Games/main/assets/tools-games-hero.png
https://raw.githubusercontent.com/MdMarufHossen71/Tools-Games/main/assets/tools-games-games.png
https://raw.githubusercontent.com/MdMarufHossen71/Tools-Games/main/assets/tools-games-ai.png
```

Local file sizes:

| File | Bytes |
| --- | --- |
| `assets/tools-games-hero.png` | 4,797,334 (4.6 MB) — **above the fold** |
| `assets/tools-games-games.png` | 6,085,729 (5.8 MB) |
| `assets/tools-games-ai.png` | 5,101,399 (4.9 MB) |
| **total** | **~15.2 MB** |

None of them are lazy-loaded, none declare `width`/`height` (guaranteed layout shift), there is
no `<picture>`/WebP/AVIF path, and no error or fallback state. `assets/` is **not** inside
`client/public/`, so the build never copies them — the page depends on `raw.githubusercontent.com`
being reachable, which is a third-party request from a privacy-first app and is rate-limited
rather than CDN-served.

**This is ~14× the weight of the JavaScript problem and should be treated as the top
performance item.**

### CSS

`dist/public/assets/index-BqbRcGV2.css` — 134.89 kB raw / 22.95 kB gzip.
`client/src/index.css` line 1 is a **render-blocking third-party font import**:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap');
```

`ideas.md` specifies **Noto Sans Bengali** for Bangla copy. It is not requested here, and
**no Bengali font is loaded anywhere.** All Bangla text renders in a system fallback.

### Declared-but-unreachable dependencies (53)

Never reached from `main.tsx`: `@hookform/resolvers`, 24 unused `@radix-ui/*` packages, `axios`,
`bcryptjs`, `bip39`, `browser-image-compression`, `card-validator`, `cmdk`, `colord`,
`cron-validate`, `cronstrue`, `diff`, `embla-carousel-react`, `express`, `framer-motion`,
`iban`, `input-otp`, `jose`, `jsbarcode`, `jszip`, `libphonenumber-js`, `otpauth`, `papaparse`,
`pdf-lib`, `qr-code-styling`, `react-day-picker`, `react-hook-form`,
`react-resizable-panels`, `recharts`, `streamdown`, `tailwindcss-animate`, `vaul`, `zod`.

Several of these (`bip39`, `otpauth`, `jose`, `bcryptjs`, `jsbarcode`, `qr-code-styling`,
`pdf-lib`, `jszip`, `papaparse`, `browser-image-compression`) are exactly the libraries the
230 stub tools would need — they were installed and never wired up.

### Dead source files (unreachable from `main.tsx`)

`client/src/components/ManusDialog.tsx`, `client/src/components/Map.tsx`,
`client/src/const.ts`, `client/src/contexts/ThemeContext.tsx`,
`client/src/hooks/useMobile.tsx`, and transitively `client/src/hooks/useComposition.ts`,
`client/src/hooks/usePersistFn.ts`.

Unused exports: `isThemeTokens` (`data/themes.ts`), `canRememberToolInput`
(`hooks/useToolInputMemory.ts`), and `groupMeta` is imported by `ToolCard.tsx` but never used
there.

`client/public/tools.json` is a 302-byte note file that ships to `dist/`.

`template.json` at the repo root preserves the original scaffold — it shows `App.tsx` once used
a `ThemeProvider` and `Home` was a `Streamdown` example page, which explains the dead template
leftovers above.

---

## 9. Hardcoded strings outside the translation system

The dictionary itself is in good shape: **160 keys in `en`, 160 in `bn`, zero drift in either
direction.** The problem is the components that bypass it.

Genuinely unreferenced keys (declared in both locales, used nowhere):
`theme.label`, `common.example`, `common.close`, `common.resume`, `common.save`,
`game.pause`, `game.resume`, `game.fullscreen`, `ai.recorder`,
`static.notFound.title`, `static.notFound.copy`.

The last two are notable: a fully translated 404 exists in the dictionary and the actual
`NotFound` page ignores it.

| Location | Hardcoded text | Language |
| --- | --- | --- |
| `pages/NotFound.tsx` | `404`, `Page Not Found`, `Sorry, the page you are looking for doesn't exist.`, `It may have been moved or deleted.`, `Go Home` | English only |
| `components/ErrorBoundary.tsx` | `An unexpected error occurred.`, `Reload Page` | English only |
| `components/ThemePanel.tsx` | ~15 labels: `Background`, `Surface`, `Text`, `Primary accent`, `Secondary accent`, `Borders`, `APPEARANCE`, `CUSTOM`, `LIVE PREVIEW`, `Useful work, clearly styled.`, `Component card`, `Clean token hierarchy`, `A styled input`, `Primary action`, `Secondary link →` | English only |
| `components/ToolWorkspace.tsx` | 9 `<option>` labels: `Default`, `Decode`, `Words`, `Lines`, `Z → A`, `Bulk ×10`, `YAML`, `XML`, `Unescape`; `aria-label="Tool mode"`; `` aria-label={`${tool.name} input`} `` | English only |
| `pages/GamePage.tsx` | inline bilingual literal: `` {language === "bn" ? "Play চাপুন, দ্রুত score তুলুন ও নিজের সেরা স্কোর ভাঙুন।" : "Press Play, collect points quickly, and beat your personal best."} `` | both, inline |
| `pages/Tools.tsx` | `aria-label="Tool category filter"` | English only |
| `pages/Settings.tsx` | `CONTROL ROOM`, `PRIVATE STORAGE` | English only |
| `pages/InfoPage.tsx` | `TOOLS & GAMES BD` | English only |
| `pages/Home.tsx` | `01 / TOOLS`, `02 / SELECT`, `03 /`, `04 /` | English only |
| `components/SiteShell.tsx` | `aria-label="Tools & Games BD home"`, `aria-label="Main navigation"`, `aria-label="Open menu"`, `TOOLS&GAMES`, `BANGLADESH`, `BD`, `© 2026 Tools & Games BD` | English only |
| `data/tools.ts` | all 283 generated `en` descriptions + the Bangla template | both, generated |
| `data/games.ts` | all 32 generated `en` descriptions; `controls: "Keyboard / Touch"` | English only |
| `data/links.ts` | `` const make = (…) => ({ … description: { bn, en: bn } }) `` — **all 22 English link descriptions are literally the Bangla string** | broken |
| `lib/toolOperations.ts` | every thrown/returned message: `Use numerical expressions only`, `Enter a valid octal mode e.g. 755`, `Use a 6-digit HEX color`, `Input error: …`, `Ready. Add an input to get an immediate browser-only result.`, `Your notes are stored locally in this browser.`, `Present — not verified locally`, `Missing`, plus all JSON result labels (`Underweight`, `Healthy range`, …) | English only |
| `workbench-overrides.css` | `content:"INSTRUMENT TRAY"` on every 11th tool card | English only, in CSS |

`ToolWorkspace.tsx` also renders **both** `tool.description.en` and `tool.description.bn`
simultaneously regardless of the active language, using the class `font-bengali` — **a class
that is not defined in any CSS file in the repository.**

---

## 10. Accessibility, responsive, and mobile findings

### Missing or wrong accessible names

- Search inputs on `Tools`, `Games`, `Links`, and the `SiteShell` **mobile drawer** have a
  `placeholder` but no `aria-label` and no `<label>`. Only the desktop header search has
  `aria-label={t("search.aria")}`.
- All filter chips (`Tools`, `Games`, `Links`) are `<button>`s that convey selected state
  **only** by the `active` class and its background color. No `aria-pressed`. This is also a
  colour-only status signal.
- Mobile menu button: `aria-label="Open menu"` is static — it still says "Open menu" while
  open — and there is no `aria-expanded` or `aria-controls`.
- `<select>` elements in `ToolWorkspace` (`aria-label="Tool mode"`) and `ThemePanel` are
  labelled in hardcoded English.
- `ThemePanel`'s appearance `<select value={appearance}>` has **no `"system"` option**, even
  though `"system"` is the default value — so the control renders with no matching option
  selected on a fresh visit.
- `ThemePanel` renders `Object.values(theme.tokens).map(color => <i key={color} …>)` —
  **duplicate React keys** whenever two tokens share a hex value.
- No `aria-live` region exists for copy success, download success, or validation errors. The
  only `role="status"` in the codebase is `DataManager`'s status paragraph.
- Copy/download icon buttons do have `aria-label`s. Tooltips are not attached to them despite
  `TooltipProvider` being mounted app-wide.

### Heading hierarchy

Tool cards use `<h3>` while game cards use `<h2>`, for the same visual role in the same grid
position. `Home` has an `<h1>` then `<h2>` section headings then `<h3>` cards, which is fine;
`Settings` renders `<h1>` then `ThemePanel`'s headings, which start at `<h2>`/`<h3>` but are
also used for token labels.

### Zoom and viewport

`client/index.html` (26 lines, 934 bytes):

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
```

`maximum-scale=1` **blocks pinch-zoom**, which fails WCAG 1.4.4 / 2.2 reflow expectations on
mobile. Also in that file:

- `<script src="%VITE_ANALYTICS_ENDPOINT%/umami" data-website-id="%VITE_ANALYTICS_WEBSITE_ID%">`
  — unresolved placeholders, source of two of the four build warnings. This is a **tracking
  script stub** in a privacy-first app.
- A leftover placeholder comment: `THIS IS THE START OF A COMMENT BLOCK, BLOCK TO BE DELETED`.
- No `lang` variation handling, no per-page `<title>`/description (all routes share one title).

### Responsive breakpoints

Only three media queries exist across both CSS files: `max-width: 900px`,
`max-width: 640px`, and `prefers-reduced-motion: reduce`.

The confirmed layout gap:

```css
/* workbench-overrides.css line 7 */
@media (max-width:900px) { .header-search { display:none; } … }
/* index.css line 41 */
@media (max-width:640px) { … .nav-links { display:none; } .mobile-menu-button { display:grid; } … }
```

Between **641px and 900px** the header search is hidden *and* the mobile menu button is still
`display:none`, while `.nav-links` is still visible. Search is unreachable in that whole band —
which covers portrait tablets and large phones in landscape.

Other responsive risks found by reading the CSS:

- `.directory-grid .tool-card:nth-child(11n+1)` uses `grid-column: span 2`, and the 900px
  override keeps `span 2` while the grid drops to 2 columns — a spanning card becomes the full
  row width, which is intended, but combined with `.game-card:nth-child(9n+1) { grid-column: span 2 }`
  at a 3-column game grid it produces uneven trailing rows at 768px.
- `.hero-visual::before { inset: 0 -100vw 0 10% }` uses a `-100vw` negative inset. It is inside
  an `overflow:hidden` parent so it should be contained, but it is a horizontal-overflow risk
  worth verifying at 320px.
- `.game-orbit` is 340px and 520px wide inside `.game-playfield` — larger than a 320px viewport.
  The parent is `overflow:hidden`, so this should clip rather than scroll; verify.
- `body { min-width: 320px }` sets a hard floor; below 320px the page scrolls horizontally.

### Motion

`button { transition: transform 150ms …; }` and `.tool-card::after { transition: transform .22s }`
are both inside the 120–220ms guidance. But:

- `NotFound.tsx` has `animate-pulse` on a decorative ring — **looping ornamental motion**, and
  it is the only page-level animation in the app.
- `prefers-reduced-motion` is handled once, globally, with
  `*,*::before,*::after { transition:none!important; animation:none!important; }` — broad but
  effective.

### Colour token integrity

`:root` in `index.css` sets `--muted: #ffffff` and `--secondary: #ffffff`, identical to
`--card: #ffffff`. So "muted" surfaces are indistinguishable from cards in the default theme.

Worse, `AppSettingsContext` writes at runtime:

```ts
root.style.setProperty("--muted-foreground", tokens.text);
root.style.setProperty("--secondary-foreground", tokens.text);
root.style.setProperty("--card-foreground", tokens.text);
root.style.setProperty("--primary-foreground", activeTheme.isDark ? "#ffffff" : "#ffffff");
```

`--muted-foreground` being set to the full-strength text colour **destroys the muted/primary
text hierarchy the CSS relies on** — every `.tool-card p`, `.empty-state`, `.hero-stats`,
footer link, and helper text loses its intended de-emphasis the moment the theme effect runs.
And `--primary-foreground` is hardcoded to white for light themes too, so a light-primary
custom theme produces white-on-light text.

Also drifting from `ideas.md`: the documented palette is Electric Cobalt `#3264FF`, deep ink
navy `#0A1025`, warm paper `#F7F6F1`. The actual light preset in `data/themes.ts` is
`#f7f9fc` / `#2563eb`, and `index.css` hardcodes roughly two dozen one-off hex values outside
the token system (`#111a29`, `#eef4ff`, `#8fb7ff`, `#72a4ff`, `#bccce7`, `#42516a`, `#9aaccc`,
`#5770a2`, `#b9cdf8`, `#7ca7fc`, `#edf3ff`, `#bdcde8`, `#16223a`, `rgba(19,32,53,.92)`,
`#405171`, `#9abcfb`, `#aabbd7`, `#ef4444`, `#fff`) — so themes cannot recolour the hero, the
games feature band, or the floating cards.

`toggleTheme: () => setAppearanceState(theme === "dark" ? "light" : "dark")` silently discards
whichever preset the user had selected (Nord, Dracula, …) and jumps to the plain light/dark
preset.

`ThemePanel`'s `saveCustomTheme` hardcodes `isDark: true` for every custom theme regardless of
the tokens chosen.

---

## 11. Licence inconsistency — logged, not resolved

Four locations. Three say MIT, one says GPL-3.0. **Not resolved in this phase, per instruction.**

| Location | Says |
| --- | --- |
| `LICENSE` (674 lines, begins `GNU GENERAL PUBLIC LICENSE / Version 3, 29 June 2007`) | **GPL-3.0** |
| `package.json` → `"license": "MIT"` | MIT |
| `README.md` line 51 | MIT |
| `client/src/i18n/translations.ts` → `footer.open`, both `en` and `bn` | `MIT License` |

The `footer.open` string is rendered twice on every page (footer brand block and footer bottom
bar), so the MIT claim is the one users actually see. A 674-line GPL-3.0 file is unlikely to be
accidental boilerplate; conversely the MIT claim appears in three independent places. This needs
an explicit decision from the repository owner before either is changed.

---

## 12. Documentation accuracy

`README.md`:

- Line 39 claims hash-based routing. **False** — see §4.
- Line 51 claims MIT. **Conflicts with `LICENSE`** — see §11.

`todo.md` (11 lines) is stale: 8 of its 9 items are unchecked, but the storage utility, the
translation dictionary, the My Data panel, tool input memory, and game persistence are all
implemented in the tree.

---

## 13. Top risks, ranked

1. **The product is roughly 19% real.** 230 of 283 tools (81.3%) are metadata-only stubs that
   silently echo input, and all 32 games are the same placeholder button. A user cannot tell a
   working tool from a stub.
2. **Privacy guarantee fails at the export/clear/import boundary.** `exportLocalData()` dumps
   the entire origin into a downloadable file, `clearAllLocalData()` calls
   `localStorage.clear()` on the entire origin, and `mergeDataBundle()` writes arbitrary keys
   with no allowlist or size cap. On GitHub Pages that origin is shared with every other Pages
   project the user owns.
3. **`Function()` evaluation of user input** in `math-evaluator` / `basic-calculator` /
   `scientific-calculator`, behind a character allowlist that still permits `alert(1)`,
   `location`, and `open`.
4. **~15.2 MB of hotlinked PNGs on the home page** (4.6 MB above the fold) from
   `raw.githubusercontent.com`, plus a 367.9 kB `index.html` that is 99.7% inline dev-tooling
   script, plus a single unsplit 1,083.78 kB JS chunk carrying ~530 KB of tool parsers the home
   page never calls.
5. **Every deep link and refresh 404s on the intended host.** There is no hash routing despite
   the README claiming it, so `/tools/word-counter` only works via in-app navigation.

Runners-up worth naming: the 641–900px band where search is unreachable; `--muted-foreground`
being overwritten with the full text colour, collapsing the entire type hierarchy;
`maximum-scale=1` blocking zoom; the unresolved `%VITE_ANALYTICS_*%` tracking-script stub in a
privacy-first app; and `data/links.ts` shipping Bangla text as the English description for all
22 links.
