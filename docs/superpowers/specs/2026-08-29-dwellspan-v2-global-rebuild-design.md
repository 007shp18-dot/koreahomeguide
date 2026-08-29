# DwellSpan V2 Global Rebuild Design

**Date:** 2026-08-29

**Status:** Approved product and architecture design; implementation is not yet authorized

**Extension:** V2.1 intelligence, marketplace, identity, partner, brand, and cost-model decisions are defined in `2026-08-29-signedprice-v2-1-intelligence-marketplace-design.md`. Where the documents conflict, the signedprice V2.1 specification governs.

**Working masterbrand:** DwellSpan, subject to trademark, domain, and language validation

**Legacy production:** KoreaHomeGuide at `koreahomeguide.com`

**Observed legacy baseline:** `main` at `188f30fedf73367dbe564f8fcc458c98df205050`

## 1. Decision

Build a new global V2 product and progressively replace KoreaHomeGuide rather than extending the current application in place.

V2 will use one global masterbrand and one global URL system. Korea becomes the first full-product market; Singapore and Dubai launch as market-intelligence products. The existing KoreaHomeGuide application remains independently deployable until each legacy URL has a verified V2 replacement.

The rebuild applies to product architecture, code, data contracts, and URLs. It does not authorize discarding existing search equity, verified calculations, official-data provenance, or stable user workflows.

This design supersedes the product topology in `2026-08-26-global-market-router-design.md`, which kept KoreaHomeGuide and the global router as permanently separate public products. That document remains historical context for safety constraints. The data-rights, failure-isolation, and no-premature-publication principles continue to apply.

## 2. Strategic objective

The final product is a global real-estate total-solution provider covering:

1. market discovery;
2. city, area, and property comparison;
3. rent or buy decisions;
4. contract, rights, and price verification;
5. financing, insurance, and tax;
6. broker and transaction connections;
7. moving and settlement services;
8. ownership and yield management; and
9. sale and reinvestment.

The user sequence is:

1. foreign residents and cross-border movers;
2. global property investors; and
3. the whole local market, including domestic users.

The first release must not imply that all stages of this journey are operational. Unbuilt services are presented only as clearly labelled future capabilities or partner-interest collection, not as functioning marketplaces.

## 3. Goals and non-goals

### 3.1 Goals

- Create a clean global architecture without carrying forward legacy DOM, CSS, or URL constraints.
- Preserve and improve the useful intent of KoreaHomeGuide's verified production features.
- Give Korea, Singapore, and Dubai independent data, rules, capabilities, and failure states.
- Make source provenance and commercial-use rights enforceable in data, API, UI, and sitemap layers.
- Move existing organic search traffic with exact, path-level migrations.
- Permit rollback by deployment, dataset, market, and URL cohort.
- Establish a domain model that supports rent, sale, ownership cost, financing, tax, and yield.

### 3.2 Non-goals for the first release

- Operating a global brokerage or claiming transaction fulfilment.
- Publishing private-market data without verified commercial rights.
- Creating user accounts, permanent community submissions, or public Q&A.
- Launching identical feature depth in all three markets.
- Importing the existing application wholesale into the V2 repository.
- Redirecting all legacy URLs in one release.
- Treating asking prices, valuations, indices, and reported contracts as interchangeable.

## 4. Brand architecture

DwellSpan is the single V2 product brand and a working name until the brand-validation gate passes.

| Market | Public V2 identity | Initial product depth |
| --- | --- | --- |
| Korea | DwellSpan Korea | Full product |
| Singapore | DwellSpan Singapore | Market intelligence |
| Dubai | DwellSpan Dubai | Market intelligence |

KoreaHomeGuide is a legacy transition brand and SEO asset, not a permanent sibling product. Before public brand use, the following gate must pass:

- professional trademark search in the intended classes and target markets;
- primary and defensive domain availability;
- English, Chinese, Korean, and Arabic pronunciation and adverse-meaning review; and
- final founder approval.

If the gate rejects DwellSpan, the architecture and URLs remain valid with a replacement masterbrand. No public release, irreversible domain migration, or brand-specific asset purchase is authorized by this document.

## 5. Information architecture and URLs

### 5.1 Route grammar

Market identity and locale are separate dimensions:

```text
/{locale?}/{country}/{city}/{product-path}
```

English is the default and has no locale prefix. Chinese uses `/zh/`; future Korean uses `/ko/`. Locale prefixes do not change market semantics.

