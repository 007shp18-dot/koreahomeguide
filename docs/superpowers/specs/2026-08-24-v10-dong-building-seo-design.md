# KoreaHomeGuide v10 Dong & Building SEO Design

## Goal
Turn the existing Seoul Rent Explorer hierarchy into crawlable, shareable neighborhood and building URLs without generating hundreds of static HTML files or exceeding GitHub web-upload limits.

## Product scope
v10 adds server-rendered SEO entry pages on top of the existing MOLIT provider. It does **not** add listings, a database, map-first browsing, reviews, accounts, or new cities.

Primary flow:

`District market page → Dong SEO page → Building SEO page → Rent Check`

The existing `/explore/` remains the interactive discovery surface. The new SEO routes are landing/detail pages that deep-link back into Explorer with the current district, property type, and dong preserved.

## URL model

English dong route:

`/seoul/{district-slug}/{dong-slug}/{property-type}/`

Chinese dong route:

`/zh/seoul/{district-slug}/{dong-slug}/{property-type}/`

English building route:

`/seoul/{district-slug}/{dong-slug}/{property-type}/{building-slug}/`

Chinese building route:

`/zh/seoul/{district-slug}/{dong-slug}/{property-type}/{building-slug}/`

Examples:

- `/seoul/mapo-gu/yeonnam-dong/villa/`
- `/zh/seoul/mapo-gu/yeonnam-dong/villa/`

### Slug policy
- District slugs reuse the existing five supported district slugs.
- Property type remains one of `apartment`, `officetel`, `villa`.
- A curated Dong slug registry provides readable Latin slugs for known/popular dongs such as `yeonnam-dong`.
- When a dong is not in the registry, the route may use the normalized Korean dong name as a Unicode URL segment. The canonical URL must be stable and must not invent a romanization.
- Building slugs use a normalized readable building-name segment plus a short deterministic suffix derived from the existing stable `buildingKey`. The suffix prevents collisions between identical names.
- The building slug is resolved by loading buildings for the district/type/dong and matching the deterministic slug. No persistent database is required in v10.

## Vercel routing architecture
Add `vercel.json` rewrites so many public URLs are served by only two serverless HTML endpoints.

Conceptually:

- `/seoul/:district/:dong/:type/` → `/api/seo-dong-page?...&lang=en`
- `/zh/seoul/:district/:dong/:type/` → `/api/seo-dong-page?...&lang=zh`
- `/seoul/:district/:dong/:type/:building/` → `/api/seo-building-page?...&lang=en`
- `/zh/seoul/:district/:dong/:type/:building/` → `/api/seo-building-page?...&lang=zh`

The endpoints return `text/html; charset=utf-8`, not JSON. Existing JSON APIs remain unchanged.

## Data layer
Reuse `createKoreaHousingProvider` and the current six-completed-month window.

Dong renderer calls:
- `getDongSummary({ areaCode, propertyType, dong, months:6 })`
- `getBuildings({ areaCode, propertyType, dong, months:6 })`

Building renderer calls:
- `getBuildings(...)` to resolve the building slug safely inside the selected dong
- `getBuildingDetail({ areaCode, propertyType, buildingKey, months:6 })`
- `getDongSummary(...)` for neighborhood comparison context

No duplicate MOLIT parsing logic is allowed in the SEO layer.

## Dong page content
Keep the page visually simple and data-first.

Required content:
- Breadcrumb: Seoul → District → Dong
- H1: `{Dong} {Property type} Rent Prices`
- Short district/dong context sentence that does not pretend to know unsupported qualitative details
- Data-through period and official MOLIT source label
- Median monthly rent
- Median deposit for monthly-rent contracts
- Jeonse median when available
- Recent contract count
- Recent direction when available
- Recent signed contracts
- Named buildings in the selected dong
- CTA to open the same market in `/explore/`
- CTA to Rent Check
- Links to other property types in the same dong when supported

Chinese content mirrors the information architecture with natural Simplified Chinese copy and CNY-primary/KRW-reference display.

## Building page content
Required content:
- Breadcrumb and exact building name
- District + dong + property type
- Median monthly rent
- Median deposit
- Typical floor-area range when available
- Six-month contract count
- Monthly trend already supported by building detail
- Recent signed contracts
- Comparison sentence versus dong median when both values exist
- CTA to Rent Check with building/dong context preserved where supported
- Back link to the canonical Dong SEO page

