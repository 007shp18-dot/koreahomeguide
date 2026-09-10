# SignedPrice Korea and Singapore Completion Program Design

**Date:** 2026-09-02
**Status:** Approved by the user for end-to-end implementation
**Extends:** `2026-09-01-signedprice-unified-market-explorer-v2-design.md`, `2026-09-01-signedprice-unified-building-decision-detail-design.md`, and `2026-08-31-signedprice-contract-split-news-community-design.md`

## 1. Outcome

SignedPrice ships a complete evidence-led Korea and Singapore product without invented values or dead product surfaces. Korea uses installed MOLIT evidence, official building facts, NAVER Maps, and NAVER Panorama. Singapore uses separately modelled URA private residential and HDB public-housing evidence, Google Maps, and Google Street View.

The approved delivery order is:

1. close the current Korea evidence release;
2. audit the supplied Detail V2 mockups;
3. ship Korea Explore V2;
4. replace the primary Korea Check with the KoreaHomeGuide single-quote decision flow plus transaction type;
5. enrich Korea building Detail with official building data and NAVER Panorama;
6. activate URA and HDB evidence through verified installed snapshots;
7. ship Singapore Explore, Check, and Detail with Google Maps and Street View;
8. retain and connect News and Community through truthful first-party and NAVER-backed surfaces;
9. release indexable evidence pages, editorial content, and promotion only after the corresponding data gate passes.

## 2. Global constraints

- Next.js `16.3.3`, React `19.2.8`, TypeScript `5.9.3`, pnpm `11.19.0`.
- Credentials stay server-side except browser keys explicitly designed for provider SDKs.
- Credential values, access tokens, and raw provider payloads never appear in logs, browser bundles, test snapshots, or artifacts.
- Every snapshot is schema-validated, period-labelled, SHA-256 verified, and installed through the snapshot registry.
- Existing KoreaHomeGuide Production remains live and separate until SignedPrice parity and migration gates pass.
- Missing price evidence hides only the affected statistic, not a stable building or project identity.
- A published price distribution requires at least five eligible observations in its exact cohort.
- No invented coordinates, building facts, photographs, prices, yields, rights, news, community counts, or forecasts.
- Internal links end in `/`.
- Every release passes unit, route, client-boundary, type, lint, Production build, responsive browser, exact-SHA Preview, and live Production checks.

## 3. Provider matrix

| Market | Map | Geocoding | Building visual | Property facts | Transactions |
|---|---|---|---|---|---|
| Korea | NAVER Maps | NAVER geocoder | NAVER Panorama | 공동주택 기본정보서비스 and 건축물대장정보서비스 | MOLIT rent and sale |
| Singapore private | Google Maps | Google geocoder | Google Street View | URA project data | URA private sale and rent |
| Singapore HDB | Google Maps | Google geocoder | Google Street View | HDB Property Information | HDB resale and renting-out data |

Street View is labelled as a nearby street panorama, never as a listing or verified building photograph. It loads only for the selected building or Detail hero. When no panorama exists, the visual falls back to the same provider's live map and then to an honest unavailable state. Visual failure never hides identity or evidence.

## 4. Korea Explore V2

The supplied Explore implementation remains the composition contract. It operates over all 25 Seoul districts, every supported observed building, all supported area bands, and `jeonse`, `monthly`, and `sale` evidence. The map, result rail, table, selection, Detail link, and URL state remain synchronized. The old 294-building and 45–55㎡ boundaries are not product limits.

## 5. Primary Check

The primary Check adopts the KoreaHomeGuide single-quote decision flow. Inputs are transaction type, region, property type, area, and the transaction-specific quote:

- sale: offered sale price;
- jeonse: deposit;
- monthly: deposit and monthly rent.

The comparison hierarchy is same building, same neighborhood, then district, with exact cohort disclosure. Results publish `below`, `typical`, or `above`, median, P25–P75, difference, sample, period, filters, and recent comparable rows. Monthly results retain the filed deposit and rent and use only the installed conversion curve for normalized comparison. Missing quote values never become zero. The existing two-offer comparison remains available as a secondary tool.

Singapore reuses the interaction grammar, not Korean market policy. Private sale/rent and HDB sale/rent have native comparable rules and never use Korean jeonse conversion.

## 6. Korea building facts and identity

Official building joins use legal-dong code, main/sub lot number, road address, PNU or building-management identity, and official name in that order. Name-only fuzzy matches cannot publish facts. Official facts are collected server-side into a provenance-bearing installed snapshot. Browser pages never call BuildingHUB or public-data endpoints directly.

## 7. Singapore evidence

URA private and HDB evidence share the Singapore route shell but keep distinct schemas, identities, rights, statistics, and labels. `All homes` may show availability and counts, but never a combined private-plus-HDB median or PSF.

URA credentials are normalised behind one server-only resolver. The rights policy follows the current URA API terms and individual dataset conditions. Live routes activate only after an installed snapshot passes rights, schema, period, count, and digest checks.

HDB uses the official data.gov.sg resale, renting-out, and property-information datasets. HDB identity is town plus block plus street. HDB rental evidence is labelled owner-declared and indicative in accordance with its source note.

## 8. News and Community

News and Community remain product modules. SignedPrice-authored market briefs are stored evidence-led content. NAVER News, Blog, and Cafe results are external link cards with source, time, query provenance, de-duplication, and a short compliant cache. External community mentions are not first-party user submissions.

First-party Community remains a separate durable Postgres-backed system with signed pseudonymous identity, rate limiting, moderation state, and publication thresholds. Until those dependencies are ready, the module displays a truthful closed or collecting state; it is not removed and does not publish fabricated activity.

## 9. SEO and growth

Only routes with stable identity, a completed evidence period, server-rendered source boundaries, and at least one useful published state enter sitemap and indexing. Canonical, hreflang, breadcrumb, and structured data contain verified facts only. Editorial and promotional content links to the underlying evidence page and never substitutes commentary for missing evidence.

## 10. Release failure behaviour

- Provider credential missing: affected provider surface fails closed; unrelated evidence remains available.
- Geocode ambiguous or outside market bounds: no pin or panorama is published; the result remains in the rail.
- Street View unavailable or SDK failure: fall back to provider map, then unavailable visual.
- Artifact malformed or SHA mismatch: reject it and retain the last verified installed artifact when permitted.
- Thin cohort: disclose sample insufficiency and offer only independently valid broader contexts.
- URA or data.gov.sg unavailable: do not replace with fixtures or stale data labelled current.
- News provider unavailable: retain approved briefs and label the external feed unavailable.
- Community storage unavailable: disable writes and preserve the read-only truthful state.

## 11. Completion gate

The program is complete only when Korea and Singapore user journeys work from market entry through Explore, selected property Detail, transaction-specific Check, evidence disclosure, map and street panorama, and canonical navigation; News and Community remain present; indexable pages are evidence-backed; both desktop and mobile pass live Production verification.
