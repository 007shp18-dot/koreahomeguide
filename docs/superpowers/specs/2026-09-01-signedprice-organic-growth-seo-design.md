# SignedPrice Organic Growth SEO Design

**Status:** Reconstructed and approved from the September 1 conversation, reconciled to `main` at `3f4abc0`.

## Goal

Turn SignedPrice's existing evidence product into a search-acquisition system that earns Korean and English Seoul traffic first, then launches a rights-safe Singapore aggregate search surface. The objective is qualified product use, not merely a larger indexed URL count.

## Growth model

SignedPrice combines three layers:

1. **Technical SEO** — terminal canonicals, valid language pairs, crawlable internal links, structured data, sitemaps, page language, and release monitoring.
2. **Data SEO** — evidence-backed market, district, property-type, and eligible building pages generated only from validated artifacts.
3. **Content SEO** — useful guides and market briefs that answer contract and market questions, then move readers into Check, Explore, Rankings, and evidence detail.

No layer substitutes for another. A technically correct empty page is not publishable; a useful article with broken canonical or language signals is not release-ready.

## Search-intent architecture

### Seoul Korean

| Search intent | Destination |
| --- | --- |
| 서울 전세 시세 / 구별 전세 가격 | Korean Seoul hub, Explore, Rankings, eligible district pages |
| 강남구 아파트 전세 시세 and equivalent district/type queries | Korean district/property-type pages backed by the verified building artifact |
| 전세 월세 비교 / 전월세 전환 | Korean Rent Check and comparison guide |
| 전세 신규계약 갱신계약 차이 | Korean data brief and Guide |
| 전세계약 확인사항 / 보증금 확인 | Korean Guide linked to Check and district evidence |

### Seoul English

| Search intent | Destination |
| --- | --- |
| Seoul rent by district / Seoul jeonse prices | English Seoul hub, Explore, Rankings, districts |
| Gangnam apartment jeonse and equivalent queries | eligible English district/property-type pages |
| Seoul rent calculator / compare jeonse and wolse | Rent Check and Guide |
| Seoul rental contract checklist / renting in Seoul | Guide linked to Check and Explore |

### Singapore English

| Search intent | Destination after readiness |
| --- | --- |
| Singapore property prices | Singapore aggregate market hub |
| CCR vs RCR vs OCR | segment comparison |
| new sale vs subsale vs resale Singapore | sale-type comparison |
| Singapore private property price index | quarterly price-index page |
| Singapore property market guide | evidence and terminology guide |

## URL and language rules

- English Seoul canonicals remain under `/kr/seoul/`.
- Korean equivalents remain under `/ko/kr/seoul/`.
- A route receives hreflang only when both pages are live, canonical, semantically equivalent, and internally linked.
- Reciprocal language pairs use `en`, `ko`, and `x-default`; `x-default` points to the English equivalent.
- Redirect targets, noindex pages, unavailable evidence states, and thin placeholders never appear in the sitemap.
- Every sitemap URL must resolve directly to a 200 indexable page with a self-canonical URL.
- Query-string filter states are not separate canonicals.
- Building routes stay `noindex, follow` until a later evidence uniqueness review explicitly opens them.

## Indexation quality gate

An indexable data page requires all of the following:

- validated artifact identity, version, period, digest, and rights state;
- a stable route identity and self-canonical URL;
- unique title, description, heading, and evidence summary;
- a published sample meeting the relevant privacy/publication floor;
- source, period, method, limitations, and next valid action;
- at least one crawlable inbound link and useful outbound product links;
- no redirect, soft-404, unsupported claim, or substituted market figure;
- passing unit, render, build, and browser release checks.

## Structured data

- Global home: `Organization` and `WebSite` only once.
- Market/district/property-type data pages: `WebPage`, `BreadcrumbList`, and a lightweight `Dataset` description when the page publishes verified statistics.
- Guides: `Article` plus `BreadcrumbList`.
- Briefs: `NewsArticle` or `Article` only when the underlying claim ledger and editorial approval are valid.
- Structured data never claims ownership of official source data or a more recent update than the rendered evidence.

## Metadata and sharing

- Every indexable page has unique title and description, self-canonical, robots, and appropriate language alternates.
- Shared metadata emits stable Open Graph and Twitter fields using SignedPrice's canonical origin and a versioned 1200×630 first-party image.
- Korean pages use Korean OG locale and Korean titles/descriptions; English pages use English locale.
- Unavailable/noindex pages do not advertise themselves as complete market intelligence.

## Internal linking

- The global home links to the live Seoul hub and available product routes.
- Every language surface exposes a usable language switch when a valid counterpart exists.
- Guides link to the relevant Check, Explore, Rankings, district, or property-type page.
- Data pages link upward to the hub and sideways only to genuinely related routes.
- No essential discovery path depends only on JavaScript tabs, a map interaction, or the sitemap.

## Seoul content rules

- Existing 25-district and eligible property-type routes are reused; do not create a parallel URL family.
- Korean pages are localized products, not literal machine translations.
- Korean money and housing terminology use natural Korean display while internal money remains integer KRW and internal area remains square metres.
- New/renewal/all contract definitions stay identical across hubs, districts, rankings, and briefs.
- Editorial briefs may be updated from verified artifacts, but every factual change passes the existing claim/evidence and approval boundary.

## Singapore rules

- First indexable scope is aggregate private-property intelligence: hub, CCR/RCR/OCR, sale types, price index, and guide.
- Public reuse requires displayed source, dataset, access date, licence reference, aggregation method, and limitations.
- Dataset-specific rights override the general open-data posture.
- URA credentials and raw upstream diagnostics remain server-only and absent from HTML, browser bundles, logs, Git, and share cards.
- Individual projects, addresses, transaction rows, and search pages remain `noindex` until a separate rights and uniqueness release passes.
- Singapore uses SGD, Singapore terminology, and its own adapter. Korean deposit-normalization logic is not copied mechanically.
- Dubai stays out of the sitemap and search release.

## Measurement and expansion

- Search Console is the source of truth for indexing, coverage, query, and CTR decisions after release.
- Monitor terminal canonical status, sitemap errors, excluded pages, 404s, language-pair errors, organic landing sessions, and Check/Explore activation.
- Expand a query cluster only after existing pages show impressions or a verified user need. Do not mass-create low-value AI pages.
- Migration redirects are monitored for index transfer, traffic, 404s, and conversion before the next cohort opens.

## Release sequence

1. SEO foundation and route truth.
2. Korean and English Seoul content completion.
3. Singapore aggregate evidence and indexation.
4. Search Console-led iteration.

Each release must be independently testable and deployable. A blocked Singapore gate must not delay Seoul SEO fixes, and a Korean content gap must not cause unsupported English or Singapore pages to be generated.
