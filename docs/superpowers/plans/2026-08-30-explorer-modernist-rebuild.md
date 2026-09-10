# Explorer Modernist Rebuild Implementation Plan

1. Add regression tests for one dialog scroll container wrapping Street View and evidence on desktop and mobile.
2. Refactor `explore/building-window.js` and final Explorer CSS so header/actions remain outside `.building-status-scroll` and all media/evidence scroll together.
3. Add scoped `explore/explore-modernist.css` and load it after the legacy stylesheet for EN/ZH Explorer only.
4. Map the Claude Modernist tokens and typography to the existing Explorer DOM without replacing Google Maps, API calls, or building-window events.
5. Add insufficient-evidence helpers and UI tests for the 5-contract threshold, hatch state, sample count, and missing-value behavior.
6. Rework district map labels, controls, legend, discovery rail, metrics, result rows, and mobile bottom sheet using the existing state machine.
7. Run focused tests, Phase 0 verification, `git diff --check`, static/browser checks, and an independent code review.
8. Commit the verified branch and merge it locally into `main`. Keep GitHub, Vercel Preview, and Production unchanged until separately authorized.
