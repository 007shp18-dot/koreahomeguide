# SignedPrice Korea–Singapore Data Foundation Design

**Date:** 2026-09-01  
**Status:** Approved for implementation  
**Decision:** Approved architecture A — server collection, strict validation, immutable snapshots, and fail-closed publication

## 1. Outcome

SignedPrice will publish a unified, evidence-led property experience for Korea and Singapore without calling government APIs from the browser or substituting fixture values when evidence is unavailable.

The first complete market scope is:

| Market | Property identity | Transactions | Context |
| --- | --- | --- | --- |
| Seoul | Observed transaction buildings, then official BuildingHUB facts where matched | Sale, jeonse, monthly rent | District, legal dong, housing type, area band, contract type |
| Singapore | URA private residential projects | Sale and rental contracts | CCR/RCR/OCR, postal district, tenure, developer sales, pipeline supply |

This specification is the data-foundation companion to:

- `docs/superpowers/specs/2026-09-01-signedprice-unified-market-explorer-v2-design.md`
- `docs/superpowers/specs/2026-09-01-signedprice-unified-building-decision-detail-design.md`
- `docs/superpowers/specs/2026-08-31-signedprice-global-trust-detail-singapore-design.md`

Where an older document limits Singapore to sale-only evidence or Korea to the fixed `45–55㎡` pure-jeonse cohort, this specification supersedes that data boundary.

## 2. Product boundary

SignedPrice is not a listings portal. It publishes completed official records, government-backed building facts, transparent distributions, and explicit source limits.

The platform must not:

- present asking prices as completed transactions;
- imply that an observed-building inventory is the complete building stock;
- mix sale, jeonse, and monthly-rent records in one price distribution;
- mix Korea rental contract groups with Singapore terminology;
- expose a public raw-government-API proxy;
- send a government credential, token, request header, or raw provider error to the client;
- substitute a district or city average for unavailable building evidence;
- serialize a large source snapshot in a Vercel environment variable;
- publish a price statistic with fewer than five eligible records in its exact cohort.

## 3. Shared architecture

Every source-backed market follows one path:

```text
official API
  → server-only collector
  → strict source parser
  → normalized source cache
  → completeness and rights gates
  → immutable versioned snapshot
  → digest-verified server repository
  → route model
  → browser-safe UI
```

Page traffic never calls MOLIT, BuildingHUB, or URA. Collectors run on a source-appropriate schedule. Routes read the last verified immutable snapshot.

### 3.1 Snapshot registry

Each installed market dataset is addressed through a small registry record:

```ts
type InstalledSnapshot = Readonly<{
  marketId: 'kr-seoul' | 'sg-singapore';
  dataset:
    | 'kr-building-registry'
    | 'kr-sale'
    | 'kr-rent'
    | 'sg-private-sale'
    | 'sg-private-rent'
    | 'sg-market-context';
  schemaVersion: string;
  sourceVersion: string;
  parserVersion: string;
  rightsPolicyId: string;
  period: string;
  generatedAt: string;
  objectUrl: string;
  sha256: string;
  recordCount: number;
}>;
```

The registry contains no credential and no raw source record. Snapshot payloads are stored as immutable compressed objects in a private server-readable object store. The browser receives only route-specific public projections.

### 3.2 Completeness gates

A candidate snapshot becomes active only when all required checks pass:

- every expected source partition was requested;
- no required partition returned an unexplained empty result;
- page totals and parsed totals reconcile;
- the covered period is complete and valid for that source;
- records pass strict schema, enum, range, and safe-integer checks;
- stable identities are unique within their declared scope;
- included, excluded, withheld, and unknown counts reconcile;
- the active rights policy permits ingest, aggregate, display, and commercial use;
- the stored payload digest matches the registry digest;
- a canary route model can read the complete candidate before activation.

Activation is atomic. A failed refresh does not replace the previous verified snapshot.

## 4. Credential and security contract

Canonical server-only environment names are:

- `SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY` for approved Korean public-data services;
- `SIGNEDPRICE_URA_ACCESS_KEY` for URA Data Service;
- storage credentials supplied by the selected private object-store integration.

Legacy aliases may be read only during one migration release. New code, documentation, tests, and deployment configuration use the canonical names.

No canonical secret uses a `NEXT_PUBLIC_` prefix. Logs must redact values for access keys, issued tokens, authorization headers, query-string service keys, and object-store credentials.

