# SignedPrice Global Trust, Detail, and Singapore Design

**Status:** Approved product direction; written design awaiting review

**Date:** 2026-08-31

**Scope:** Global trust primitives, click-through Korea detail views, and the first Singapore URA market implementation

## 1. Product decision

SignedPrice is a global real-estate decision platform. Seoul rental decisions are the first evidence-complete wedge, not the product boundary.

The platform is organized around four reusable layers:

1. **Decision tools** compare contracts, prices, rent-versus-buy choices, and investment inputs.
2. **Market evidence** exposes districts, projects, reported transactions, distributions, and source limits.
3. **Trust** exposes provenance, coverage, freshness, accuracy where measured, and correction history.
4. **Market adapters** translate official source data and local terminology into the common contracts without forcing one country's housing model onto another.

Korean jeonse logic must not leak into Singapore. Singapore tenure, property sectors, SGD units, transaction types, and URA/HDB source boundaries remain native to Singapore.

## 2. Delivery decomposition

This design is delivered as three isolated tracks on one successor branch. Each track has its own tests and release gate.

| Track | Outcome | Depends on |
| --- | --- | --- |
| A — Global Trust | Shared evidence status, freshness, empty reasons, and correction records | Existing market-core contracts |
| B — Korea Detail | Explore clicks resolve to shareable district and later building URLs | Existing Korea area artifact; new building artifact for building mode |
| C — Singapore | Server-only URA adapter, verified snapshot artifact, Singapore Explore and project detail | URA credential, live schema canary, dataset-specific terms |

PR #26 remains the reviewed Seoul decision candidate. The successor branch starts from its exact tree. Production and KoreaHomeGuide remain unchanged until their existing release gates are met.

## 3. Shared trust architecture

### 3.1 Common types

`@signedprice/market-core` owns country-neutral contracts. It must not import a market adapter.

```ts
export type EvidenceState =
  | 'ready'
  | 'insufficient'
  | 'incomplete'
  | 'not_loaded'
  | 'rights_blocked'
  | 'source_unavailable'
  | 'invalid';

export type EmptyReason =
  | { code: 'INSUFFICIENT'; count: number; threshold: number }
  | { code: 'NOT_REPORTABLE'; note: string }
  | { code: 'NOT_LOADED'; market: string }
  | { code: 'RIGHTS_BLOCKED'; source: string }
  | { code: 'SOURCE_UNAVAILABLE'; retryable: boolean };

export type EvidenceDescriptor = Readonly<{
  marketId: string;
  provider: string;
  dataset: string;
  period: string;
  generatedAt: string;
  state: EvidenceState;
  publicationMinimum: number | null;
  methodologyId: string;
  rightsPolicyId: string;
}>;

export type CorrectionStatus = 'FIXED' | 'UPHELD';

export type Correction = Readonly<{
  id: string;
  date: string;
  marketId: string;
  scope: string;
  status: CorrectionStatus;
  raisedBy: 'USER' | 'INTERNAL';
  summary: string;
}>;
```

`EmptyReason` always renders a title, reason, and next action. Missing values are never serialized as zero and never replaced with a market average.

### 3.2 Trust surfaces

- `/trust/` explains global evidence, rights, corrections, and accuracy principles.
- Each ready market links to its local source boundary and correction history.
- Korea uses `/kr/seoul/corrections/`.
- Singapore uses `/sg/singapore/corrections/`.
- An empty correction ledger is honest and valid. Production never includes invented `FIXED` or `UPHELD` examples.
- A route links only to corrections whose scope matches that route or one of its evidence artifacts.

### 3.3 Freshness and incomplete data

Freshness is read from verified artifact fields such as `period` and `generatedAt`; it is never hardcoded into UI copy.

Korea public summaries currently contain completed source months only. The UI states that incomplete recent months are excluded instead of rendering fabricated incomplete bars. A future source that includes provisional months may use the shared `incomplete` state and hatched visual treatment.

### 3.4 Accuracy

