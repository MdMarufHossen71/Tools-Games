# Build Checklist (post Phase 5)

- [x] Safe namespaced (`tgb:`) localStorage utility with quota/unavailable handling.
- [x] Translation dictionary + useTranslation hook; English default, EN ⇄ বাংলা toggle.
- [x] CSS-token theme presets, Appearance selector, custom builder, import/export.
- [x] My Data export (namespaced only), validated import with merge/replace confirm, scoped clear.
- [x] Non-sensitive per-tool input restoration (debounced, 32 KB cap, slug-scoped).
- [x] Game high-score/progress persistence with validation (v2, clamp, self-heal).
- [x] Hash routing + per-page titles/meta + route-level error boundary.
- [x] 5 games keyboard+touch playable; 27 honestly marked coming-soon.
- [x] Route-level code splitting; Web Crypto hashes; real file hashing.
- [x] Vitest suite (61 tests): storage, slug, sensitive, i18n, tool ops, game saves.
- [x] README privacy/export/import/clear/GitHub Pages/controls docs; MIT license.
- [ ] Per-tool dynamic import of `sql-formatter` (deferred: needs async workspace rework).
- [ ] Self-hosted fonts (deferred: kept Google Fonts + disclosed per owner choice).
- [ ] Remaining 27 games (deferred: each needs full keyboard+touch build + checklist).
