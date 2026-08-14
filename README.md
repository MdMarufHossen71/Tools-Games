# Tools & Games BD

**Tools & Games BD** is a privacy-first browser workbench for everyday utilities, developer helpers, image and file tasks, and quick local games. It is built as a static React and TypeScript application: ordinary inputs, preferences, saved game states, and optional AI-provider keys remain in the visitor's browser.

## Highlights

| Area | What is included |
|---|---|
| Tools | A searchable browser-side directory across text, crypto, developer, image, color, calculator, time, file, SEO, and generator categories. |
| File Share | QR/manual-peer WebRTC pairing for consent-based file, folder, text, and one-time Password Share messages between browsers. |
| Games | A locally saved games catalogue with score, level, and resource persistence. |
| Localization | **Default language is English; full Bangla UI is available via the language toggle.** Tool names remain in English for familiar search and SEO, while descriptions are supplied in both English and Bangla. |
| Appearance | Light, Dark, and 10 developer-inspired presets, plus a six-token custom-theme builder with import, export, edit, and delete controls. |
| Privacy | No account requirement, server-side tool processing, or user tracking logic is built into the app. |

## Your data stays in your browser

> **আপনার ডেটা আপনার browser-এই থাকে। Settings → আমার ডেটা থেকে download/import/clear করতে পারবেন।**

The **Settings → My Data** area provides a single JSON backup of browser-stored preferences, language selection, theme definitions, supported tool drafts, game saves, notes, and any optional locally stored AI configuration. Imported backups are merged safely after confirmation. Clearing data requires a second confirmation. If browser storage is full or unavailable, the application displays a warning and continues without crashing.

Sensitive inputs, including generated passwords, encryption text, TOTP seeds, JWT data, and secret tokens, are intentionally excluded from per-tool input memory.

### File Share and Password Share

The **File Share — Nearby Device Transfer** tool uses PeerJS only to help two browsers discover each other. Files, folders, and messages then move through the WebRTC data channel, subject to the receiver accepting each requested transfer. The tool cannot invoke WiFi Direct or Bluetooth from the browser.

Password Share keeps its password card in browser memory only. Each peer creates a short-lived ECDH key pair for the active WebRTC connection; the sender derives an AES-GCM encryption key from that connection secret and an optional extra passphrase. The encrypted card is removed from both browsers after the receiver copies it or when its chosen expiry elapses. Password cards are never written to localStorage, user data exports, or an application server.

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
- PeerJS WebRTC data channels with ephemeral Web Crypto key exchange
- Client-side formatting, conversion, cryptography, and parsing libraries

## License

MIT
