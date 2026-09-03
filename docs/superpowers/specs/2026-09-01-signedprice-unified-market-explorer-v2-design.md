# SignedPrice Unified Market Explorer V2 Design

**Date:** 2026-09-01  
**Status:** Written specification for user review  
**Supersedes:** the installed 294-building Explorer boundary and any design that treats the fixed `45–55㎡` pure-jeonse cohort as a complete building inventory

## 1. Outcome

SignedPrice becomes one evidence-led property workspace across Explore, building Detail, Contract Check, and Rankings. Korea launches with the same stable transaction navigation everywhere:

- `전세`
- `월세`
- `매매`

The UI exposes the long-term Rent, Buy, and Invest product architecture now, but it activates a claim only when the corresponding verified artifact is installed. Missing evidence produces an explained unavailable state, never a mock value.

This release also corrects the current inventory mistake. The installed 294 records are not the Seoul building universe. They are only buildings with at least five non-cancelled, zero-monthly-rent contracts in the `45–55㎡` band during seven completed months. The product must never label that count as total buildings.

## 2. Release boundaries

The work is delivered as three independently testable releases on one feature branch:

1. **Market data foundation** — separate discoverable buildings from publishable price evidence, retain every supported area and rent structure, add verified coordinates, and define the sale artifact gate.
2. **Unified Explore and Detail** — implement the supplied standalone Explore Map and Detail View direction using the shared transaction, property-type, area, and map state.
3. **Decision tools and rankings** — repair Contract Check entry, add region-and-property-type market browsing, and replace the dense ranking and distribution visuals.

Each release must be safe to deploy by itself. The existing verified Rent experience remains available while later data artifacts are being built.

## 3. Non-negotiable constraints

- Next.js `16.3.3`, React `19.2.8`, TypeScript `5.9.3`, pnpm `11.19.0`.
- No new runtime dependency without a separate review.
- Money remains integer KRW and area remains square metres internally.
- Internal links end in `/` in source.
- A price distribution requires at least five eligible contracts in its exact segment.
- A thin segment hides only its price statistics; it does not delete the building identity.
- No invented coordinates, photographs, building facts, prices, yields, forecasts, or provider rights.
- No parent average may silently replace missing building evidence.
- New, Renewal, Unknown, monthly rent, jeonse, and sale cohorts are never silently mixed.
- Every unavailable state has a title, factual reason, and valid next action.
- Search, filters, maps, and detail identity remain usable when a price cohort is withheld.
- The supplied SignedPrice Explore Map and Detail View standalone HTML files are composition references, not data sources.

## 4. Inventory and evidence separation

### 4.1 Current defect

The current generator:

- collects 25 Seoul districts, four rental housing sources, and seven completed months;
- keeps only pure jeonse with `monthlyRentWon === 0`;
- keeps only `45 <= areaSqm <= 55`;
- requires a building label and legal dong;
- drops a building when that exact cohort has fewer than five records;
- produces 294 published records containing 5,378 retained contracts;
- installs no verified latitude or longitude for any of those 294 records;
- has a regression test that hard-codes `294`.

This is a publishable comparable cohort, not an inventory.

### 4.2 New contracts

Discovery and evidence use separate versioned artifacts.

```ts
type KoreaObservedBuildingRecord = Readonly<{
  buildingId: string;
  districtSlug: SeoulDistrictSlug;
  neighborhoodId: string;
  neighborhoodName: string;
  officialName: string;
  housingType: 'apartment' | 'officetel' | 'villa_multifamily' | 'detached';
  observationCount: number;
  firstObservedMonth: string;
  lastObservedMonth: string;
  coordinate:
    | { state: 'verified'; latitude: number; longitude: number; provider: string; verifiedAt: string }
    | { state: 'pending' | 'unavailable'; reason: string };
}>;

type KoreaBuildingEvidenceRecord = Readonly<{
  buildingId: string;
  generatedAt: string;
  period: string;
  transaction: 'jeonse' | 'monthly' | 'sale';
  areaBand: 'under-40' | '40-60' | '60-85' | '85-plus' | 'all';
  contractGroup: 'all' | 'new' | 'renewal' | 'unknown' | 'not-applicable';
  summary: PublishedDistribution | WithheldDistribution;
  recentTransactions: readonly PublicTransaction[];
  provenance: PublicEvidenceProvenance;
}>;
```

The observed-building artifact initially contains every normalized supported building with at least one valid source observation, regardless of price publication minimum. It is labelled `Observed buildings`, not `All Seoul buildings`.

The product may claim complete building-stock coverage only after a separately reviewed official building-register or apartment-register source is installed with a completeness statement and display rights. Until then, buildings with no source observation are unknown rather than inferred.

### 4.3 Publication behavior

- Inventory rows remain visible when `n < 5` and show `Contract evidence insufficient`.
- A building can have published jeonse evidence and withheld monthly or sale evidence independently.
- Area bands publish independently. The `all` band is not substituted for a selected thin band.
- The artifact records counts for observed buildings, coordinate-ready buildings, published evidence segments, withheld segments, and exclusion reasons.
- Tests verify schema, identity uniqueness, reconciliation totals, period completeness, and hashes. They never assert a permanent exact building count.