The URA access key pasted into conversation is treated as exposed and must be rotated before Production installation. The replacement is entered directly into the Production secret store and is never committed to Git, copied into a snapshot, or returned in an agent response.

## 5. Korea data model

### 5.1 Official sources

Korea uses separate source adapters and cache namespaces for:

- MOLIT apartment sale transactions;
- MOLIT officetel sale transactions;
- MOLIT row-house/multifamily sale transactions;
- MOLIT detached/multifamily-house sale transactions;
- the corresponding MOLIT jeonse/monthly-rent services already supported by `@signedprice/korea-rent`;
- BuildingHUB building-register information after service access, current primary-key rules, display rights, and field-level quality are verified.

Sale and rental sources retain cancellation or record-status fields. Cancelled records are excluded from public price distributions but remain counted in exclusion diagnostics.

### 5.2 Building identity is not price evidence

Korea publishes two independent artifacts.

`kr-building-registry` contains discoverable identity:

```ts
type KoreaBuildingIdentity = Readonly<{
  buildingId: string;
  districtCode: string;
  districtSlug: string;
  legalDongCode: string | null;
  legalDongName: string;
  officialName: string;
  normalizedAddress: string | null;
  housingTypes: readonly ('apartment' | 'officetel' | 'villa_multifamily' | 'detached')[];
  observedBy: readonly ('sale' | 'rent' | 'buildinghub')[];
  firstObservedMonth: string;
  lastObservedMonth: string;
  coordinate:
    | Readonly<{ state: 'verified'; latitude: number; longitude: number; provider: string; verifiedAt: string }>
    | Readonly<{ state: 'pending' | 'unavailable'; reason: string }>;
  officialFacts: Readonly<{
    source: 'BuildingHUB';
    buildingRegisterId: string;
    primaryUse: string | null;
    approvalDate: string | null;
    floorsAbove: number | null;
    floorsBelow: number | null;
    householdCount: number | null;
    parkingCount: number | null;
  }> | null;
}>;
```

`kr-sale` and `kr-rent` contain transaction evidence keyed to `buildingId` when a reliable match exists. An unmatched valid transaction is retained in source diagnostics and may support a region aggregate, but it cannot create a fabricated building match.

### 5.3 Stable matching

The matching pipeline uses, in order:

1. official source identifiers when present and compatible;
2. district code, legal-dong code, normalized main/sub parcel, and normalized building name;
3. a reviewed alias table for deterministic source-name variants.

Fuzzy matching cannot automatically publish a building identity. Ambiguous candidates remain unmatched with a recorded reason. BuildingHUB facts never overwrite a transaction-source label without an explicit identity match.

### 5.4 Korea evidence cohorts

Korea building and region summaries are independently segmented by:

- transaction: `sale | jeonse | monthly`;
- housing type: `apartment | officetel | villa_multifamily | detached`;
- area: `under-40 | 40-60 | 60-85 | 85-plus | all`;
- rental contract group: `new | renewal | unknown | all`;
- completed period.

For monthly rent, filed deposit and filed monthly rent remain separate. A deposit-adjusted monthly value is derived only through a verified conversion artifact with its rate, effective date, and method disclosed.

The current `45–55㎡`, zero-rent artifact remains a valid legacy comparable cohort during migration, but it is not called the Seoul inventory and is not the default boundary of the new Explore.

## 6. Singapore data model

### 6.1 Official URA services

The canonical URA client uses the current documented `eservice.ura.gov.sg/uraDataService/.../v1` endpoints and one daily token acquired server-side.

It supports:

- `PMI_Resi_Transaction`, four required batches, past five years;
- `PMI_Resi_Rental`, one required call per reference quarter, past five years;
- `PMI_Resi_Rental_Median`, past three years;
- `PMI_Resi_Developer_Sales`, past three years;
- `PMI_Resi_Pipeline`, latest quarter.

The duplicate package client using the obsolete alternate host/action endpoints and the separate web-layer client are replaced by one package-owned client. A public `/api/ura` raw-result proxy is not part of the target architecture.

### 6.2 Singapore artifacts

Singapore uses three independently activatable snapshots:

- `sg-private-sale`: project identity, CCR/RCR/OCR, postal district, property type, tenure, sale type, area basis, floor band, contract month, integer SGD price, PSF, and source coordinates;
- `sg-private-rent`: project identity, postal district, property type, bedroom count when supplied, area ranges, lease month, and integer monthly SGD rent;
- `sg-market-context`: rental median PSF, developer sales, and project pipeline supply.

