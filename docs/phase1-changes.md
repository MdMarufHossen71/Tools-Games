# Phase 1 changes — storage, tool input memory, game persistence, routing and error handling

This document records what changed in Phase 1, why each change was made, and the product
decisions taken as safe defaults where the brief left a choice open. It is written against
`docs/inventory.md` (Phase 0), which remains the ground truth for file paths, the package
manager, and the real npm scripts.

Package manager: **pnpm 10.4.1**, invoked as `corepack pnpm …` because `pnpm` is not on the
PATH in this environment. Real scripts: `dev`, `build`, `start`, `preview`, `check`, `format`.
There is no `test` script.

---

## 1. Storage layer

**Files:** `client/src/lib/storage.ts` (+361/-…), `client/src/components/DataManager.tsx`,
`client/src/contexts/AppSettingsContext.tsx`.

### What changed

**Every app-owned key is namespaced.** All keys now live under a single `tgb:` prefix, built
through helpers rather than written as literals:

- `settingsKey(name)` for application settings (`tgb:settings:language`, `…:appearance`,
  `…:customThemes`).
- `toolKey(slug)` for remembered tool input (`tgb:tool:word-counter`).
- `gameKey(slug)` for game state (`tgb:game:2048`).

Nothing outside the `tgb:` prefix is read, written, exported, or deleted by the app.

**A one-time migration moves legacy keys.** The previous build wrote hyphen-prefixed keys
(`tools-games-language` and similar). `migrateLegacyKeys()` copies each known legacy key to its
namespaced equivalent, then removes the old one. It runs once per page load, guarded by a
module-level flag in `AppSettingsContext` (`ensureMigrated()`), so the cost is paid once even
though three separate readers call it during the first render.

**Every storage call goes through a result type instead of throwing.** The module exposes a
discriminated union:

```ts
type StorageResult<T> = { ok: true; value: T } | { ok: false; reason: StorageFailure };
```

`StorageFailure` enumerates the real failure modes: unavailable storage (private browsing,
disabled cookies, sandboxed iframe), quota exhaustion, malformed JSON, a shape that fails
validation, and an oversized payload. Callers branch on the reason instead of catching an
exception, and `safeGet` / `safeSet` wrap the result for the common "just give me a value or a
default" case. A `localStorage` access that throws — which it does in Safari private mode and
in some embedded webviews — no longer propagates into a React render.

**"Clear my data" only clears app-namespaced keys.** The implementation enumerates
`localStorage` keys, filters to those starting with `tgb:`, and removes exactly those. There is
no `localStorage.clear()` anywhere in the codebase. Keys belonging to any other application
sharing the origin are left alone, and the count of removed keys is reported back to the user.

**Export writes a validated, versioned envelope.** The export payload carries an explicit
schema version and a source marker, and it is assembled from validated app-owned data rather
than a raw dump of storage. Object URLs are revoked and the temporary anchor element is removed
after the download is triggered — the revoke is deferred to the next task rather than run
synchronously, because revoking in the same tick cancels the download in Chromium.

**Import validates before it writes anything.** The pipeline is: parse JSON, check the source
marker, check the schema version against the supported range, check the top-level shape, check
that every key is inside the `tgb:` namespace, check each value's type against what that key is
allowed to hold, and check the total payload size against a byte limit. Only after every check
passes does the first write happen. If any check fails, nothing is written, existing data is
untouched, and the specific failure reason is surfaced through a localized message —
`FAILURE_KEYS: Record<StorageFailure, TranslationKey>` in `DataManager.tsx` maps each reason to
a translation key, so the mapping is exhaustive at compile time and adding a new failure reason
without a message is a type error.

**Imported settings reflect immediately.** `AppSettingsContext` exposes
`refreshFromStorage()`, which re-runs the three validating readers (`readLanguage`,
`readAppearance`, `readCustomThemes`) and pushes the results into React state. The data manager
calls it after a successful import, so language and theme change on screen without a reload.

**A schema version and a migration hook exist.** The envelope carries a version number, and the
import path routes through a migration point, so a future format change has somewhere to live
rather than requiring a breaking change to the reader.

---

## 2. Tool input memory

**Files:** `client/src/hooks/useToolInputMemory.ts`, `client/src/lib/sensitiveTools.ts` (new),
`client/src/components/ToolWorkspace.tsx`.

### What changed

