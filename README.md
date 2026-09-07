# Tools & Games BD

**Tools & Games BD** is a privacy-first browser workbench for everyday utilities, developer helpers, image and file tasks, and quick local games. It is built as a static React and TypeScript application: ordinary inputs, preferences, saved game states, and themes remain in the visitor's browser.

## Highlights

| Area | What is included |
|---|---|
| Tools | A searchable browser-side directory across text, crypto, developer, image, color, calculator, time, file, SEO, and generator categories. 53 tools fully implemented; the rest show an honest “Not built yet” state instead of fake output. |
| Games | 5 playable games (Snake, Tetris, 2048, Sky Hopper, Brick Breaker) with keyboard + touch controls and local high-score persistence. 27 further games are listed as “Coming soon”. |
| Localization | **Default language is English; full Bangla UI is available via the language toggle.** Tool names remain in English for familiar search and SEO, while descriptions are supplied in both English and Bangla. |
| Appearance | Light, Dark, and 10 developer-inspired presets, plus a six-token custom-theme builder with import, export, edit, and delete controls. |
| Privacy | No account requirement, server-side tool processing, or user tracking logic is built into the app. Fonts load from Google Fonts (standard request data); everything else runs locally. |

## Your data stays in your browser

> **আপনার ডেটা আপনার browser-এই থাকে। Settings → আমার ডেটা থেকে download/import/clear করতে পারবেন।**

The **Settings → My Data** area provides a single JSON backup of this app's
namespaced (`tgb:`) browser data only: preferences, language selection, theme
definitions, supported tool drafts, game saves, and notes. Foreign keys from
other sites on the same origin are never exported, cleared, or overwritten.

- **Export:** downloads only `tgb:` keys (oversize values skipped).
- **Import:** validates size (≤2 MB), JSON, source (`Tools & Games BD`), version
  (1–2), shape, namespace, and per-value limits *before* writing anything.
  Choose **Merge** (backup wins on conflict, rest kept) or **Replace** (app data
  cleared first, then restore). Nothing applies until you confirm; failures leave
  existing data untouched and report a localized reason.
- **Clear:** removes only this app's keys after an explicit confirmation dialog.
- If browser storage is full or unavailable (private browsing), the app warns
  and continues without crashing.

Sensitive inputs — the whole crypto category plus password/passphrase/secret/
token/TOTP/JWT/encrypt/decrypt patterns — are never written to storage, never
exported, and show a “never remembered” note.

## Run locally

Requires `corepack pnpm` (pnpm 10.4.1, Node 24 observed):

```bash
corepack pnpm install
corepack pnpm dev
```

Checks, tests, and build:

```bash
corepack pnpm run check
corepack pnpm run test
corepack pnpm run build
```

Extra audits (plain Node, no runner):

```bash
node scripts/i18n-parity.mjs
node scripts/hardcoded-strings.mjs
node scripts/class-audit.mjs
node scripts/theme-contrast.mjs
```

## Deployment

The site is designed for static hosting, including GitHub Pages. It uses
hash-based routes (`#/tools/word-counter`) so direct visits, refreshes, and
deep links work without server rewrite rules; `client/public/404.html` covers
old path-style links.

## Browser support and limitations

- Needs `localStorage`, Web Crypto (`crypto.subtle`), `clipboard`, `FileReader`/`arrayBuffer`.
- Private browsing: storage calls fall back gracefully with a warning.
- `crypto.subtle` requires a secure context (https or localhost).
- Hash tools provide SHA-1/256/384/512. MD5/SHA3 are not offered; SHA-1 is a
  checksum only — never use hashes to store passwords.
- File hashing caps at 50 MB per file; data backups cap at 2 MB / 2000 keys.

## Game controls

All 5 playable games: keyboard-only and touch-only full rounds supported.
Bindings are shown in each game's UI and localized.

| Game | Keyboard | Touch |
|---|---|---|
| Snake | Arrows/WASD move, Esc/P pause, R restart, Space/Enter start | 4-way d-pad + swipe |
| Tetris | ←→↓ move, ↑/X rotate right, Z rotate left, Space hard-drop, Esc/P pause, R restart | ←→↓ d-pad + ↻/↺/⤓ buttons + swipe (down = hard-drop) |
| 2048 | Arrows/WASD slide, Esc/P pause, R restart | 4-way d-pad + swipe |
| Sky Hopper | Space/Enter hop, Esc/P pause, R restart | Wide action button + tap board |
| Brick Breaker | ←→/AD paddle, Space/Enter launch, Esc/P pause, R restart | ◀▶ buttons + wide launch + drag paddle |

Games pause on tab switch, survive resize/rotate, reset cleanly on double
restart, and persist best score locally. The remaining 27 games show a localized
“Coming soon” state until they pass the same checklist.

## Technology

- React 19 + TypeScript + Vite
- Wouter with hash routing
- Tailwind CSS v4 with CSS custom-property theme tokens
- Browser-native storage, file, and Web Crypto APIs
- Vitest for unit tests

## License

MIT — see `LICENSE`.