### 5.2 Initial route map

```text
/
├─ /kr/seoul/
│  ├─ /explore/
│  ├─ /properties/
│  ├─ /market/
│  ├─ /tools/rent-check/
│  ├─ /services/
│  └─ /guides/
├─ /sg/singapore/
│  ├─ /areas/
│  ├─ /properties/
│  ├─ /market/
│  ├─ /rules/
│  └─ /guides/
├─ /ae/dubai/
│  ├─ /areas/
│  ├─ /projects/
│  ├─ /market/
│  ├─ /ownership-cost/
│  └─ /guides/
├─ /compare/
├─ /tools/
└─ /services/
```

Country, city, area, and property identity belongs in the pathname. Temporary map position, sort order, filters, and UI state use query parameters.

### 5.3 Example legacy mapping

| Legacy URL | V2 destination pattern |
| --- | --- |
| `/explore/?lawdCd=11590&type=officetel` | `/kr/seoul/explore/officetel/dongjak-gu/` |
| `/tools/seoul-rent-check/` | `/kr/seoul/tools/rent-check/` |
| Seoul guide | `/kr/seoul/guides/{slug}/` |
| Dynamic building page | `/kr/seoul/properties/{building-slug}/` |

The final migration manifest must be generated from the actual production URL inventory. Patterns in this section are architecture examples, not authorization to deploy redirects.

## 6. SEO migration contract

The legacy production site remains canonical until a corresponding V2 route passes its migration gate. Duplicate V2 pages remain `noindex` during parity review.

For each URL cohort:

1. inventory the legacy URL, canonical, hreflang, structured data, inbound internal links, and search performance baseline;
2. build a substantively equal or better V2 page;
3. verify content, data freshness, metadata, structured data, locale alternates, and response status;
4. add one exact legacy-to-V2 mapping;
5. release the 301, V2 self-canonical, sitemap entry, hreflang, and internal-link update together;
6. monitor crawling, indexing, traffic, redirect errors, and server errors; and
7. advance to the next cohort only after the current cohort meets its stability gate.

Forbidden migration patterns:

- redirecting unrelated pages to the V2 home page or city root;
- chaining or looping redirects;
- publishing indexable duplicate Seoul pages on both domains;
- changing route, content, canonical, and market data independently over several uncoordinated releases; and
- removing the legacy redirect host after application retirement.

Recommended migration order:

1. low-risk guides;
2. market and area pages;
3. Rent Check;
4. Explorer;
5. building pages; and
6. home page and primary navigation entry points.

## 7. Repository and deployment architecture

V2 is built in a new repository and a separate Vercel project. The existing KoreaHomeGuide repository and production project remain available for legacy operation and urgent production fixes.

```text
dwellspan-platform/
├─ apps/
│  ├─ web/
│  └─ data-jobs/
├─ markets/
│  ├─ korea/
│  ├─ singapore/
│  └─ dubai/
├─ packages/
│  ├─ domain/
│  ├─ market-core/
│  ├─ calculations/
│  ├─ data-rights/
│  ├─ seo/
│  ├─ ui/
│  └─ observability/
└─ migrations/
   └─ legacy-url-map/
```

### 7.1 Runtime responsibilities

- `apps/web`: global web application, server-rendered SEO routes, user-facing APIs, and market capability checks.
- `apps/data-jobs`: ingestion, validation, normalization, dataset publication, and scheduled refresh.
- `markets/*`: source adapters, local classifications, local calculations, required disclosures, and capability declarations.
- `packages/domain`: provider-neutral property and event schemas.
- `packages/calculations`: versioned cost, currency, area, and yield methods.
- `packages/data-rights`: commercial-use and publication enforcement.
- `packages/seo`: canonical, hreflang, sitemap, redirect-manifest, and structured-data generation.

The V2 browser never calls an official government source directly. It consumes only published, versioned datasets. V2 must not have a live runtime dependency on a legacy KoreaHomeGuide endpoint.

### 7.2 Initial infrastructure

- PostgreSQL with PostGIS for normalized operational data and geometry.
- Object storage for immutable raw inputs, validation reports, and versioned publication snapshots.
- PostgreSQL search for the initial product; a separate search service requires measured need.
- A map-provider interface that prevents business rules from depending on one map SDK.
- Repository-managed content for the initial release; a CMS requires demonstrated editorial workflow demand.
- No account system in the first release. Authentication is added with saved items, alerts, or personalized services.

