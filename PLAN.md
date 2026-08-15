# Game Plan: ToolsHUB Arcade

## Risk Tasks

### 1. Stateful browser-game loops and pause behavior
- **Why isolated:** Multiple games use timers, animation frames, and keyboard listeners; leaking any of these across route changes can duplicate scores or degrade browser performance.
- **Approach:** Give each playable game a mount-scoped state model, cancel animation frames and timers in cleanup, and centralize pause/fullscreen/sound controls in a reusable game frame.
- **Verify:** Pausing freezes time-based movement and score changes; restart returns to a deterministic initial state; unmounting a game leaves no active keyboard response or console error.

### 2. Word validation and score submission boundaries
- **Why isolated:** English and Bangla Wordle must remain distinct game modes, while leaderboard writes must reject invalid or implausible scores server-side.
- **Approach:** Keep small client word sets per language mode and submit only bounded score, duration, and game metadata through authenticated procedures.
- **Verify:** Changing language mode changes the target word set; submitted scores are clamped and owner-scoped; guests can play without a sign-in wall.

## Main Build

Build a responsive games catalog with more than 40 localized entries, category filtering, search, clear multiplayer markings, and routes to playable titles. Ship a reusable arcade game frame with pause/resume, sound preference, fullscreen capability, keyboard hints, and touch-friendly controls. The initial playable set comprises Wordle (English and বাংলা), 2048, Snake, Tetris, Memory Match, Tic Tac Toe, Minesweeper, and Sudoku.

## Next genuine playable arcade batch

The next release adds **Breakout**, **Flappy Flight**, **Fruit Slice**, and **Space Dodge** as real browser games. Each must provide a visible objective, start/restart state, responsive pointer or touch input, desktop keyboard or mouse equivalent, score feedback, bounded animation state, and route cleanup. A game is not marked playable until its dispatcher route and interaction loop are present.

- **Visual reference:** `/manus-storage/tools-hub-arcade-direction_e4b157b4.png`
- **Input rules:** drag or arrow keys for Breakout; tap/click/space for Flappy Flight; pointer/touch swipes for Fruit Slice; pointer or arrow keys for Space Dodge.
- **Catalogue rule:** The public Games grid remains playable-only. Future titles are not shown with a misleading launch action.

- **Assets needed:** One generated wide arcade art-direction image used in the games hero as a low-opacity visual texture: `/manus-storage/toolshub-games-arcade-reference_b0860ad0.png`.
- **Verify:**
  - Catalog search and category filtering produce a readable card grid at desktop and 360px widths.
  - Keyboard inputs and visible tap controls perform the equivalent game action.
  - Pause, restart, sound preference, and fullscreen actions are reachable from every playable game.
  - Scores persist for authenticated players after server validation, while every listed game remains playable as a guest.
  - No browser-console errors during captured game interactions.
  - Reference consistency: deep-indigo/violet visual accents, modular cards, and accessible contrast.