Accuracy is optional evidence, not a marketing constant. MdAPE, PPE@10%, sample count, folds, training window, and scoring window require a separately validated accuracy artifact for one specific decision model and market.

The repository contains no reproducible sale-price artifact supporting the example claims `191,067`, `8.2%`, or similar values. Those claims remain unpublished. The initial Trust release explains the policy but shows no model-accuracy number.

### 3.5 Disclaimers

The current Korea Contract Check compares reported contract structures; it is not a property-price estimate. Valuation-specific copy is therefore not added to it.

If a later surface publishes an estimated property value, the estimate carries a prominent statement immediately below the value that it is an estimate and does not replace a professional valuation. The negative statement is the only permitted use of valuation-regulated terminology in user-facing copy.

## 4. Korea Explore and detail navigation

### 4.1 Route model

All detail state is addressable and reload-safe.

| Route | Role |
| --- | --- |
| `/kr/seoul/explore/` | Seoul district map and complete district table |
| `/kr/seoul/explore/[district]/` | District detail with building list when verified |
| `/kr/seoul/explore/[district]/[buildingId]/` | Building detail when a verified building artifact exists |

The existing `/kr/seoul/[district]/` routes remain compatible entry points during migration. They may redirect only after parity, metadata, and regression checks pass.

### 4.2 Interaction

- A district map shape and district table row expose the same destination.
- Selection may preview a district in place, but the primary action navigates to its URL.
- A building row navigates to building detail; it does not open the existing parity `BuildingDialog` as the canonical experience.
- Breadcrumbs return building → district → Explore.
- Back, forward, refresh, copied URLs, and keyboard activation preserve the same view.
- Query parameters may hold filters such as deal and contract split. The server validates every value and uses a documented default.

### 4.3 District data

The existing verified Korea area artifact already supports district contract count, median, P25, P75, minimum, maximum, three-month change, period, and publication state. The first detail release uses those fields and the new Trust components.

The default contract split remains `all` until split-specific distributions are present in the artifact. The UI must not default to `new` while displaying combined values.

### 4.4 Building data contract

The current `seoul-explorer-data.ts` building list is versioned UI-parity fixture data. Its coordinates and evidence values are null. It cannot become public evidence.

A building route is published only from a new server-validated artifact containing:

- stable building identity and district identity;
- official or otherwise rights-cleared location identity;
- housing type and supported deal types;
- completed period and generation instant;
- overall and split-specific counts and five-number distributions;
- area-band distributions;
- recent reported contracts with privacy-safe public fields;
- explicit exclusions and publication thresholds;
- provenance, rights, parser, and artifact versions.

Floor, orientation, physical facts, building-register fields, scheduled supply, news, and community data are separate optional evidence blocks. Their absence never blocks the core building route and never becomes a fabricated placeholder.

### 4.5 Responsive layout

The supplied detail concept informs hierarchy, not literal constraints. The release supports mobile, 720px, desktop, and wide viewports. It does not require a 1,400px minimum.

- Wide: main detail plus a bounded contextual rail when real content exists.
- Mobile/tablet: one document flow; no off-screen fixed-width rail.
- All structural borders, colors, radii, focus rings, and fonts use the existing Modernist tokens.
- No new petrol palette, one-pixel structural rules, rounded cards, or hardcoded example values are introduced.

## 5. Singapore market boundary

### 5.1 Initial market scope

The first Singapore implementation is **URA private residential transaction intelligence**. HDB remains a separate future adapter and is never mixed into a URA private-residential distribution.

The first release supports evidence and exploration. It does not copy the Korean deposit-conversion comparison because Singapore rental structures and source data require their own decision model.

Initial Singapore jobs:

1. Compare reported sale evidence across market segments, property types, projects, and periods.
2. Open a project detail page with transaction distribution and source limits.
3. See tenure, sale type, area basis, SGD price, and unit-price basis in native terms.

Rental intelligence may be added only after the official rental service response and permitted public fields are separately validated.

### 5.2 Official source and rights

URA Data Service is the source. The access key is a credential, not a publishable identifier.