## 8. Publication pipeline

```text
official or licensed source
→ market adapter
→ immutable raw input
→ schema and quality validation
→ common-model normalization
→ rights and capability gate
→ versioned published dataset
→ web, API, comparison, and SEO consumers
```

Publication is atomic by market and dataset version. A failed or partially validated source cannot overwrite the last valid publication. Consumers read a named published version, never a work-in-progress staging table.

Required publication metadata:

- market and source;
- source record identifier;
- source period and retrieval time;
- source and normalized currency;
- source and normalized area;
- event type and record status;
- methodology identifier and version;
- rights-policy identifier;
- known limitations; and
- dataset version and publication time.

## 9. Common domain model

### 9.1 Market

`Market` defines `marketId`, country, city, native currency, timezone, default area unit, and supported locales. Initial IDs are `kr-seoul`, `sg-singapore`, and `ae-dubai`.

### 9.2 GeoArea

`GeoArea` defines market, parent area, local source ID, localized names, geometry, and level. Levels include city, district, neighborhood, community, and other explicitly mapped local levels. Local administrative hierarchies must not be falsely collapsed into a universal naming scheme.

### 9.3 Asset

`Asset` represents a development, project, building, unit type, or unit. It includes market, geography, parent asset, source ID, localized names, completion date, tenure, common category, and source-specific subtype. Individual-unit publication is disabled unless the source and rights policy explicitly allow it.

### 9.4 MarketEvent

`MarketEvent` represents an observation tied to a market, geography, optional asset, sector, period, money, rent terms, area, source, source record, status, methodology, rights policy, and limitations.

Supported event types include:

- `rent_contract`;
- `sale_contract`;
- `developer_sale`;
- `asking_rent`;
- `asking_sale`;
- `valuation`;
- `price_index`;
- `rental_index`;
- `service_charge`; and
- `mortgage_rate`.

Events of different types must remain distinguishable in storage, API responses, visual presentation, comparisons, and disclosures.

### 9.5 Money and area

Money retains original amount and currency, normalized display amount, billing period, conversion rate, rate date, and conversion source. Foreign-exchange conversion is presentation metadata; it never replaces the native observation.

Area retains original value and unit, square metres, precision, and basis. Basis includes exclusive, net, gross, built-up, transaction, and unknown. Area-adjusted comparison is allowed only for explicitly compatible bases.

## 10. Market calculations

Every derived value is tagged with market policy, policy version, assumptions, and source period.

### 10.1 Korea

The deposit-adjusted monthly housing cost is:

```text
monthly rent + deposit × 5% ÷ 12
```

Deposit-adjusted price per square metre is the adjusted monthly housing cost divided by floor area. The same policy must be used for building, neighborhood, district, map, and Rent Check comparisons.

### 10.2 Singapore

Monthly contract rent is the recurring housing cost. Security deposit is displayed separately as initial cash required and is not converted with Korea's opportunity-cost formula.

### 10.3 Dubai

Annual contract rent is divided by twelve for monthly presentation. Cheque count remains a separate payment term. Owner service charges are not mixed into tenant rent.

### 10.4 Cross-market comparison

1. normalize recurring cost with the relevant market policy;
2. preserve the native currency observation;
3. convert only for a selected display currency using a dated rate;
4. compare price per area only when area bases are compatible; and
5. expose missing or excluded costs instead of treating them as zero.

Gross yield is annual rent divided by purchase price. A net operating yield may be shown only when required ownership costs are verified. An incomplete result must be labelled `Partial net estimate` and list excluded costs.

## 11. Data rights and market capabilities

### 11.1 RightsPolicy

Every source declares:

- `canFetch`;
- `canStore`;
- `canCache`;
- `canDisplay`;
- `canCreateDerived`;
- `canUseCommercially`;
- `canIndex`;
- cache TTL;
- retention period; and
- required attribution.

An undeclared permission is false. Enforcement occurs in ingestion, publication, API, UI, export, and sitemap generation.

### 11.2 Initial capability boundaries

| Market segment | Initial usable depth | Boundary |
| --- | --- | --- |
| Seoul official rent and sale | Broad contract-level intelligence | Preserve official-source disclosure, contract-date basis, correction and cancellation caveat |
| Singapore HDB | Public rent and resale intelligence | Do not mix HDB and private residential statistics; respect field-level limitations |
| Singapore private residential | Conditional | Detailed publication requires confirmed URA or other licensed commercial rights |
| Dubai | Conditional | Detailed transactions, rental index, and service charge products require confirmed commercial rights and operating prerequisites |