## 5. Data acquisition and normalization

### 5.1 Rent

The existing complete MOLIT rental-month paging and source cache remain the source. Aggregation stops discarding records based on presentation choices.

- Jeonse: `depositWon > 0 && monthlyRentWon === 0`.
- Monthly: `monthlyRentWon > 0`, retaining both filed deposit and filed monthly rent.
- A converted monthly-cost metric is shown only when it consumes a verified published conversion curve and discloses the rate and effective date.
- Detached records remain discoverable when they have a stable identity; they are not silently discarded because the previous price artifact supported only three types.

### 5.2 Sale

Sale uses a separate server-only MOLIT source adapter, cache namespace, parser version, rights policy, and versioned artifact. It retains completed official transactions and cancellation status. Sale does not activate from asking prices, fixtures, or district averages.

Before the sale artifact passes source completeness, rights, schema, and publication gates, `매매` remains visible but renders an unavailable state with no price.

### 5.3 Coordinates

Coordinates are resolved server-side from normalized district, legal dong, and official building name. The coordinate cache stores provider, normalized query, result identity, verified time, and failure reason.

- Coordinates must fall inside validated Seoul bounds.
- Ambiguous or out-of-bounds matches remain pending.
- A list result never disappears because its coordinate is missing.
- Naver Dynamic Map renders verified Seoul coordinates.
- Map SDK or coordinate failure affects only the map layer, never the result rail or Detail link.

### 5.4 Building visuals and facts

Detail visual priority is licensed first-party photo, permitted live Street View, permitted live map, then an honest no-image state. Scraped, generated, unattributed, or hot-linked building images are prohibited in Production.

Construction year, household count, parking, orientation, and other facts appear only from an installed provenance-bearing official source. Missing facts remain absent rather than estimated.

## 6. Shared route and state model

Explore remains canonical at:

`/kr/seoul/explore/`

Building Detail remains canonical at:

`/kr/seoul/explore/[districtSlug]/[buildingId]/`

Validated query state:

```text
transaction=jeonse|monthly|sale
property=apartment|officetel|villa_multifamily|detached|all
area=under-40|40-60|60-85|85-plus|all
contract=new|renewal|all
district=<districtSlug>
neighborhood=<neighborhoodId>
building=<buildingId>
sort=evidence|price|change|recent
```

Rules:

- `contract` is available only for jeonse and monthly rent. Sale uses `not-applicable` and does not display New/Renewal controls.
- Invalid values fall back safely and never create a second canonical page.
- Explore passes all validated state into Detail.
- Back, forward, refresh, and `Back to map` restore transaction, filters, selected district, selected building, map centre, and zoom.
- A changed transaction keeps the same building selected when that building exists in the observed inventory, even if its selected evidence is unavailable.

## 7. Global and transaction navigation

Every Explore and Detail page uses three navigation levels without duplicating intent:

1. Market: `Korea / Singapore / Dubai`.
2. Product: `Check / Explore / Rankings / Market Briefs / Guide`.
3. Korea transaction: `전세 / 월세 / 매매`.

Rent, Buy, and Invest are decision modes on building Detail, not aliases for the three transaction sources:

- Rent consumes jeonse or monthly evidence.
- Buy consumes sale evidence.
- Invest combines immutable rent and sale evidence with explicit user assumptions.

Investment outputs never activate from a missing sale or rent dependency and never inject a default appreciation forecast.

## 8. Explore composition

The supplied standalone Explore Map defines the composition direction.

### 8.1 Desktop

- Map occupies approximately 65 percent; the evidence rail occupies 35 percent.
- The map starts within the first viewport rather than below a large hero.
- A compact floating filter bar contains property type, metric, and evidence count.
- District zoom shows 25 district summaries.
- Building zoom shows verified building coordinates from the observed inventory.
- `Search this area` appears after deliberate map movement. The map does not auto-reset or scroll the page.
- Marker and list selection are synchronized.
- The result rail supports deterministic incremental loading instead of a permanent first-ten cap.

### 8.2 Search and filters

Region and property type alone are sufficient to produce a Market Snapshot. Price, deposit, rent, and size are optional refinements.

The search accepts district, legal dong, and building name. Results state:

- observed building count;
- coordinate-ready count;
- published-price count for the selected transaction and area;
- withheld-price count and reason;
- completed source period.

No UI labels the observed count as the complete Seoul building universe.

### 8.3 Evidence rail

The rail moves through district, neighborhood, and building states. It shows one primary value, its sample and period, P25–P75 when published, New/Renewal comparison for rental evidence, and a canonical Detail action.

The complete 25-district ranking is not compressed into the rail. Explore links to the dedicated Rankings view.

### 8.4 Mobile

Mobile uses a full-width map with an accessible bottom sheet. The sheet contains current selection, filters, results, and Detail action in DOM reading order. All targets are at least 44 pixels and the page has no horizontal overflow at 320 pixels.

## 9. Building Detail composition

The supplied standalone Detail View defines the evidence hierarchy.