Project identity is derived from a normalized combination of source project, street, district/segment, and source coordinates when supplied. URA coordinates represent the property location, not the transacted unit, and the UI states that boundary.

Sales, rental contracts, developer sales, and pipeline facts never share a price distribution. Context records enrich a matched project but do not create a transaction that URA did not report.

### 6.3 URA refresh cadence

Collector schedules follow the official source cadence with a bounded delay:

- sale refresh after Tuesday and Friday end-of-day publication;
- rental-contract refresh after the monthly 15th publication;
- developer-sales refresh after the monthly 15th publication;
- rental-median and pipeline refresh after the quarterly publication date.

The collector refreshes the official rolling windows rather than accumulating unverifiable records beyond the period URA advises retaining. Each activated artifact declares its exact covered period.

## 7. Public route and UI contract

### 7.1 Korea

`/kr/seoul/explore/` supports `전세 / 월세 / 매매` without changing the selected building when the chosen cohort is unavailable.

Region plus property type is sufficient to return a market snapshot. Deposit, monthly rent, sale price, and area are optional refinements. Search accepts district, legal dong, and building name.

The building detail route `/kr/seoul/explore/[districtSlug]/[buildingId]/` provides:

- verified identity and available official building facts;
- Rent mode from jeonse/monthly evidence;
- Buy mode from completed sale evidence;
- Invest mode only when required rent, sale, cost, and user-assumption inputs exist;
- recent privacy-safe official records;
- source, period, sample, exclusion, and correction boundaries.

### 7.2 Singapore

`/sg/singapore/explore/` supports `Sale / Rent` and filters for CCR/RCR/OCR, district, property type, project name, tenure, bedrooms where supplied, and area band.

The project detail route provides:

- sale distribution and completed transaction evidence;
- rental distribution and recent contract evidence;
- tenure and property-type context;
- independently matched developer-sales and pipeline context;
- source, completed period, sample, and limitations.

### 7.3 Rankings

Rankings never combine incompatible evidence. Each market supplies tabs appropriate to its source:

- Korea: median, change, spread, and sample for one selected transaction/housing/area cohort;
- Singapore: median sale price, sale PSF, median rent, rent PSF where directly supported, and sample for one selected market segment/property cohort.

Default ranking density is Top five and Bottom five with an all-results expansion. Change charts use a signed zero-centred axis.

## 8. Rights, attribution, and publication

Every snapshot declares a reviewed rights policy. Rights are checked both at build time and repository load time.

Public surfaces provide:

- source agency and dataset name;
- completed period and generated time;
- publication minimum and sample count;
- important source limitations;
- methodology and corrections links.

Indexing requires stable identity, a valid completed period, display rights, and at least one independently publishable evidence cohort. Thin identity-only pages remain `noindex, follow`.

Market Brief and RSS/news sources never become transaction or building evidence. Only human-approved briefs may appear as contextual editorial content.

## 9. Failure behavior

The system distinguishes:

- credential missing or rejected;
- source unavailable, timeout, or quota limit;
- schema change;
- incomplete partition set;
- rights blocked;
- artifact missing or digest mismatch;
- identity unmatched or ambiguous;
- insufficient sample;
- map or coordinate unavailable.

Source or refresh failure keeps the last verified snapshot active and exposes its completed period. A route never converts a provider failure into zero buildings or zero transactions. Map failure does not remove the result list or detail links.

## 10. Delivery sequence

The implementation is split into independently releasable plans.

### Release 0 — Global density and width repair

The layout repair ships before the new data foundation. It uses three explicit content frames rather than allowing sections to inherit viewport width:

| Frame | Maximum | Use |
| --- | ---: | --- |
| `reading` | `760px` | Long-form copy, guide and methodology prose |
| `standard` | `1120px` | Home content, Check, Rankings, evidence disclosures, capability and market pages |
| `workspace` | `1320px` | Explore map/list workspace and data-dense building/project Detail only |

All frames retain `20px` mobile gutters, `24px` tablet gutters, and `32px` desktop gutters. No content section may use raw `100vw` width for its internal grid. Full-bleed color backgrounds may remain, but their content is centred inside one declared frame.

The attached wide-screen examples establish these required changes:

