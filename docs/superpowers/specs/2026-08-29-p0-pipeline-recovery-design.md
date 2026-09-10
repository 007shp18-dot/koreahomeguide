# KoreaHomeGuide P0 and Pipeline Recovery Design

**Source:** User-supplied `KoreaHomeGuide — 구현 스펙` dated 2026-08-29.

## Scope

This release implements the remaining P0 defects and TASK 0 from the approved implementation specification. It deliberately stops before the building-page routing, Rent Check State A/B, repeat-rent index UI, maintenance-fee persistence, and new search-entry routes.

## Explorer layout

Desktop uses a 64/36 map-and-results grid. The map column is sticky below the header, while the results column participates in normal document flow. Neither the workspace nor the result rail owns a vertical scrolling container. Mobile places the map first and the selected neighborhood/building results below it in document flow; it does not use a clipped bottom sheet.

The existing two-step marker interaction remains unchanged: the first marker click previews the neighborhood and the explicit CTA activates its buildings.

## Market evidence UI

Deposit and floor-area rows use one hierarchy: the rent is the primary 21px value, the sample count is secondary text, and the observed area/deposit is supporting context. For every market row, `n < 5` hides the median and any price bar and renders `Under 5`; `n = 0` renders no row. English uses `1 contract` and pluralizes all other counts; Chinese uses `份合同` without plural logic.

Quarter-over-quarter mix-change values remain available in API compatibility fields but are not presented as rent movement. The UI labels any retained value as including mix effects.

## Rent Check completion behavior

All four Rent Check entry points scroll the completed result into view on viewports up to 760px. Smooth motion is used unless `prefers-reduced-motion: reduce` matches. The result reserves 68px top and 84px bottom scroll margin, and mobile pages reserve 84px for the bottom navigation.

The status element has only `idle`, `loading`, and `error` states. Successful completion returns it to `idle`; the visible result is the success feedback. Duplicate sample copy is removed from the result footer while the evidence block retains the count.

## Sitemap and header consistency

The root sitemap publishes child sitemap entries for all 25 Seoul districts and the three indexable market types. Existing quality gates in each child sitemap remain in force, so adding a district does not publish thin Dong URLs. Product headers use `Explore` consistently and keep the shared currency and language controls.

## Pipeline fields

Rental XML parsing preserves `buildYear` and `floor` using the known XML field aliases. Normalized rows expose:

- `buildYear: number | null`
- `floor: number | null`
- existing previous-price, contract-term, and renewal-right fields

The shared market core exposes:

- `parseLeaseEnd(term) -> { year, month } | null`
- `renewalDelta(row) -> number | null`, limited to renewal monthly-rent pairs with unchanged deposits
- `buildObservedFieldStats(rows)` with build-year range/median, floor range, 12+ month lease-end histogram, and renewal delta distribution

Area, Dong, and building summaries merge the same observed-field stats. Recent transaction rows keep floor, build year, previous rent/deposit, contract term, and renewal-right fields.

Renewal delta output is `{ count, medianPct, p25Pct, p75Pct, zeroCount, overCapCount }`, with percentages represented as percentage points and `overCapCount` counting values strictly above 5%.

## Validation

- Unit tests cover XML aliases, normalization, lease end parsing, valid/invalid renewal pairs, histograms, field ranges, and response aggregation.
- UI contract tests cover no nested scrolling, sample gates, pluralization, mobile result scrolling, success-status removal, full district sitemap coverage, and header consistency.
- The complete Node test suite, JavaScript syntax checks, and `git diff --check` must pass.
- Preview and production are inspected at desktop 1280px and mobile 390px. Explorer must have zero overflowing `auto|scroll` vertical containers; Rent Check must reveal its result after submission; production APIs must expose non-null building/floor observations when the upstream data contains them.
