# SignedPrice mobile app foundation

The user approved proceeding with the PWA-first mobile plan and named Hogangnono as the product reference, with community features planned for a later release. This is a new subsystem delivered in stages. This first implementation is an installable web app, not an App Store binary.

## Verified starting point

Source baseline: `de122566c3f2d312635f16ecdd3ec979400525cb`. The repository root is legacy code; the current application is `v2/apps/web`, Next.js 16.3.3 / React 19.2.8 with server-side Neon access. Three independent public root layouts serve English, Korean and Simplified Chinese. Saved places and research notes are browser-local. Existing community code collects structured price opinions; it does not establish a working account-based discussion community. Runtime configuration has not been audited.

## Direction and delivery boundaries

Target flow: city/map discovery → area or building details → save and compare → updates → questions, experiences and eventual partner enquiry. Preserve SignedPrice branding and data; use Hogangnono as an interaction reference, not a source to copy or scrape.

First delivery adds locale-aware manifests, app icons, install guidance beside saved places and standalone-only bottom navigation. The four working tabs are Explore, Saved, Insights and Tools. No nonfunctional community tab. Existing website routes and market queries remain authoritative. Browser mode retains its current navigation. No new database, auth, push subscription, community write, production deployment or store submission in this increment.

## Architecture and error behavior

`lib/mobile-app/model.ts` owns manifest metadata and tab destinations. Three root layouts use shared app metadata and a client provider. A public manifest route validates one of en/ko/zh-CN and uses the same app ID `/` with localized start URLs. Existing server-rendered market pages continue using current repositories; no database credential enters the app.

The client provider holds the browser's install event and standalone state. Install guidance gives browser-menu / iPhone instructions when an install prompt is unavailable. Prompt dismissal permits later browser-menu installation; errors show the same manual fallback. Installed mode hides install guidance. Browser menus and device policies determine actual installation availability.

This increment deliberately has no service worker, page cache or offline claim. Live prices, authenticated responses and future community data must not be silently replayed from a broad offline cache. Internet is required. App shortcuts open locale-correct Explore and Saved destinations. Root scope permits switching languages and cities in the same installed app.

Use existing semantic color tokens, visible focus, minimum 44px controls, English/Korean/Simplified Chinese labels, city order Seoul/Singapore/Dubai/Tokyo and safe-area padding. Do not disable pinch zoom. Tokyo evidence remains area/transaction scoped, never an invented individual building.

## Follow-on releases

1. Map experience: verify current search regressions, measure map responsiveness on real phones, standardize mobile detail sheets and selection/back behavior across the four cities. Existing Seoul/Singapore building keys and Dubai/Tokyo area identities must be reconciled to stable place references before discussions attach to them.
2. Accounts and retention: choose auth with native-compatible sessions and account deletion, migrate browser-local saves through explicit idempotent account import, enforce per-user access on every write, then add opt-in update notifications tied to actual dataset publication events. Track save→return→compare/enquiry conversion without inventing active-user counts.
3. Community: start with city questions and place-linked discussions. Store posts, comments, reactions, reports, user blocks and moderation actions separately from the existing evidence-opinion aggregates. Read publicly; authenticate writes. Include report, block, spam limits, moderation queue and contact details before enabling public posting. Separate original language from any optional translation. Do not imply residency verification without a real verification process. No chat, photo uploads or anonymous unrestricted posting in the initial community release.
4. Store app: after mobile interaction checks, compare Capacitor's web reuse with a dedicated React Native/Expo client based on measured map/gesture needs. Current Next.js server components cannot simply be bundled as a static native app. Reuse domain/API contracts; keep Neon server-side. Signing, platform testing and review are separate release gates. Community also requires UGC moderation under Apple guideline 1.2.

## Acceptance

Tests cover locale manifests, stable app identity, city-preserving tab destinations and active state. Browser checks cover manifest HTTP type/icons, English/Korean saved pages, browser-mode hidden bottom nav, simulated standalone layout at narrow widths, install-event acceptance/dismissal and no overflow. Validate typecheck and targeted lint. Physical iPhone/Android installation and store review remain outstanding until tested on those devices.

## Sources

- https://nextjs.org/docs/app/guides/progressive-web-apps
- https://developer.apple.com/app-store/review/guidelines/#user-generated-content
- Installed Next.js documentation under `node_modules/next/dist/docs/` was read before implementation.
