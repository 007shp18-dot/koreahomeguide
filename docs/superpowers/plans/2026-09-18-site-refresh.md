# SignedPrice interface renovation implementation plan

**Goal:** Renovate the existing public site across home, market overview, Explore, ranking, details, content, tools and utility pages.
**Architecture:** Extend existing semantic tokens and shared templates. Keep all data functions, route contracts and client/server boundaries. New public stylesheet is scoped to the three public root layouts; component-specific enhancements remain scoped to their existing modules.
**Tech stack:** Existing Next.js 16.3.3, React 19.2.8, TypeScript, CSS modules and Playwright. No dependency additions.
**Spec:** docs/superpowers/specs/2026-09-18-site-refresh.md

## Global constraints
Blue #2563d8, controls48px/targets44px, inputs16px, Seoul/Singapore/Dubai/Tokyo order, en/ko/zh-CN preserved. No fake evidence, route/SEO/data/consent/API changes, new login or DB writes.

## Tasks
1. Add `v2/tests/e2e/site-refresh.spec.ts`: assert release marker, real localized search, four photo images, one heading, four existing budget controls, three actual reports and no viewport overflow. Run it against the baseline and retain the expected failure.
2. Update the public `(en)`, `(ko)` and `(zh-cn)` layouts to import scoped `app/site-refresh.css` and expose the release marker, without changing existing metadata, fonts, analytics or consent. Add semantic CSS for navigation, overviews, evidence surfaces, controls, article typography and responsive states.
3. In `components/design-review/editorial-growth-home.tsx`, reuse `HomeSearch`, `CITY_PHOTOS`, `BuyingJourney` and `HomeAnalysis`. Introduce a responsive four-photo composition with locale-aware exploration links and retained photo credits. Update its CSS module without changing child component contracts.
4. Refine the existing footer, buying journey, market overview/detail/control modules, ranking, content indexes/articles, tools, saved and operator/trust styles. Preserve native table and modal behavior. Test each family at narrow widths.
5. Extend browser checks to actual existing routes, keyboard and form interactions and screenshots. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, production build and targeted plus existing Playwright regressions in the repository CI environment.
6. Inspect screenshot artifacts and errors. Fix implementation defects without weakening assertions. Publish the reviewed branch/PR, and only merge when required verification and deployment permit it. Record actual results and limitations in the PR and the response.
