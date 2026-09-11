# Locale parity audit — 2026-09-11

## Scope and completion boundary

The product requirement is the same English content and page layout when switching to Korean or Simplified Chinese. Merely changing navigation labels, redirecting to a language home page, hiding English articles, or marking untranslated articles as English does not satisfy this requirement.

This audit counts static editorial portfolio news-brief, market-brief and data-story records. It does not include database-only articles, city journey stories, neighborhood stories, guides, policy records or core product screens. Matching identity proves that a translated record exists, not that every paragraph has been manually compared.

| Catalog | English records | Matching localized identities | Missing |
| --- | ---: | ---: | ---: |
| Korean | 21 | 21 | 0 |
| Simplified Chinese | 21 | 6 | 15 |

## Implemented in this change

- Full Chinese bodies for Seoul, Singapore and Dubai September 2026 monthly reports. English source tables are reused, translating labels while retaining all data values. Original source URLs, evidence release IDs, publication dates and canonical slugs are preserved.
- Full Chinese translation of the existing Dubai rental-yield analysis, including operating cash-flow and sensitivity tables, financing cases, document requirements and evidence limitations. This is translation of the existing analysis, not a new source verification.
- Three-language mappings for those four articles so switching keeps the same article.
- Chinese city navigation, period text, chart titles, legends and accessible chart description for monthly reports.
- Korean /ko/news/[slug] uses the same EditorialGrowthPublicFrame as English and Chinese.
- Monthly and investment article tests preserve numerical tables, evidence links, section counts and locale switch identities.

The investment-insights agent separately owns index filtering and shared NewsroomArticle localized controls/related links. Core page and navigation changes should be recorded below by the coordinating agent.

## Remaining Chinese portfolio article translations

- seoul-singapore-dubai-buyer-pulse-september-2026
- bank-of-korea-rate-rise-seoul-home-buyers-2026
- singapore-q2-2026-private-housing-split
- dubai-h1-2026-completions-and-transaction-growth
- seoul-84sqm-under-one-billion-2026
- seoul-59sqm-under-700-million-2026
- singapore-condos-under-1-5-million-2026
- korea-foreon-neighbour-price-gap
- singapore-lentor-launch-resale-divergence
- seoul-sale-market-monthly-brief
- seoul-jeonse-market-monthly-brief
- seoul-monthly-rent-market-brief
- singapore-private-market-quarterly-brief
- seoul-new-renewal-rent-gap
- korea-deposit-monthly-rent-cost-structure

## Validation

Focused test suites monthly-reports, site-navigation and insight-article-consistency passed before the final extra Dubai parity assertion; monthly-reports then passed all 5 tests including Dubai. Production verification and deployment are the coordinating agent’s responsibility. No deployment has been performed by this subtask.

## Core product and other editorial surfaces

Pending coordinating-agent audit. Full-site language parity must not be reported complete from this article subset.

## Core product and navigation work

- EN/KO/ZH Explore directory uses one PricesPage with complete stored copy and all four city links. Search state is preserved through language switching.
- Seoul root Explore, district detail and building detail use shared renderers; Chinese Explore/Check/compare redirects replaced by actual routes. Existing official proper names remain source names.
- Singapore and Dubai Chinese overview/Explore/details/Check pages added through shared components and stored translation dictionaries. Korean Dubai overview now contains the same full sections as English.
- Reciprocal metadata and sitemap entries added only for implemented published routes, retaining data publication gates.
- Seoul and Singapore correction histories now have shared localized pages. Footer group renamed Platform / 서비스 / 平台.
- Header city, saved and language controls retain their behaviour with compact borderless styling, icons, keyboard focus and selected states.
- Tokyo PR299-only desktop map/list reversal removed; mobile/tablet map-first behaviour retained.
- Investment topic filter added to the existing Insights directory; market/data articles link to scenario calculator with relevant market/currency.

## Explicit remaining limits

This is not a claim of whole-site language parity. The Chinese editorial bodies listed above, city-journey/neighborhood stories and other unreviewed surfaces still require translation. Chinese Seoul city-specific shortlist/rankings are not newly implemented; header uses existing Chinese Saved/global rankings surfaces. Global Trust/Privacy pages still expose English. Raw provider names and fact values are not invented translations.

No production collection credentials, provider access, DB permissions or recurring ingestion schedules changed. No new paid service was added. Translation content is stored; there is no per-visit translation API call. Billing savings were not measured because the connected Vercel tool does not expose billing usage.
