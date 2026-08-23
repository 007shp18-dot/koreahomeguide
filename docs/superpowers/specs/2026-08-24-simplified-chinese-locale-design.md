# Simplified Chinese Locale Design

## Goal
Add a Simplified Chinese version of KoreaHomeGuide at `https://koreahomeguide.com/zh/` without changing the existing English experience or backend APIs.

## Scope
- Keep `/` as the canonical English home page.
- Add `/zh/` as a fully usable Simplified Chinese page.
- Localize the core user journey: home search, Rent Check, official signed rents, brokerage/move-in calculator, and guide summaries.
- Reuse the existing `/api/real-prices` and `/api/rent-check` endpoints unchanged.
- Use the same GA4 property (`G-6SXH5BREDP`) on both locales.
- Add a visible `EN / 中文` language switch.
- Add reciprocal `hreflang` metadata for `en`, `zh-CN`, and `x-default`.
- Add `/zh/` to the sitemap.

## Content principles
Use natural Simplified Chinese aimed at Chinese-speaking renters in Korea, not literal machine translation. Keep Korean rental terms where useful with an explanatory Chinese label, e.g. `月租（Wolse）` and `全租（Jeonse）`. Official transaction and brokerage claims must preserve the same caveats as the English page.

## Technical approach
For the two-locale MVP, use a dedicated `zh/index.html`, `zh/app.js`, and `zh/rent-check-ui-utils.js`. Shared calculation utilities, CSS, Leaflet assets, and backend APIs remain at root and are referenced with absolute paths. This avoids a large runtime i18n refactor while keeping locale-specific copy independently testable.

## SEO
English canonical: `https://koreahomeguide.com/`.
Chinese canonical: `https://koreahomeguide.com/zh/`.
Both pages include reciprocal alternate links for `en`, `zh-CN`, and `x-default`. Sitemap lists both canonical URLs.

## Acceptance criteria
1. `/` remains functional and contains a link to `/zh/`.
2. `/zh/` declares `lang="zh-CN"`, has Chinese title/description, correct canonical and hreflang tags, and links back to `/`.
3. Chinese page exposes all core controls and localized dynamic status/results.
4. Both locales use the existing GA4 measurement ID.
5. `sitemap.xml` includes both `/` and `/zh/`.
6. Existing backend API files are unchanged.