No public, indexable detailed-market route is generated when its required capability is false.

### 11.3 Data states

Each market surface resolves to one of:

- `fresh`;
- `stale`;
- `insufficient`;
- `unavailable`; or
- `rights_blocked`.

The UI communicates the actual state. It must not silently substitute a different market, sector, event type, source, or stale dataset.

## 12. Korea feature-parity contract

The Korea V2 migration preserves verified intent rather than copying legacy implementation.

### 12.1 Explorer

- Explicit district, neighborhood, and building selection.
- Map movement does not automatically change the discovery rail or selected hierarchy.
- New viewport results require `Search this area`.
- User selection remains stable for at least the existing regression-test interval.
- Human-readable place names replace raw legal codes.
- Map values and comparisons use the same market calculation policy.

### 12.2 Building details

- Desktop uses a centered modal and mobile uses a bottom sheet.
- Street View is labelled as nearby street imagery, not listing photography.
- Media dimensions remain stable during loading.
- Close button, backdrop close, Escape, focus restoration, and internal body scrolling remain supported.
- Information hierarchy starts with location context and actual contracts, then comparison and building information.

### 12.3 Rent Check

- Area, housing type, and size controls share a stable baseline and control height.
- Housing explanation and size assistance have dedicated layout space.
- Empty initial status content consumes no visual space.
- Loading, error, and success states are distinguishable and accessible.
- English and Chinese labels do not create horizontal overflow.

### 12.4 Disclosure

Korea surfaces state that data is officially reported contract data, based on contract date and the latest completed period, may later be corrected or cancelled, is not asking-price data, and is not an appraisal or legal opinion. Management fees, actual brokerage fees, deposit-return risk, and other unavailable facts must not be invented.

## 13. Error handling and isolation

- Market adapters fail independently.
- Publication failures retain the last valid dataset and record a failed attempt.
- Cache keys include market, dataset version, locale, and policy version.
- API responses include data state and publication version.
- Rights failures return a distinct state from source outage or insufficient data.
- A market outage cannot cause a cross-market fallback.
- A single route or dataset cohort can be disabled without disabling the global shell.
- User-visible messages avoid exposing credentials, upstream payloads, or internal stack traces.

## 14. Migration phases and gates

### Phase 0: Freeze the legacy contract

Deliverables:

- production URL, canonical, hreflang, sitemap, and structured-data inventory;
- critical user-flow browser tests;
- legacy API and calculation contract inventory;
- current search-performance baseline; and
- a labelled baseline for the 23 known pre-existing SEO, currency, and dynamic-building failures.

Gate: the inventory is reproducible and covers all indexable and revenue-relevant routes.

### Phase 1: Build the V2 foundation

Deliverables:

- route and locale system;
- common domain model;
- market adapters;
- publication pipeline;
- rights and capability enforcement;
- SEO generators; and
- monitoring and dataset-version visibility.

Gate: synthetic market fixtures prove market, currency, area, rights, and cache isolation.

### Phase 2: Migrate Korea full product

Order:

1. official-data pipeline;
2. Seoul and area pages;
3. Explorer;
4. building details;
5. Rent Check;
6. guides;
7. English and Chinese content; and
8. SEO metadata and structured data.

Gate: critical production flows meet parity or documented improvement, calculation snapshots match approved policies, and no new critical or important review issue remains.

### Phase 3: Add Singapore and Dubai intelligence

Only rights-cleared capabilities are implemented. Unsupported detail remains absent rather than populated through scraping, inference, or another sector's data.

Gate: each public route has sufficient licensed data, explicit methodology, source disclosure, and a rights policy that permits display, derivation, commercial use, and indexing as required.

### Phase 4: Run private beta

V2 runs on its target domain with public indexing disabled.

Gate:

- relevant automated tests pass;
- Critical and Important independent-review findings are zero;
- production-like data and calculations match source samples;
- desktop and mobile critical flows pass browser verification;
- no unexplained horizontal overflow or layout shift affects critical controls; and
- rollback procedures are exercised.

### Phase 5: Migrate URL cohorts

Each cohort receives its own redirect manifest, verification evidence, release record, and monitoring window. Random users do not receive inconsistent canonical destinations for the same URL.