- Sticky compact header with breadcrumb and `전세 / 월세 / 매매`.
- One verified building visual or honest fallback.
- Identity, address, property type, source period, and evidence readiness.
- One selected-mode headline and no more than four KPI cells.
- Large P25–Median–P75 distribution with a plain-language spread interpretation.
- New/Renewal/All comparison for rentals only.
- Area-band evidence.
- Recent completed official transactions.
- Provenance, correction history, and missing reasons.
- Approved Market Briefs in the side rail.
- Community remains hidden or explicitly closed until its verified storage and publication thresholds are live.

The first screen remains sparse. Raw records, secondary adjustments, methodology, and source ledger sit below a disclosure boundary. Detail is a decision page, not a property listing or lead form.

## 10. Contract Check

The current cramped five-choice housing control inside a three-column quote form is removed.

Contract Check has two progressive modes:

1. **Browse market** — region plus property type immediately returns the selected Market Snapshot.
2. **Check a specific quote** — optional area, deposit, and monthly rent compare a user quote with an independently published segment.

Missing quote values are never converted to zero and never produce a personalized verdict. Desktop gives the input surface enough width for labels; mobile stacks fields without truncation. The evidence panel moves below the form at widths where a safe two-column minimum cannot be maintained.

## 11. Graphs and Rankings

### 11.1 Distribution

- One horizontal P25–P75 band with a median marker.
- A user marker appears only when a quote exists.
- Money uses Korean large-number formatting at the display boundary.
- Sample, completed period, and filling-month status sit adjacent to the graph.
- Extreme values do not flatten the decision range; outliers are disclosed separately.

### 11.2 District Rankings

- Tabs: `Median / Change / Spread / Sample`.
- Default: Top five and Bottom five, with an explicit all-25 expansion.
- One readable horizontal bar per district with its value at the end.
- The selected district is highlighted in both chart and table.
- Change uses a signed zero-centred axis.
- Box plots are reserved for Detail distribution, not repeated in every district row.
- Transaction-specific definitions prevent rent concepts from appearing in sale rankings.

## 12. Market Brief integration

The Explore and Detail rails consume only approved Market Briefs. The editorial pipeline remains:

- Korea, Singapore, and Dubai;
- three English briefs per market per day;
- source collection from approved news inputs;
- human approval required before publication;
- source links, market scope, generated time, reviewer state, and claim boundary retained.

Unapproved drafts never appear in public pages. News or RSS content never becomes price evidence.

## 13. SEO and language

- Stable building pages become indexable only with verified identity, a completed evidence period, and at least one publishable evidence mode.
- Observed buildings with no publishable price may remain useful in Explore but are `noindex, follow` until the publication gate passes.
- Transaction and mode queries canonicalize to the stable route.
- Structured data contains only verified facts and completed evidence.
- Korean and English routes use correct `lang`, reciprocal `hreflang`, and equivalent evidence semantics.
- Sitemaps publish only canonical routes that pass their release gate.

## 14. Accessibility, resilience, and performance

- Tabs use native buttons, `role=tab`, `aria-selected`, and matched panels.
- Search and map selection are fully keyboard operable outside provider canvas limitations.
- Color is paired with text, shape, fill, or hatch.
- Map, Street View, image, brief, and individual evidence failures remain isolated.
- The list and Detail remain usable without either map SDK.
- Server artifacts are versioned and validated before rendering.
- No provider credential or raw source payload enters the client bundle.
- Large observed inventories are filtered and paged; they are not serialized wholesale into every route.

## 15. Verification and release gates

Every implementation behavior begins with a failing test. Required gates are:

- inventory/evidence reconciliation, identity, exclusion-reason, and artifact-version tests;
- pagination and source-completeness tests for rent and sale;
- coordinate verification, ambiguity, bounds, cache, and failure tests;
- URL restoration and invalid-state tests;
- transaction-specific UI and unavailable-state tests;
- Contract Check browse-versus-quote tests;
- graph geometry and ranking-order tests;
- server-rendered evidence, canonical, language, and structured-data tests;
- keyboard and accessible-name tests;
- browser checks at 390, 720, 1366, and 1440 pixels;
- Naver SDK success and failure branches;
- full Vitest, typecheck, lint, production build, and client-boundary scans;
- exact-SHA Preview review before Production promotion;
- Production browser and runtime-log verification after promotion.

## 16. Release sequence

1. Replace the 294-record boundary with observed inventory plus independent evidence artifacts.
2. Populate rental area bands and monthly-rent evidence without weakening publication minimums.
3. Add coordinate resolution and render actual building markers.
4. Rebuild Explore from the supplied map composition and shared URL state.
5. Rebuild Detail from the supplied evidence composition and decision modes.
6. Split Contract Check into Browse Market and Check Quote.
7. Replace distribution and Rankings visuals.
8. Install and verify the sale source artifact, then activate `매매`.
9. Activate Investment scenarios only when their required evidence and explicit inputs exist.
10. Connect approved Market Briefs to Explore and Detail rails.

The release does not call a count complete until its source contract proves completeness. It favours more discoverable buildings immediately while preserving the rule that thin evidence remains unpublished.
