# Mobile app foundation verification

## Implemented increment

Locale-aware manifests (English, Korean, Simplified Chinese), generated app icons, Apple touch metadata, install guidance in Saved, and four standalone navigation tabs. This is a PWA foundation, not a native binary or store release. No notification, account sync or public community was enabled.

## Evidence

- Baseline shared-navigation and Saved rendering tests: 18 passed before implementation.
- Targeted suite: 25 tests passed across `mobile-app-foundation`, `mobile-app-rendering`, `site-navigation` and `saved-cities-view`.
- TypeScript: `pnpm --filter @signedprice/web typecheck` passed after correcting test-only unchecked array access.
- ESLint: targeted new components/model/route, modified root layouts, tests and icon generator passed.
- Local Next.js HTTP integration: `/saved/`, `/ko/saved/`, `/zh-cn/saved/` returned 200 with the matching manifest URL, install card and navigation markup. `/app-manifest/ko/` returned 200 with `application/manifest+json` and `/ko/prices/` start URL. `/app-icons/icon-192.png` returned 200 with `image/png`.
- Installation model retains one app identity across locales and preserves the current city when navigating back to Explore. Unsupported manifest locales return 404.

## Review follow-up

GitHub Actions run `34763427932` passed lint and typecheck, then reported 3,389 passing tests, 85 skipped tests and one failure: the homepage metadata contract still expected the pre-PWA object. Its exact expectation now includes the app manifest, application name, Apple capability and touch icon while retaining the existing SEO checks. The affected homepage and mobile app suites passed all 18 tests locally. A follow-up commit requests a hosted preview using the repository's documented `[vercel-preview]` opt-in; the release cost policy is unchanged.

Independent code review found installed tabs could cover the Seoul mobile building drawer and Tokyo discovery trigger. Both now consume a shared standalone bottom-clearance variable; normal browser mode uses zero additional clearance. Singapore overview `/sg/` also retains its city when opening Explore. Actual overlap checks in a browser remain required.

## Not yet verified

- Visual layout, hydration and install prompt interaction in an actual browser: Chromium download failed with CDN 502/timeouts; no screenshot or browser-pass claim is made.
- Physical iPhone and Android installation, safe-area appearance, OS back behavior, accessibility and cross-language navigation in standalone mode.
- Full production build and deployment: not performed. The local dev renderer could not download the existing Google Noto Sans KR font and used its fallback. No font implementation was changed.
- Browser-local Saved persistence is retained; account migration and cross-device sync are outside this increment. Installed-browser storage behavior must be checked on real devices.

## Release gate

Keep the PR in draft until browser and device checks pass. Review map sheets, consent panel and installed navigation for overlap, verify app start and shortcuts in all supported languages, check that all PNG assets are reachable over production HTTPS, and test prompt acceptance/dismissal plus manual iOS installation. Merge/deploy only after resolving those checks. No App Store/Play Console submission has occurred.