**Sensitive tools never persist input, and the rule fails closed.** `sensitiveTools.ts` holds
the policy in one place. The entire `crypto` group is excluded outright, and a pattern test
additionally excludes any slug containing terms such as password, secret, key, token, hash,
encrypt, decrypt, jwt, or totp. A tool has to pass both gates before a single keystroke is
persisted. Because the group exclusion is category-wide rather than a hand-maintained slug list,
a security tool added later is private by default without anyone remembering to add it.

**Writes are debounced and size-limited.** Input is written after a short idle delay rather than
on every keystroke, and a byte cap is enforced before the write. Input over the cap is simply
not stored — a 5 MB paste into a formatter does not silently consume the origin's storage quota
or fail the write for every other key.

**Restore is scoped to the exact tool and shape.** Stored state records the tool slug and is
only applied when the slug matches the tool currently mounted and the value passes a type check.
Stale state from a renamed or restructured tool is discarded rather than fed into the tool.

**A localized "forget this input" control exists.** The restore banner offers dismissal, and
clearing removes the key for that tool only. All of its copy comes from the translation
dictionary.

---

## 3. Game persistence

**File:** `client/src/hooks/useGamePersistence.ts`.

### What changed

**Stored state is validated before use, and failure falls back to a fresh game.** The hook takes
a validator for the game's state shape. Anything that fails — corrupted JSON, a shape from an
older version of the game, a value of the wrong type — is discarded and the game starts clean.
A stale save can no longer crash a game, which previously it could: state was read and handed
straight to the game logic.

**High scores are kept separately from resumable progress.** A discarded in-progress state does
not take the high score with it, and a validator failure on one does not invalidate the other.

**Large and transient data is not persisted.** A size cap applies here as well, and per-frame or
per-tick values are excluded from what gets written.

**Storage failures surface without breaking the game.** When persistence is unavailable, the
game still plays; a localized `.game-storage-warning` explains that progress will not be saved.

---

## 4. Routing and error handling

**Files:** `client/src/lib/hashLocation.ts` (new), `client/src/lib/slug.ts` (new),
`client/src/App.tsx`, `client/src/pages/NotFound.tsx`,
`client/src/components/ErrorBoundary.tsx`, `client/src/hooks/usePageMeta.ts` (new),
`client/public/404.html` (new).

### What changed

**Routing is hash-based, through a custom location hook.** See decision 1 below for the
reasoning. `hashLocation.ts` provides `useHashPath` and `useHashSearch`, both built on
`useSyncExternalStore`, and `App.tsx` wires them in as
`<Router hook={useHashPath} searchHook={useHashSearch}>`. The query string now lives inside the
hash, so `location.search` is never populated with app state.

**Slugs are decoded and validated defensively.** `slug.ts` normalizes an incoming slug —
`decodeURIComponent` inside a try/catch, then a character-shape check — before it is used as a
registry lookup or a storage key. A malformed percent-escape yields a not-found page instead of
a thrown `URIError`.

**Components remount when a route parameter changes.** The patched `wouter` `Switch` calls
`cloneElement(element, { match })` without a `key`, so a navigation from one tool to another
reused the same component instance and kept the previous tool's state. Explicit `key={slug}` at
the tool and game route call sites forces a remount.

**Not-found and unavailable states are localized, accessible, and on-brand.** `NotFound.tsx`
takes all-optional props so it serves both the unknown-route case and the "this specific tool or
game does not exist" case. It renders as `role="region"` with `aria-labelledby` pointing at its
own heading, its actions are real links and buttons, and it is styled from theme tokens with the
cobalt left rule used elsewhere in the app.

**Route-level failures no longer take down the app shell.** `ErrorBoundary` gained a
`variant?: "app" | "route"` prop. The route variant renders inside the shell so the header and
navigation survive a page-level crash; the app variant supplies its own full-height frame
because it sits above the shell. Because the app-level boundary is mounted above the settings
provider, it cannot call `useSettings()`; it instead does a minimal direct read of the language
key from storage for its own copy. The stack trace is rendered only under
`import.meta.env.DEV`.

**Per-page titles and meta are set where they were missing.** `usePageMeta(titleKey, copyKey)`
sets `document.title` and the meta description from translation keys, so every page has a
meaningful title in both languages.

---

## Product decisions taken as safe defaults

Each of these was a choice the brief left open. They are recorded here because they change
behaviour, not just implementation.