Do not present the page as a live listing or claim a unit is currently available.

## SEO rules
### Dong pages
Dong pages are indexable when recent official transaction data exists.

Each response must include:
- unique `<title>`
- unique meta description
- canonical URL
- `hreflang="en"`, `hreflang="zh-CN"`, and `x-default`
- `robots="index,follow"`
- Open Graph title/description/url
- JSON-LD `WebPage` plus a lightweight `Dataset` description that identifies MOLIT-reported rental transaction statistics; do not claim KoreaHomeGuide owns the source data

If no matching recent data exists, return a useful 404 page and `noindex`.

### Building pages
A building page is indexable only when all are true:
- exact named building resolved in the selected district + dong + property type
- at least **3 reported contracts in the latest six completed months**
- sufficient summary data to render at least one meaningful price metric

Otherwise the page remains usable but returns `robots="noindex,follow"`.

This prevents thin building pages from being mass-indexed.

## Discovery & internal linking
v10 does not statically generate every Dong/building page.

Improve discovery by changing existing client-rendered links:
- Explorer Dong cards link to the canonical Dong SEO route.
- Explorer building rows link to the canonical Building SEO route.
- Existing 15 district/property market pages link to Dong SEO routes from their data-driven neighborhood/building sections where those links are rendered.
- Dong SEO pages render plain HTML anchors to buildings, so crawlers can continue from dong → building without depending on client-side JavaScript.

The existing sitemap stays focused on stable static pages in v10. A dynamic all-dong sitemap is deferred until crawl volume and API cost are measured; internal links are the discovery mechanism for v10. This avoids an expensive sitemap request fan-out across all 15 district/type combinations.

## Localization
- English date: `Jul 31, 2026`; month: `Jul 2026`.
- Chinese date: `2026年7月31日`; month: `2026年7月`.
- English primary display currency: USD, with KRW reference.
- Chinese primary display currency: CNY/人民币, with KRW reference.
- Korean legal dong/building names must never be mistranslated. Chinese may show a curated Chinese label where already known, followed by the Korean original.

## Error handling & caching
- Invalid district/type/slug: HTTP 404 + `noindex`.
- Missing service key or upstream failure: HTTP 503 with a neutral retry message + `noindex`.
- HTML responses use `Cache-Control: s-maxage=3600, stale-while-revalidate=86400`.
- All dynamic values inserted into HTML must be escaped.

## Files / architecture
Expected new focused files:
- `vercel.json` — route rewrites only
- `api/seo-dong-page.js` — request validation + HTML response
- `api/seo-building-page.js` — request validation + HTML response
- `seo/seo-page-renderer.cjs` — shared EN/ZH HTML shell, metadata, cards/tables
- `seo/seo-route-utils.cjs` — district/dong/building slug generation and resolution
- `tests/seo-dynamic-routes.test.cjs`
- `tests/seo-page-renderer.test.cjs`

Expected modifications:
- `providers/seoul-config.cjs` — district slug helpers and curated dong slug aliases
- `explore/explorer-utils.js` — generate canonical SEO URLs
- `explore/app.js`, `zh/explore/app.js` — route users to SEO pages while preserving Explorer links as secondary actions
- existing market-page renderer as needed for Dong internal links

## GitHub web-upload constraint
Production deployment package must contain fewer than 100 files. Tests/design docs are excluded from the GitHub-upload package. v10 should add only a small number of production files, preserving the current one-shot GitHub web upload workflow.

## Testing / acceptance criteria
TDD tests must prove:
1. Dong route slug validation and resolution.
2. Building slug is stable and collision-safe for identical names in different dongs.
3. Dong HTML has canonical/hreflang/index metadata and plain anchors to buildings.
4. Chinese Dong HTML is actually localized and uses CNY-primary labels.
5. Building pages with >=3 recent contracts are indexable.
6. Sparse building pages are `noindex,follow`.
7. Missing data returns 404/noindex; upstream failure returns 503/noindex.
8. Explorer creates canonical Dong/Building SEO links.
9. No live-listing language is introduced.
10. Existing full regression suite remains green.
11. All production JS/CJS files pass syntax checks.
12. GitHub upload package stays below 100 files and ZIP integrity verifies.

## Deferred to v11+
- Map-first browsing
- persistent database / scheduled ingestion
- full dynamic sitemap of all discovered dongs/buildings
- user reviews/community
- commute/university filters
- Tokyo/New York providers
- live listings or brokerage matching
