# SignedPrice UI consistency and reliability

> **For agentic workers:** Use executing-plans. The Site owner integrates source changes; parallel agents provide read-only research.

**Goal:** Make the existing four-city product visually coherent and repair navigation, forms, media and editorial discovery without losing existing calculations or saved places.

**Architecture:** Retain Next.js, current routes, source stores and publication gates. Extend the green editorial brand through shared tokens, make city navigation section-aware, and reuse a small formatted-amount input. Keep photos in the existing licensed registry and serve resized static assets; no new paid infrastructure.

**Tech Stack:** Next.js 16, React, CSS Modules, Vitest, existing Postgres and static snapshots.

**Spec:** User's 14-point request plus the additional simple Explore marker request; attached screenshots 01–12.

## Global constraints

- Existing URLs, calculators and local saved data remain compatible.
- No fabricated building photos or inferred Japanese building transactions.
- No new paid services, broad noindex rules, or unreviewed news publication.
- Body 16px; controls 14px; shared green accent, red saved heart, calm neutral canvas.
- Headings can wrap naturally where required; prevent accidental narrow columns, clipping and overlapping figures.
- User explicitly requests autonomous execution, GitHub upload and preview verification before production.

## Execution

- [x] Navigation: test section-preserving city destinations, repair header alignment and menu dismissal; Tokyo receives its own real Explore destination.
- [x] Inputs and save: test comma/decimal normalization; apply shared amount input without changing calculation values; retain storage keys and use red hearts.
- [x] Common visual rhythm: align Home Search and Passport; unify canvas, type scale, card padding and content width across Tools, Check, Saved, News and Guides.
- [x] Explore and detail: replace dashed map clusters with simple numeric markers; balance summary metrics and charts; remove empty media slots and show only verified imagery or explicit compact no-photo treatment.
- [x] Singapore and Tokyo: repair graph date domains and missing-photo layout; add relevant licensed region imagery when available; provide Tokyo Overview/Explore navigation within actual data scope.
- [x] Performance and publishing: trace Check/results, cached snapshots and news review/publication; fix measured causes while retaining last-good data and editorial checks.
- [ ] Verification: focused unit tests, typecheck/build, desktop/mobile browser checks of navigation, input, save, calculation, media and content; independent read-only review; push to GitHub and validate preview before production.

## Release evidence and boundaries

- TypeScript validation passed. The final staged source tree passed 332 test files / 2,762 tests, including 27 isolated PostgreSQL/WASM publication tests; 12 unrelated optional tests were skipped. The clean source export excludes local generated build diagnostics.
- Local isolated build cannot download the external Korean font in this runtime; the Vercel preview build is the release gate, not a claimed local build success.
- Independent review found and prompted repairs to the Dubai editorial-market constraint, cross-market news matching, broken-media fallback and desktop menu dismissal.
- Three licensed Singapore regional-context photos are served as static 480px WebP assets (124,164 bytes combined). They are explicitly not photographs of searched buildings. Exact building-photo coverage remains limited to the existing verified registry; no synthetic substitutes.
- News discovery only links to eligible reviewed articles from the same market. Production feed freshness still needs live verification; unreviewed feeds are not automatically published.
- Tokyo supports district-level official transaction exploration, not invented named-building transactions or unsupported rankings.
- Browser verification of saved-state persistence and calculations, preview CI, and production smoke tests remain pending. No production deployment is implied by implementation checkmarks.