Gate: the cohort has no material redirect, indexing, data, or server-error regression before the next cohort begins.

### Phase 6: Retire the legacy application

Gate:

- no missing redirect for a material legacy URL;
- core URLs are indexed at their intended V2 destinations;
- V2 error and data-quality rates remain within approved release thresholds through the stability window;
- Explorer and Rent Check pass live production checks;
- redirect hosting and monitoring have a long-term owner; and
- the founder explicitly approves retirement.

The legacy Git repository remains archived and recoverable after application retirement.

## 15. Verification strategy

### 15.1 Schema and pipeline tests

- reject records without market, source, native currency, provenance, or rights policy;
- reject unsupported event-type coercion;
- preserve original money and area observations;
- prevent annual-to-monthly double conversion;
- prevent incompatible area-basis comparison;
- test cancellation and correction handling;
- prove atomic publication and last-valid-version retention; and
- verify dataset checksum and publication metadata.

### 15.2 Rights and capability tests

- block API, UI, derived output, export, and sitemap independently according to policy;
- treat missing rights declarations as denied;
- prevent detailed Singapore private and Dubai routes from becoming indexable without the required rights; and
- verify attribution at every public consumer.

### 15.3 Market isolation tests

- market-scoped cache and database queries;
- no cross-market fallback;
- no HDB and private-sector aggregation without an explicit compatible methodology;
- native-currency preservation; and
- independent source and publication failure simulations.

### 15.4 Korea regression tests

- deposit-adjusted cost and price-per-area calculation snapshots;
- explicit Explorer selection and `Search this area` behaviour;
- building modal geometry and accessibility;
- Rent Check alignment, state handling, and overflow;
- English and Chinese route and content parity; and
- source and limitation disclosures.

### 15.5 SEO migration tests

- one-hop exact redirects;
- self-canonical V2 destinations;
- valid reciprocal hreflang;
- sitemap inclusion controlled by data rights and page readiness;
- no indexable duplicate legacy and V2 pages;
- structured-data validity; and
- orphan and redirect-loop detection.

The legacy suite's 23 known failures are not silently accepted as V2 failures. Phase 0 classifies them, and V2 starts with an explicit zero-new-failure standard for its own suite.

## 16. Observability and release evidence

Each release exposes:

- application deployment identifier and commit;
- dataset version per market;
- policy and methodology versions;
- ingestion, validation, publication, API, and page error rates;
- stale, insufficient, unavailable, and rights-blocked counts;
- redirect hits, misses, loops, and destination errors; and
- critical flow performance and availability.

No release is described as complete solely because code was merged or Vercel reports `READY`. Completion requires the relevant automated, browser, data, rights, SEO, and live-production evidence for that phase.

## 17. Rollback design

| Failure | Rollback unit |
| --- | --- |
| Web regression | Previous V2 deployment |
| Bad data publication | Previous market dataset version |
| Market-specific outage | Disable the affected capability or market surface |
| Rights-policy error | Revoke API, UI, derivation, and indexing capability for the affected source |
| SEO cohort regression | Revert only that cohort's redirect manifest and related sitemap entries |
| Korea critical-flow regression | Restore the affected legacy path while the V2 route is repaired |

Rollback must not require data deletion, destructive repository operations, or a global-market outage.

## 18. Pre-implementation decision gates

Implementation planning may begin after this design is reviewed and approved. Public launch remains blocked by separate gates:

1. **Brand gate:** DwellSpan trademark, domain, and language checks pass or an approved replacement name is supplied.
2. **Singapore rights gate:** the exact commercial rights for any URA or other private-residential source are documented.
3. **Dubai rights gate:** the exact commercial rights, API terms, licensing prerequisites, and operating partner requirements are documented.
4. **Migration inventory gate:** the production URL and SEO inventory is complete before redirect implementation.
5. **Retirement gate:** explicit founder approval is required after the Phase 6 evidence is available.

## 19. Authorization boundary

Approval of this design authorizes preparation of a detailed implementation plan. It does not authorize:

- creation or purchase of a public domain;
- use of DwellSpan as a final public brand;
- creation of the new remote repository or Vercel production project;
- changes to the existing GitHub `main` branch;
- changes to KoreaHomeGuide production;
- public indexing of V2; or
- redirect deployment and legacy retirement.

Each implementation and production boundary requires the review and approval process defined for the project.
