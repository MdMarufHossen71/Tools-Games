# Arcade Implementation Memory

- The existing `/games` route currently points to an informational placeholder and must be replaced with the arcade page before playable routes are registered.
- `games_progress` and `leaderboard` already exist in the schema, but there are no database helpers or API procedures for game persistence yet.
- The global design system uses CSS variables such as `--background`, `--card`, `--text`, `--muted`, `--primary`, and `--border`.
- The generated art-direction asset is asynchronous but may be referenced immediately through its stable Manus storage path.
- Desktop verification on 15 Aug 2026 confirmed that `/games`, `/games/wordle`, and `/games/snake` render with the catalog grid, player chrome, controls, and canvas surface. A mobile review surfaced invisible unfilled Wordle tiles caused by the arcade stylesheet referencing unaliased site tokens; the explicit token bridge and cell surface correction now require re-verification. RTL checks remain required before the arcade phase can close.
- The follow-up 360px Wordle review confirmed six visible, touch-ready rows of five blank cells after the token bridge. Wordle’s Bengali set now uses five-code-point words to match that board, and solo Tic Tac Toe now uses an automated O opponent.
