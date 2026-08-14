# Tools & Games BD

**Tools & Games BD** is a privacy-first browser workbench for everyday utilities, developer helpers, image and file tasks, and quick local games. It is built as a static React and TypeScript application: ordinary inputs, preferences, saved game states, and optional AI-provider keys remain in the visitor's browser.

## Highlights

| Area | What is included |
|---|---|
| Tools | A searchable browser-side directory across text, crypto, developer, image, color, calculator, time, file, SEO, and generator categories. |
| Games | A locally saved games catalogue with score, level, and resource persistence. |
| Localization | **Default language is English; full Bangla UI is available via the language toggle.** Tool names remain in English for familiar search and SEO, while descriptions are supplied in both English and Bangla. |
| Appearance | Light, Dark, and 10 developer-inspired presets, plus a six-token custom-theme builder with import, export, edit, and delete controls. |
| Privacy | No account requirement, server-side tool processing, or user tracking logic is built into the app. |

## Your data stays in your browser

> **আপনার ডেটা আপনার browser-এই থাকে। Settings → আমার ডেটা থেকে download/import/clear করতে পারবেন।**

The **Settings → My Data** area provides a single JSON backup of browser-stored preferences, language selection, theme definitions, supported tool drafts, game saves, notes, and any optional locally stored AI configuration. Imported backups are merged safely after confirmation. Clearing data requires a second confirmation. If browser storage is full or unavailable, the application displays a warning and continues without crashing.

Sensitive inputs, including generated passwords, encryption text, TOTP seeds, JWT data, and secret tokens, are intentionally excluded from per-tool input memory.

## Run locally

```bash
pnpm install
pnpm dev
```

Run a type check and production build with:

```bash
pnpm check
pnpm build
```

## Deployment

The site is designed for static hosting, including GitHub Pages. It uses hash-based routes so direct visits to tool, game, settings, and information screens do not require server rewrite rules.

## Technology

- React 19 + TypeScript + Vite
- Wouter for lightweight hash routing
- Tailwind CSS v4 with CSS custom-property theme tokens
- Browser-native storage and file APIs
- Client-side formatting, conversion, cryptography, and parsing libraries

## License

MIT