- Environment name: `SIGNEDPRICE_URA_ACCESS_KEY`.
- The key is server-only in Vercel Preview and Production scopes.
- The browser never receives the access key, issued bearer token, token endpoint response, or raw request headers.
- Logs redact credential and token values.
- Token generation and data requests use the documented URA endpoints and security headers.
- The API terms and Singapore Open Data Licence form the baseline rights policy.
- Any additional condition shown for an individual dataset is encoded in the active rights record before `display` or `commercial` operations are enabled.
- Suspension, access denial, quota failure, malformed response, and changed schema fail closed.

The platform does not scrape URA's consumer website and does not use third-party property portals or scraping services.

### 5.3 Source adapter

A new `@signedprice/singapore-property` package owns:

- credential presence checks;
- token acquisition and bounded token reuse;
- request deadlines and provider-call budgets;
- strict URA response parsing;
- native Singapore enums and unit normalization;
- rights lookup;
- source snapshot generation;
- browser-safe public types.

The package exposes no credential-bearing type from its browser entry point.

The live canary captures only schema and aggregate diagnostics needed to implement the parser. Raw credentials and full raw provider payloads are not committed. Sanitized fixtures contain synthetic values with the same verified shape.

### 5.4 Singapore artifact

Routes read a versioned snapshot artifact, not the live URA API on every page request. This prevents page traffic from consuming provider quota and makes every rendered value reproducible.

The artifact contains:

- artifact, source, parser, and rights-policy versions;
- market `sg-singapore`, provider `URA`, dataset identifier, generated instant, and covered period;
- source completeness and batch coverage;
- stable project identity derived from source fields, never from display name alone;
- market segment, property type, tenure, district or planning-area context when supplied;
- sale type, contract period, area, transacted price in integer SGD, and official unit-price basis;
- aggregate project and area summaries with publication counts;
- exclusion and unknown-field counts;
- digest and cross-field totals.

Parser and repository validation reject unknown keys, invalid enums, unsafe monetary values, inconsistent counts, incomplete batches, reversed periods, duplicate identities, digest mismatches, or rights withdrawal.

Storage is selected after measuring the verified payload. A small bounded artifact may use the existing server environment pattern. A larger snapshot uses a private Vercel Blob or equivalent server-only object store. It is not forced into an environment variable beyond platform limits and is not committed merely to avoid choosing storage.

### 5.5 Singapore routes

| Route | Role |
| --- | --- |
| `/sg/` | Singapore decision and evidence entry |
| `/sg/singapore/explore/` | Private residential market explorer |
| `/sg/singapore/explore/[area]/` | Area or segment detail |
| `/sg/singapore/explore/[area]/[projectId]/` | Project detail |
| `/sg/singapore/corrections/` | Singapore correction ledger |

The market switcher remains hidden until at least `/sg/` and Singapore Explore pass live evidence, rights, browser, and failure-state gates. Empty country routes are not indexed.

### 5.6 Singapore UI

- Money is integer SGD internally and rendered as SGD.
- Source area units remain visible. Derived square-metre values, if shown, are labeled as conversions and tested against the exact conversion factor.
- PSF and PSM are never confused.
- Tenure, market segment, property type, and sale type use Singapore terminology.
- Charts expose distributions and counts, not forecasts.
- No asking listings are compared with contracted transactions.
- Missing or under-supported groups show an explicit reason and next action.
- The UI uses the same SignedPrice visual system but not Korean field names or jeonse concepts.

## 6. Deferred surfaces

The following remain deferred until their independent dependencies exist:

- free-text community and review feeds;
- aggregated estimate feedback requiring durable storage and abuse controls;
- saved properties or comparisons requiring identity, privacy, and retention policy;
- automatically generated news without an editorial and correction pipeline;
- Korea building-register facts before official BuildingHUB access is configured;
- supply-in-pipeline blocks without a current official source contract;
- floor, orientation, view, noise, or renovation price effects without sufficient matched evidence;
- Singapore HDB/private combined metrics;
- Singapore forecasts, valuations, or investment recommendations.

