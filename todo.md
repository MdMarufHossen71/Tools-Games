# Build Checklist (post Phase 5)

- [x] Safe namespaced (`tgb:`) localStorage utility with quota/unavailable handling.
- [x] Translation dictionary + useTranslation hook; English default, EN ⇄ বাংলা toggle.
- [x] CSS-token theme presets, Appearance selector, custom builder, import/export.
- [x] My Data export (namespaced only), validated import with merge/replace confirm, scoped clear.
- [x] Non-sensitive per-tool input restoration (debounced, 32 KB cap, slug-scoped).
- [x] Game high-score/progress persistence with validation (v2, clamp, self-heal).
- [x] Hash routing + per-page titles/meta + route-level error boundary.
- [x] 32 games keyboard+touch playable; no coming-soon entries remain.
- [x] Route-level code splitting; per-tool lazy parser chunks; Web Crypto hashes; real file hashing.
- [x] Vitest suite (128 tests): storage, slug, sensitive, i18n, tool ops, game saves, per-game logic, lazy-chunk resolution.
- [x] README privacy/export/import/clear/GitHub Pages/controls docs; MIT license.
- [x] Per-tool dynamic import of `sql-formatter` (+ yaml/toml/xml/marked): single async `runTool` path with chunk-on-first-use.
- [x] Self-hosted fonts decision: kept Google Fonts + disclosed per owner choice.
- [ ] Device smoke on physical keyboard + touch per phase3-changes.md shortlist (maintainer step).
