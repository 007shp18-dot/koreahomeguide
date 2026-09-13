# Mobile app foundation implementation plan

> Execution: inline in the current authorized session, one working increment followed by verification.

**Goal:** Make the existing SignedPrice web experience installable while preserving language, saved-place behavior and the future community path.

**Architecture:** Shared manifest/navigation model, localized public manifest route, client install provider and standalone navigation integrated in the three public root layouts. Current market pages, backend and browser storage remain the source of behavior.

**Tech Stack:** Existing Next.js 16.3.3, React 19.2.8, TypeScript, Vitest and Playwright; no new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-09-13-mobile-app-foundation-design.md`.

## Global constraints

- English/Korean/Simplified Chinese routes; Seoul/Singapore/Dubai/Tokyo ordering.
- No production write, database migration, store submission or unsupported offline/push claim.
- Visible focus, minimum 44px controls, safe-area padding and normal browser-mode navigation.
- Reuse existing data precision and browser-local saves; no fabricated community participation.

## Task 1: Localized install identity and manifest

- [x] Test `mobileAppManifest(locale)` for same id `/`, scope `/`, standalone display and locale-correct start/shortcuts; `mobileAppMetadata(locale)` links matching manifests. Run `pnpm exec vitest run apps/web/test/mobile-app-foundation.test.ts` and observe missing-feature failure.
- [x] Implement the model in `v2/apps/web/lib/mobile-app/model.ts`. Serve only supported locales from `app/app-manifest/[locale]/route.ts` with application/manifest+json; unsupported locales return 404.
- [x] Add 192/512 PNG app icons and 180px Apple touch icon based on the existing BrandMark geometry and colors. Include a reproducible generation script using the existing sharp transitive dependency.
- [x] Integrate app metadata/viewport in all public root layouts. Keep zoom enabled.

## Task 2: Installed navigation and honest install interaction

- [x] Test city-preserving destinations and active Saved/Tools states in the model test.
- [x] Add `components/mobile-app/mobile-app-provider.tsx`, `install-app-card.tsx`, and `mobile-app.module.css`. Provider captures beforeinstallprompt and exposes install state. CSS shows bottom navigation only in standalone mode. Card contains manual fallback and no notification promise.
- [x] Wrap public layout children in the provider and show the card in `SavedCities` when initiallyOpen. No market engine changes.

## Task 3: Verification and reviewable delivery

- [x] Run new model tests plus existing shared-navigation and saved-page tests, then TypeScript and targeted ESLint.
- [ ] Exercise locale manifests/icons and narrow browser/standalone screens with Playwright. Simulate install-event dismissal/acceptance; validate links and visibility. Record limits of desktop emulation versus real device installation.
- [ ] Inspect diff, commit only the authorized increment and create a draft PR. Keep production merge/deployment and app signing separate from implementation.

## Verification note

25 focused tests passed. Local Next HTTP checks cover all three Saved pages and the manifest/icon routes. Browser visual and prompt-event verification remains blocked by Chromium download failures; see `docs/operations/2026-09-13-mobile-app-foundation-verification.md`.
