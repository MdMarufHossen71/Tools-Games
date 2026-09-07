# Phase 3 changes — all 32 games playable with keyboard and touch

Date: 2026-09-07. Base: `docs/inventory.md` (0 playable), prior engine work.
Toolchain: corepack pnpm 10.4.1. No engine input changes were needed — every
primitive below already existed; these sessions added game-side rules,
content, and the first consumers of `letters`, `keypad`, `longPress`,
`secondary`, `erase`, and `useBoardNavigation`.

## Batches

- Batch 1 (S): tic-tac-toe, connect-four, memory-match, 15-puzzle, hangman, geo-quiz, math-sprint.
- Batch 2 (M): word-grid, anagram-sprint, word-search, type-blaster, minesweeper, sudoku, maze-runner, space-defenders, dino-dash, water-sort, block-fit, idle-workshop.
- Batch 3 (L): asteroids, maze-chaser, checkers, fruit-merge, hill-rider, pocket-pool.
- Batch 4 (XL, full versions): territory-loop, tower-guard.

## Per-game controls and verification

Automated suite (all passing at write time): `pnpm check`, `pnpm test`
(124 tests incl. per-game logic: win scans, AI takes/blocks, clueing,
solvability, generators, physics, economy), `pnpm build` (each game its own
lazy chunk), `i18n-parity` 0 problems, `hardcoded-strings` 0 problems.
Resize/tab-switch/restart/persistence behavior is inherited from the shared
engine (`useGameSession`, `useGameLoop`, `useGameCanvas`) and covered by
existing persistence tests — not re-proven per game by hand here.

Device play-through (physical keyboard-only round + touch-only round per
game) remains the maintainer's smoke step before release; the table records
what was verified in code versus on device.

| Game | Keyboard | Touch | Logic tests | Device play |
|---|---|---|---|---|
| Snake | Arrows/WASD, Esc/P, R | d-pad + swipe | — (reference) | prior |
| Tetris | ←→↓, ↑/X rotate, Z, Space drop | d-pad + ↻↺⤓ + swipe | — | prior |
| 2048 | Arrows/WASD | d-pad + swipe | — | prior |
| Sky Hopper | Space/Enter | wide button + tap | — | prior |
| Brick Breaker | ←→/AD, Space | ◀▶ + launch + drag | — | prior |
| Tic Tac Toe | Arrows + Enter/Space | tap cell | minimax takes/blocks/centre | pending |
| Connect Four | Arrows + Enter/Space, ● Action | tap column / Action | scan, win-take, block | pending |
| Memory Match | Arrows + Enter/Space | tap card | deck pairs | pending |
| 15 Puzzle | Arrows + Enter/Space | tap tile | solved/parity/neighbours | pending |
| Hangman | A–Z (R suppressed) | A–Z pad | word list | pending |
| Geo Quiz | Tab + Enter | tap choice | round shape | pending |
| Math Sprint | 0–9, Backspace, Enter | 1–9 pad + 0 + ⌫ + submit | answer bounds | pending |
| Word Grid | A–Z, Backspace, Enter | A–Z pad + ⌫ + submit | clueing incl. duplicates | pending |
| Anagram Sprint | A–Z, Backspace, Enter, F skip | A–Z pad + submit/skip/erase | scramble purity | pending |
| Word Search | Arrows + Enter/Space anchor | finger drag | line constraint, placement | pending |
| Type Blaster | A–Z, Backspace | A–Z pad + erase | word list | pending |
| Minesweeper | Arrows, Enter/Space, Shift+Enter/F | tap + long-press | neighbours, safe deal, flood | pending |
| Sudoku | Arrows, 1–9, Backspace, F notes | tap + keypad | generator, conflicts | pending |
| Maze Runner | Arrows/WASD | d-pad + swipe | gen + BFS solves | pending |
| Space Defenders | ←→, Space, Shift/F | d-pad + fire + bomb | — | pending |
| Dino Dash | ↑/Space, ↓ hold | ▲▼ + swipe | — | pending |
| Water Sort | Arrows, Enter, Backspace | tap source → dest | pour/solve/deal | pending |
| Block Fit | Arrows, Enter, F | tap tray → tap cell | rotate/fit/clear/dead | pending |
| Idle Workshop | Tab + Enter/Space | tap buttons | pricing | pending |
| Asteroids | ←→ rotate, ↑ thrust, Space, Shift/F | rotate + thrust + fire + hyperspace | safe spawn | pending |
| Maze Chaser | Arrows/WASD | d-pad + swipe | maze invariants | pending |
| Checkers | Arrows + Enter | tap piece → tap target | forced/multi/promotion/AI | pending |
| Fruit Merge | ←→, Space | drag aim, release drops | — | pending |
| Hill Rider | →/↑ throttle, ←/↓ brake | d-pad held | terrain consistency | pending |
| Pocket Pool | ←→ aim, ↑↓ power, Space | pull-back drag / tap aim | collision swap | pending |
| Territory Loop | Arrows/WASD | d-pad + swipe | closed-loop claim | pending |
| Tower Guard | Arrows, Enter, F, Backspace | shop buttons + cursor | road/economy/waves | pending |

## Engine consumers added (previously unused)

`letters` (hangman, word-grid, anagram-sprint, type-blaster), `keypad`
(math-sprint, sudoku), `longPress` (minesweeper), `secondary`
(anagram-sprint skip, sudoku notes, space-defenders bomb, tower-guard
upgrade), `erase` (word-grid, math-sprint, anagram-sprint, sudoku,
water-sort undo, tower-guard sell), `useBoardNavigation` (all DOM boards),
`useGameInterval` (quiz/sprint timers, idle income).

## Notes and deferred items

- `ComingSoon.tsx` stays for no current slug (every catalog entry is
  registered); it remains the honest fallback if a slug is ever removed.
- Recommended device smoke before release: one keyboard-only + touch-only
  round each of checkers (AI + chains), word-search (drag + anchor),
  pocket-pool (drag shoot), tower-guard (shop + wave), territory-loop
  (claim + cut), plus a mid-run rotate and tab-switch on any two.
- No new network call, tracking, backend, or secret persistence introduced
  across any batch. Word/quiz banks are curated inline lists, offline.
