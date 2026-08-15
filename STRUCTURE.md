# ToolsHUB Arcade Structure

The arcade stays inside the existing React application. `client/src/data/games.ts` is the single catalog for labels, localized descriptions, categories, and routing. `client/src/pages/Games.tsx` handles discovery and filtering. `client/src/pages/GamePlay.tsx` resolves individual routes and mounts a playable component inside `GameFrame`.

Reusable browser-game mechanics live in `client/src/components/games/`. Each game owns only its board state; `GameFrame` owns non-game UI such as pause, restart, sound preference, fullscreen, and score submission. Server-side game procedures reuse `games_progress` and `leaderboard` tables, accept bounded score payloads, and derive the authenticated owner from the session.

The first set uses CSS and DOM boards for reliable responsive and accessible controls, reserving requestAnimationFrame for time-based games such as Snake and Tetris. The generated arcade reference is a decorative background asset only and does not affect gameplay state.