These items are not rendered as inactive fake tabs on a live market page.

## 7. Failure and privacy behavior

Every source-backed route follows:

```text
request → server repository → strict artifact → rights check → route model → UI
```

Failures preserve their identity:

- configuration missing;
- token/access denied;
- rights blocked;
- source timeout or unavailable;
- rate or quota limited;
- malformed or changed schema;
- incomplete snapshot;
- insufficient sample;
- unknown route identity.

The UI receives a browser-safe reason, not raw diagnostics. Credentials, raw labels supplied by users, exact private addresses, tokens, provider headers, and internal record identifiers are never logged to analytics.

## 8. Testing strategy

### 8.1 Global Trust

- exact common-type validation and immutability;
- every empty state renders title, reason, and next action;
- no missing number becomes zero;
- `FIXED` and `UPHELD` render in tests, while Production may validly have zero corrections;
- freshness always derives from artifact metadata;
- no unsupported accuracy claim is present.

### 8.2 Korea Detail

- district map, selected card, and table navigate to the same canonical detail URL;
- route refresh and browser navigation preserve state;
- district values reconcile exactly with the area artifact;
- combined data is never labeled as new-only or renewal-only;
- building routes fail closed when the building artifact is absent;
- no parity fixture is represented as current evidence;
- mobile, 720px, desktop, and wide layouts have no horizontal overflow;
- touch targets and focus order meet the existing release contract.

### 8.3 Singapore

- token and request headers are tested with fakes and never serialized;
- provider deadlines, quotas, retries, and access denial remain distinct;
- strict parser fixtures cover valid, missing, duplicate, extra-key, invalid-enum, unit, period, and unsafe-money cases;
- artifact digest, counts, batch coverage, rights, and provenance are cross-validated;
- SGD and area conversion tests prevent factor-of-ten and PSF/PSM mistakes;
- server/client boundary scans reject the access-key name and provider endpoints from client assets where appropriate;
- source-less and rights-blocked routes render claim-free unavailable states;
- live canary and exact-SHA Preview prove official API → artifact → repository → page before market navigation appears.

### 8.4 Full release gate

- focused RED/GREEN tests for every task;
- all V2 Vitest regression tests;
- ESLint and all-package TypeScript;
- fresh Next.js production build;
- client secret and credential-name scan;
- desktop, mobile, 720px, and wide Chromium tests;
- raw server HTML, accessibility, keyboard, overflow, console, and 5xx checks;
- SEO containment, sitemap, canonical, and hreflang checks;
- Vercel exact-SHA Preview;
- KoreaHomeGuide preservation checks.

## 9. Implementation order

1. Add common Trust primitives and test-only correction fixtures.
2. Add global and market correction routes plus shared evidence disclosure components.
3. Convert Korea Explore district interactions into canonical click-through navigation.
4. Build the Korea district detail shell on existing verified area summaries.
5. Define and validate the Korea building artifact; publish building routes only with real evidence.
6. Add the Singapore package with credential, token, rights, request, and strict parser boundaries.
7. Run the official URA live schema canary without persisting secrets or unredacted payloads.
8. Generate, validate, and store the first Singapore artifact.
9. Build Singapore entry, Explore, area, project, Trust, and correction routes.
10. Run complete local, GitHub, Preview, and preservation gates.
11. Expose Singapore navigation only after ready-state evidence and user-visible Preview acceptance.

## 10. Promotion rules

Implementation completion does not imply Production promotion.

Korea Production remains blocked until the official logo and verified conversion-curve artifact are present and its ready-state Preview is accepted.

Singapore Production remains blocked until:

1. the credential works in the intended Vercel scope;
2. the official live response shape is verified;
3. dataset-specific rights permit the rendered operations;
4. the complete snapshot artifact passes validation;
5. client assets contain no credential or token;
6. exact-SHA browser and failure-state gates pass;
7. the market switcher exposes no unsupported HDB, rental, forecast, or valuation claim.