**1. Hash routing, with a custom hook rather than wouter's stock one.** Path-based deep links
and refreshes return a 404 on GitHub Pages, which has no rewrite rules. Three signals said hash
routing was the intent all along: `README.md` line 39 already described the app as using hash
routing, the original `Tools.tsx` parsed `window.location.hash` by hand for its query
parameters, and the deployment target is static hosting. wouter's built-in `useHashLocation` was
not usable as-is because it leaves the query string in the real `location.search`, which then
persists across hash navigations; hence the custom hook.

**2. `client/public/404.html` added as a fallback for old path-style links.** Any inbound
`/tools/word-counter` link now lands on a small page that rewrites itself to
`/#/tools/word-counter`. It derives the site base by looking for known route segments in the
path rather than assuming a fixed number of leading segments, so it works both at a domain root
and under a `/repo-name/` GitHub Pages base.

**3. Unimplemented tools show an explicit "unavailable" state.** Previously a stub tool echoed
its input back unchanged, which is indistinguishable from a working tool that happened to be a
no-op — actively misleading for something like a hash generator. `IMPLEMENTED_TOOLS` lists the
51 slugs with real implementations, and anything else renders a clear unavailable panel. The 51
is 53 minus the two removals below.

**4. The `hmac-generator` implementation was removed rather than fixed.** Its key was hardcoded
to the literal string `"your-secret-key"`, so every HMAC it produced was cryptographically
meaningless while looking authoritative. Shipping a security tool that invites misplaced trust
is worse than not shipping it. The dead `jwt-parser` entry was also dropped.

**5. The whole `crypto` category is excluded from input memory, plus pattern matching on top.**
Fail-closed by category rather than by an allow-list of known-bad slugs, so a security tool
added in future is private without a follow-up change.

**6. Structural field names in JSON tool output stay English.** Keys in generated JSON are
identifiers that a consumer may parse, not prose for a reader. Only prose values are localized.

**7. The three-press "Clear my data" button was replaced with a single confirmation dialog.**
Requiring three presses of the same button is a discoverability problem, not a safety feature:
there is no statement of what will be deleted, and it is easy to trigger by accident and equally
easy to abandon halfway. The dialog names what will be removed and reports the result. The
`clearStage` counter state was deleted.

**8. Import merge-versus-replace is an explicit radio choice.** It was previously implicit.
Each mode carries a description of what it does, and the post-import report is per-mode and
accurate about what was added, overwritten, and skipped.

**9. The `light` and `dark` theme presets were realigned to the Cobalt Workshop palette.**
`data/themes.ts` had defaults that did not match `ideas.md`. They now use luminous paper
`#f7f6f1`, deep ink navy `#0a1025`, Electric Cobalt `#3264ff`, and coral as the sparing accent.
The dark preset lifts cobalt to `#5b85ff` so it still clears 4.5:1 as label and link text on an
ink surface. The ten recognisable developer palettes (Nord, Solarized, and so on) were
deliberately left untouched — they are opt-in choices where fidelity to the original palette
matters more than internal consistency.

**10. A derived `--primary-text` token was introduced instead of changing the brand hex.**
Electric Cobalt `#3264ff` reaches only 4.41:1 against the `#f7f6f1` paper background, so
eyebrows, inline links, and helper labels sat just below WCAG AA. Rather than alter the
documented brand colour, `readableAccent()` in `lib/color.ts` nudges the accent away from the
surface until it clears the ratio, and `AppSettingsContext` publishes the result as
`--primary-text`. For the light preset that is `#2f5ded` — 4.96:1 on background, 5.33:1 on
surface. `--primary` keeps the exact documented hex for fills, rules, and focus rings, where the
3:1 non-text ratio applies. Thirteen cobalt-as-text declarations in `index.css` were switched to
`--primary-text`; icon-only usages were deliberately left on `--primary`. Because the value is
derived at runtime, user-defined custom themes get the same protection automatically.

`--border-strong` was also re-derived, from `mix(border, text, 0.25)` to `0.42`. At 0.25 it
measured 2.26:1 on paper, below the 3:1 that WCAG 2.2 asks of interactive boundaries; at 0.42 it
is `#848486` at 3.54:1. `--border` stays a decorative hairline.

