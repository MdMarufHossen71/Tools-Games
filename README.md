# ToolsHUB

**ToolsHUB** is a multilingual browser platform for free tools, games, AI assistance, curated links, and private cloud utilities. Its public promise is: **“Tools • Games • AI — All in One.”** The application is available in English, বাংলা, Hindi, Urdu, Arabic, Spanish, French, and German. Arabic and Urdu use a right-to-left interface.

## Release summary

| Area | Current implementation |
|---|---|
| Tools | 244 catalogue entries across 12 browser-tool categories; all routes use the reusable client-side ToolPage workspace. |
| Games | 45 catalogue games; 8 playable browser games; online Tic Tac Toe and Connect Four use a relay-only room lobby. |
| AI | Streaming SSE chat, honest guest/member limits, and authenticated conversation history. |
| Personal data | Encrypted file sharing, encrypted URL targets, encrypted clipboard, notes/version history, and client-encrypted vault records. |
| Content | Published blog, SEO metadata, 2,173 editable Useful Links records, including Bangladesh service links. |
| Admin | Role-gated overview, user suspension, content shortcuts, tool visibility, announcements, file-share oversight, and short-link revocation. |

## Architecture

```text
React 19 + TypeScript + Tailwind CSS 4
        │
        ├── tRPC 11 contracts ── Express 4 server
        │                         ├── Manus OAuth sessions
        │                         ├── AI streaming SSE endpoint
        │                         ├── Heartbeat daily-challenge handler
        │                         ├── HTTP CSP and API rate limiting
        │                         └── Forge S3-compatible storage helpers
        │
        └── Drizzle ORM ── MySQL/TiDB
                                  ├── user, settings, games, blog, links
                                  ├── secure file/clipboard/URL metadata
                                  └── rooms, messages, admin configuration
```

The canonical contracts are in `server/routers.ts`; relational definitions are in `drizzle/schema.ts`; database helpers are in `server/db.ts`; and client routes are registered in `client/src/App.tsx`.

## Privacy and security

ToolsHUB uses a memory-first policy for routine browser-tool inputs. Sensitive server-side records use application encryption and access controls. Password-vault encryption and key derivation happen in the browser. Multiplayer WebRTC configuration is **TURN relay only**: it excludes STUN servers, uses `iceTransportPolicy: "relay"`, rejects non-relay candidates in development, and uses cryptographically random room tokens.

The Express entry point adds a restrictive Content Security Policy, baseline browser hardening headers, scoped API rate limits, and safe error responses. The scheduled daily challenge route accepts authenticated Heartbeat traffic and safely rejects unauthenticated requests.

## Primary routes

| Route | Purpose |
|---|---|
| `/` | ToolsHUB home, categories, featured tools, games, and blog highlights. |
| `/tools`, `/tools/:slug` | Tool catalogue and private browser workspace. |
| `/games`, `/games/:slug` | Arcade catalogue and playable games. |
| `/games/lobby`, `/games/room/:roomToken` | Relay-only multiplayer lobby and private rooms. |
| `/ai` | Streaming AI assistant and saved conversations. |
| `/data` | Secure files, clipboard, notes, vault, and short links. |
| `/links` | Searchable Bangladesh services and curated links library. |
| `/blog`, `/blog/:slug` | Blog discovery and article reading. |
| `/privacy` | Data controls and relay-only multiplayer disclosure. |
| `/admin` | Role-gated administration console. |

## Catalogue inventory

### Tools

The complete, named tool inventory is the source-controlled `categories` manifest in [`client/src/data/catalog.ts`](client/src/data/catalog.ts). This provides the canonical list of all 244 visible tool routes and avoids a separate, drift-prone duplicate. The categories are **Math (20)**, **Text & Lists (20)**, **Images (32)**, **PDF (16)**, **Colors (18)**, **Date & Time (16)**, **Encoding & Crypto (20)**, **Web & Dev (24)**, **Audio & Video (16)**, **Fun & Creative (18)**, **File Utilities (16)**, and **Numbers & Random (18)**.

### Games

The complete game manifest is [`client/src/data/games.ts`](client/src/data/games.ts). The catalogue consists of the following entries:

| Group | Game names |
|---|---|
| Words | Wordle, Word Sprint, Spelling Bee, Anagram, Word Search, Hangman, Typing Race, Letter Stack |
| Puzzle | 2048, Sudoku, Minesweeper, Memory Match, Sliding Puzzle, Block Puzzle, Color Flow, Number Merge, Match Three, Maze Runner |
| Arcade | Snake, Tetris, Breakout, Flappy Flight, Space Dodge, Asteroid Dash, Bubble Pop, Fruit Slice, Whack-a-Mole, Neon Runner |
| Multiplayer | Tic Tac Toe, Connect Four, Checkers, Chess Lite, Reversi, Battleship, Dominoes, Ludo, Solitaire |
| Casual | Idle Garden, Cozy Café, Farm Days, Fishing Trip, Cookie Clicker, Tower Defense, Dice Quest, Paper Plane |

The currently playable single-player experiences are **Wordle** (separate English and বাংলা modes), **2048**, **Snake**, **Tetris**, **Memory Match**, **Minesweeper**, **Sudoku**, and **Tic Tac Toe**. **Tic Tac Toe** and **Connect Four** are available through the private multiplayer lobby.

## Local validation

```bash
pnpm check
pnpm test
```

The verified release suite currently contains **52 assertions across 25 test files**, covering security policy, authentication/logout, error recovery, tool privacy, translation coverage, link imports, score/session/streak validation, daily challenges, TURN credentials, multiplayer rules, friendship records, Useful Links keyboard controls, and AI-history safeguards.

## Deployment and daily challenge schedule

Create a release checkpoint, then use the project interface’s **Publish** action. After the site is deployed, create the daily challenge schedule and bind its returned task ID according to [`docs/daily-challenge-deployment.md`](docs/daily-challenge-deployment.md). The intended schedule is midnight UTC:

```bash
manus-heartbeat create --name daily-challenge --cron "0 0 0 * * *" --path /api/scheduled/dailyChallenge
```

Do not use an in-process timer for this work. The scheduler must call the deployed, authenticated Heartbeat route.

## Known integration limitation

ToolsHUB uses the supplied Manus OAuth flow. Google and GitHub buttons are intentionally not shown because the current template does not expose a free built-in provider for those identities, and no external credentials were requested or introduced.
