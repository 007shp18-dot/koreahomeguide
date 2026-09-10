# SignedPrice Explore and editorial refresh

**Goal:** Make the first visit understandable, unify the interface, and connect the four city journeys to independent, sourced articles.

**Architecture:** Keep the existing Next.js routes, market-specific data contracts and verified publication gates. Use the shared header and market shell for geometry, local CSS modules for exploration, and server-rendered editorial articles with a small client-side journey index.

**Tech stack:** Next.js 16.3.3, React 19.2.8, TypeScript, CSS modules, Vitest, existing browser workflow.

**Approved scope:** User conversation on 2026-09-09: discretionary UI/UX implementation, international references, four-city content, parallel agents. Existing code is in the GitHub-backed repository; no Sites migration is required.

## Design criteria

- Reference Compass search for a close grouping of price, address and attributes; Rightmove for one clear search entry; PropertyGuru for contextual article-to-search links; Linear for consistent, quiet controls.
- Keep accurate source periods and price conditions near the relevant number. Put long methodology, coordinate coverage and source-link lists behind a compact disclosure.
- Preserve property filters, URL state, map selection, Preview and Save behavior. Align controls at 14px/20px and a 44px touch target.
- Keep title, controls and results on the same page gutter. Use readable Korean line breaking; do not cut meaningful names or financial values to force a layout.
- Do not show repeated missing-photo tiles in lists or invent replacement building photos.
- Current price publication thresholds, source rights and calculation behavior are unchanged.
- Separate hypothetical worked examples from observed transaction data; retain current official-source qualifiers and review dates.

## Work packages

- [x] Shared chrome: `components/site-header.tsx`, `site-footer.*`, `app/globals.css`, navigation, Trust and Contact. Consolidate repeated header rules, retain accessible city/language selection and reduce duplicated operator copy.
- [x] Explore: `components/public-market/area-explorer.*`, `components/market-ui/market-shell.*`, Dubai/Singapore explorer modules and shared map status. Group list identity and price, remove empty media, reduce status/citation noise, and preserve map/list/filter actions.
- [x] Editorial: new city stage route and article model, `components/newsroom/journey-steps.tsx`, `newsroom-index.tsx`, city story links, locale routes and sitemap. Integrate researched EN/KO articles with source links and exact locale pairing.
- [x] Seoul district stories and local issues: link three Seoul neighbourhood articles from Where; reuse the existing Dubai yield article; integrate the other three sourced issue pilots.
- [ ] Verification: focused unit tests for navigation/content routes, TypeScript and lint, production build; browser checks on desktop/mobile for search, article navigation and readable controls. Adjust tests only when the user-facing contract intentionally changes.
- [ ] Delivery: review all diffs, commit and push the completed branch, open a reviewable PR and inspect its preview/checks before any production integration.

## Sources used for design

- https://www.compass.com/homes-for-sale/manhattan-ny/
- https://www.rightmove.co.uk/property-for-sale/London.html
- https://www.propertyguru.com.sg/property-guides/singapore-district-map-21045
- https://linear.app/now/behind-the-latest-design-refresh

## Delivery checkpoint

Local implementation is committed. Production build and TypeScript passed. The unit suite passed 2,778 tests across the full run and the two cold-data reruns; 50 existing conditional tests were skipped. Changed TypeScript lint has zero errors and one existing test-image warning. Public GitHub push was blocked by automatic approval review because explicit authorization for this public destination was not established. Do not retry the push through another tool; obtain user approval after completing local checks. Browser and preview verification remain pending.