**11. Fifty-two undefined CSS class names were implemented.** This was not on the Phase 1 list
but blocked verifying anything else. A class audit found that `.workbench`, `.workbench-header`,
`.bench-grid`, `.bench-panel`, `.bench-label`, `.tool-textarea`, `.tool-output`, `.tool-note`,
`.privacy-chip`, `.restore-banner`, the whole data-manager dialog, the error boundary, and the
not-found panel had never had styles — `index.css` was unmodified in git history, so the tool
bench, which is the app's core feature, had always rendered unstyled. All 52 are now defined
using custom properties only, so a user-defined theme repaints them along with everything else.
Every error, warning, danger, and selected state carries a bar, an inset rule, or a tint in
addition to its colour, so status is never conveyed by colour alone.

**12. Two local audit scripts were added.** `scripts/class-audit.mjs` cross-checks every
project class name used in `client/src` against the stylesheets and exits non-zero on a miss.
`scripts/theme-contrast.mjs` checks nine contrast ratios per theme preset, importing the real
`lib/color.ts` helpers via Node's `--experimental-strip-types` so the numbers it reports are the
numbers the browser renders. Shortfalls in the two default presets fail the run; shortfalls in
the opt-in developer palettes warn. Both are local, dependency-free, and make no network
requests.

---

## Privacy and dependency confirmation

- **No new network call was introduced.** No `fetch`, `XMLHttpRequest`, `WebSocket`,
  `EventSource`, `navigator.sendBeacon`, or dynamically injected script or image was added by
  Phase 1. Export and import move data through a local file the user chooses; nothing leaves the
  browser.
- **No analytics or tracking was introduced.** (The pre-existing `%VITE_ANALYTICS_*%` umami stub
  in `client/index.html` predates this phase and is queued for removal in Phase 2.)
- **No backend dependency was introduced.** Persistence is `localStorage` only. No database, no
  account system, no always-on server. `pnpm run build` still produces a static bundle that
  works from a file server.
- **No new runtime dependency was added.** `package.json` is unchanged.
- **No sensitive data is persisted.** The entire `crypto` tool group plus a pattern test on slug
  names are excluded from input memory, and `hmac-generator` was removed rather than left in a
  state that invited trust. No password, key, seed, token, or private key is written to storage
  or included in an export.
- **No `eval`, `new Function`, or unsanitized HTML injection was introduced.** The HTML preview
  surface renders into a sandboxed context and no user string is passed to
  `dangerouslySetInnerHTML`.
- **Static hosting still works.** No framework migration; hash routing makes deep links and
  refreshes survive on GitHub Pages, which is stricter than what path routing needed.
- **English remains the default** and the English/Bangla toggle still works. The `lang`
  attribute on `<html>` updates with the language.
- **No git operation was performed.** Nothing was committed, pushed, or branched, and no GitHub
  settings were touched.

---

## Verification

The full Phase 0 suite was re-run after all Phase 1 changes, using the real scripts confirmed in
Phase 0. Every command below was run from the repository root.

| Command | Result | Compared to Phase 0 baseline |
| --- | --- | --- |
| `corepack pnpm install` | Success, 3.9s. One warning: `Ignored build scripts: @tailwindcss/oxide, esbuild.` | Same warning, unchanged. Faster only because the store was already warm. |
| `corepack pnpm run check` | Clean. `tsc --noEmit` emitted no diagnostics. | Unchanged: clean at baseline, clean now. |
| `corepack pnpm run build` | Succeeds in 14.04s with the same four warnings as baseline. | Unchanged in kind. Sizes grew, see below. |
| `corepack pnpm run test --if-present` | `ERR_PNPM_NO_SCRIPT  Missing script: test` | Unchanged. There is still no `test` script. |
| `npx prettier --check .` | `Code style issues found in 116 files. Run Prettier with --write to fix.` | Was 107 files at baseline. The nine added files are the entire difference; see the note below. |
| `node scripts/class-audit.mjs` | `All project class names are defined in a stylesheet.` Exit 0. | New check, no baseline. It failed with 52 missing classes when first written. |
| `node --experimental-strip-types scripts/theme-contrast.mjs` | All 12 presets `PASS`. `0 failure(s) in default presets, 0 warning(s) in opt-in presets.` Exit 0. | New check, no baseline. It failed on the `light` default preset and warned on Solarized Dark when first written. |

### Build warnings (all four pre-date Phase 1)