- the homepage evidence strip is centred inside `standard`; its metrics remain compact and the methodology action does not create a sixth viewport-spanning column;
- the homepage Explore preview is centred inside `standard`, uses a bounded `58/42` split, and has no oversized empty map placeholder;
- intent capability rows use a centred `standard` frame; labels, descriptions, and status badges remain adjacent and no badge is pushed to the viewport edge;
- source and methodology disclosures use compact four-column evidence metadata and three-column dataset metadata inside `standard`, collapsing to two and one columns at defined breakpoints;
- Rankings uses `standard`, readable Top/Bottom views, short rows, and charts whose visual scale does not depend on viewport width;
- Check uses a maximum `1040px` working surface and does not stretch inputs or results across a wide monitor;
- building and Singapore project Detail use `workspace` only when their split layouts need it; prose, evidence ledgers, and record tables remain internally bounded;
- Explore is the only route allowed to approach `workspace` width by default, because the map/list relationship benefits from it.

Typography is unified with the installed local type assets. Display headings, body copy, labels, and tabular numbers each use one declared token. Body lines target `55–72ch`, metadata never drops below `12px` at desktop, Korean body copy retains normal word spacing, and display tracking is not applied to body or labels.

Structural lines use three consistent levels:

- `2px` only for page or major section boundaries;
- `1px solid var(--divider)` for component separation;
- `1px solid var(--line)` for row and cell separation.

Adjacent boxes do not double borders. Empty space must be intentional grouping space, not a consequence of full-width grid tracks.

### Release 1 — Shared snapshot foundation and Korea inventory

- add the snapshot registry and private object-store repository;
- preserve the current verified rent release while removing the false `294 total buildings` implication;
- generate the observed-building registry from all supported valid rent records;
- integrate verified BuildingHUB facts when service access and matching gates pass;
- ship search and identity-only unavailable states without inventing prices.

### Release 2 — Korea sale and complete rent evidence

- add sale source adapters and source-month caches by housing type;
- rebuild rent aggregation without the fixed area/pure-jeonse presentation filter;
- publish independent sale, jeonse, and monthly cohorts;
- connect Explore, Detail, Rankings, and Check to the new repositories.

### Release 3 — Singapore sale and rent

- consolidate the URA client and credential name;
- rotate and install the URA credential server-side;
- build and activate verified sale and rental snapshots;
- connect Singapore Explore and project Detail;
- keep context modules gated until their independent artifacts pass.

### Release 4 — Singapore market context and operational schedules

- add developer-sales, rental-median, and pipeline artifacts;
- configure source-cadence collection jobs and atomic activation;
- run complete browser, client-boundary, Preview, and Production verification.

Each release is deployable only after its own tests, exact-SHA Preview inspection, and rollback check pass.

## 11. Verification requirements

Implementation begins with failing tests and must cover:

- source pagination, partitions, official endpoint parameters, retry budgets, and unexplained-empty rejection;
- strict parsing for every Korea and Singapore source response;
- secret and issued-token absence from client bundles, public responses, logs, and snapshots;
- stable building/project identity, ambiguous-match rejection, and alias review behavior;
- snapshot digest, totals, period, immutability, atomic activation, and previous-snapshot retention;
- independent cohort publication and the five-record minimum;
- sale/jeonse/monthly and sale/rent UI separation;
- route refresh, canonical state, back/forward restoration, and invalid filter fallback;
- server-rendered source, period, sample, limitations, canonical, hreflang, and indexing gates;
- keyboard operation, accessible names, and no horizontal overflow at 390, 720, 1366, and 1440 pixels;
- Naver and Google map success/failure branches without losing non-map content;
- full typecheck, lint, Vitest, production build, client-boundary scans, and browser runtime-error scan;
- exact Production SHA, health checks, and rollback target after promotion.

## 12. Acceptance criteria

The foundation is complete when:

1. no page request calls a government API;
2. no government credential or token is present in Git or a client bundle;
3. Korea Explore can discover observed buildings independently of price publication and can switch among sale, jeonse, and monthly evidence;
4. verified BuildingHUB facts appear only for deterministic matches;
5. Singapore Explore can switch between verified private sale and rent evidence;
6. every displayed figure reconciles with one installed immutable snapshot and exposes source, period, and sample;
7. failed refreshes preserve the previous verified snapshot;
8. fixture data, broad-average substitution, and misleading total-building claims are absent from Production;
9. all automated, browser, Preview, and Production gates pass for the deployed SHA.