```
(!) %VITE_ANALYTICS_ENDPOINT% is not defined in env variables found in /index.html. Is the variable mistyped?
(!) %VITE_ANALYTICS_WEBSITE_ID% is not defined in env variables found in /index.html. Is the variable mistyped?
<script src="%VITE_ANALYTICS_ENDPOINT%/umami"> in "/index.html" can't be bundled without type="module" attribute
(!) Some chunks are larger than 500 kB after minification.
```

The first three come from an umami analytics stub already present in `client/index.html` before
this project began. It is inert — the environment variables are undefined, so nothing is
requested — but it is queued for removal in Phase 2 because the project's stated commitment is
no analytics at all. The chunk-size warning reflects the fully static import graph; code
splitting is a Phase 3 concern.

### Bundle sizes

| Artifact | Phase 0 | After Phase 1 | Change |
| --- | --- | --- | --- |
| `dist/public/index.html` | 367.92 kB (gzip 105.67 kB) | 367.92 kB (gzip 105.67 kB) | unchanged |
| `dist/public/assets/index-*.css` | 134.89 kB (gzip 22.95 kB) | 139.97 kB (gzip 23.77 kB) | +5.08 kB raw, +0.82 kB gzip |
| `dist/public/assets/index-*.js` | 1,083.78 kB (gzip 320.48 kB) | 1,118.78 kB (gzip 330.35 kB) | +35.00 kB raw, +9.87 kB gzip |
| `dist/index.js` (server) | 788 b | 788 b | unchanged |

The CSS growth is the 52 previously-undefined classes now having rules. The JS growth is the
validating storage layer, the hash-location hook, the tool workspace states, and the added
translation keys. `index.html` is dominated by the 366,824-byte inline
`vite-plugin-manus-runtime` script, which is why it did not move.

### Note on the Prettier result

Prettier reports 116 files, up from 107 at the Phase 0 baseline. The nine additional files are
exactly the nine files Phase 1 created: `client/src/lib/color.ts`, `lib/hashLocation.ts`,
`lib/sensitiveTools.ts`, `lib/safeMath.ts`, `hooks/usePageMeta.ts`, `scripts/class-audit.mjs`,
`scripts/theme-contrast.mjs`, `docs/phase1-changes.md`, and `client/public/404.html`.
(`lib/slug.ts` happens to pass.)

Prettier was deliberately not run. `.prettierrc` sets `printWidth: 80`, while the existing
codebase is written in deliberately dense single-line declarations well past 200 columns — which
is why 107 files already failed before any of this work started. Reformatting the nine new files
to 80 columns would make them the odd ones out rather than bring the repository into line, and
running `prettier --write .` would produce a whole-repository reformat diff that has nothing to
do with Phase 1 and would bury the actual changes. Reconciling the config with the codebase's
real style is worth doing, but it is its own change, not a side effect of this one.

### Browser verification

The dev server was run (`corepack pnpm run dev`, which binds **port 3000**, not Vite's default
5173) and the rendered result inspected through the browser. Confirmed live on
`#/tools/word-counter`:

- `.workbench`, `.workbench-header`, `.bench-grid`, `.bench-panel`, `.bench-label`,
  `.bench-actions`, `.tool-textarea`, `.tool-output`, and `.privacy-chip` all resolve to real
  computed values rather than falling back to browser defaults.
- `.bench-label` computes `min-height: 44px`, meeting the touch-target floor.
- `.privacy-chip` computes `border-radius: 999px` from `--radius-pill`, confirming the token
  scale is wired.
- `.tool-textarea` and `.tool-output` both compute `min-height: 230px`, so an empty bench does
  not collapse.
- `--primary`, `--primary-text`, and `--border-strong` are all populated on
  `documentElement.style` by the theme effect (observed values under the dark preset:
  `#5b85ff`, `#5b85ff`, `#7f859b`).
- Hash routing resolves: `#/tools` lists tool links in the `#/tools/<slug>` form,
  `#/tools/word-counter` renders the tool, and an unknown slug renders the localized not-found
  panel instead of a blank page or a crash.

### Incidental finding

`vitest 2.1.9` is present as a devDependency but there is no `test` script and no test files.
This was true at Phase 0 as well. A test harness is therefore already available if a later phase
wants one; nothing was added or wired up here, since the brief for this phase called for the
narrowest relevant check rather than establishing a test suite.

