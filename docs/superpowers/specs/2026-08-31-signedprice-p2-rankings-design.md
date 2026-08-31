# signedprice P2 Seoul Rankings Design

**Date:** 2026-08-31

**Status:** Approved for implementation

**Roadmap slice:** P2 subproject 2 of 3

## 1. Decision

Build a server-rendered Seoul rankings page at `/kr/seoul/rankings/` from the
same verified public area-summary artifact already used by Explore and the 25
district detail pages. Publish four complete, deterministic district rankings:

1. cheapest median refundable jeonse deposit;
2. three-month change from lowest to highest;
3. widest middle-half spread; and
4. deepest qualifying sample.

This slice adds no provider request, API key, collection job, fixture figure,
listing price, asking price, or new environment variable. It converts the
existing verified district distribution into a new decision surface without
changing the meaning of the underlying evidence.

## 2. Why this is next

The build specification pairs Explore and Rankings in P2. Explore is already
in Production, and its immutable artifact contains every field Rankings needs:
`med`, `p25`, `p75`, `chg3m`, and `n`. Completing Rankings now has three
advantages:

- it closes the existing Explore evidence loop before introducing another data
  or content subsystem;
- it has no new source, rights, cache, secret, or live-provider dependency; and
- it creates reusable ranked-list and signed-change primitives for later
  Budget, News, and Timing surfaces.

### Selected: one derived server model over the existing artifact

The route model parses the artifact through the existing server-only
repository, derives all four lists once, and passes immutable display models to
the React page. This keeps validation, numbers, labels, and source boundaries
aligned with Explore.

### Rejected: a rankings-specific artifact

A second artifact would duplicate the same 25 summaries, introduce a new
environment contract, and create avoidable drift between the map and ranking
order.

### Rejected: client-side sorting of Explore rows

Client sorting would make the initial HTML incomplete, complicate no-JavaScript
and accessibility behavior, and let display logic diverge from structured
server tests.

### Deferred: Guide or Compare/Budget first

Guide remains the next content migration and Compare/Budget remain high-value
decision tools. Both require a larger new contract: versioned chapter content
and change logs for Guide, and explicit opportunity-cost and affordability
assumptions for Compare/Budget. Rankings can ship safely before either.

## 3. Scope

### Included

- `/kr/seoul/rankings/` with four complete ranked district lists.
- A pure rankings model derived from `VerifiedPublicAreaSummaryArtifact`.
- Exact metric definitions, deterministic ties, exclusion reasons, and source
  limitations in visible copy.
- A zero-centred signed bar for the change ranking.
- Links from Explore and district detail pages into Rankings while keeping the
  four primary workbook tabs unchanged.
- Server HTML, keyboard and screen-reader contracts, responsive behavior, and
  release verification at 390px, 720px, and 1440px.
- The existing `noindex, follow` SEO state and current Production artifact.

### Excluded

- New data collection, provider calls, credentials, cache keys, or artifact
  formats.
- Neighbourhood, building, sale, wolse, listing, appraisal, or forecast ranks.
- Personalization, saved rankings, alerts, accounts, email collection, or
  ambient-area cookies.
- Guide, News, Compare, Budget, Timing, or Glossary routes.
- Canonical, hreflang, sitemap inclusion, redirect changes, or indexing
  activation.
- A generic multi-market ranking engine. The display components may be reusable,
  but this release is explicitly the verified Seoul jeonse dataset.

## 4. Route and navigation contract

The route is `/kr/seoul/rankings/`, following the existing city-qualified V2
grammar rather than the workbook shorthand `/:market/rankings`.

The primary Check / Explore / News / Guide navigation does not gain a fifth
tab. Rankings is an Explore sub-surface:

- the Rankings route renders Explore as the current primary section;
- Explore includes a clear `View district rankings` link; and
- each published or withheld district page may link to Rankings as a
  cross-district comparison action.

No interactive element links to an unbuilt route. News and Guide remain
labelled, non-interactive future states until their own P2 releases.

The page remains `noindex, follow`, emits no canonical or hreflang, and stays
out of the sitemap. These controls can change only in a separate SEO migration
release.

## 5. Evidence and metric definitions

All lists consume the exact district summaries returned by the existing
server-only area-summary repository. A row is eligible for monetary rankings
only when `summary.published === true`, which already proves `n >= 5` and a
complete ordered five-number distribution.

### 5.1 Cheapest

- Metric: `med`.
- Order: ascending.
- Label: `Median refundable jeonse deposit`.
- Meaning: lower filed refundable deposits for the fixed 45–55㎡, zero-monthly-
  rent filter; never “cheapest homes” or “most affordable district.”

### 5.2 Three-month change

- Metric: `chg3m`.
- Eligibility: published summaries with non-null `chg3m` only.
- Order: ascending, so the lowest signed change appears first.
- Label: `Median change: latest 3 months vs prior 3 months`.
- Meaning: a descriptive comparison of two independently sufficient windows,
  not a forecast.

The list includes every eligible signed value, not only negative values. When
no district has a negative value, the page states that no eligible district
fell even though the ordered comparison remains visible. This prevents a
“falling fastest” heading from implying a fall that did not occur.

### 5.3 Widest middle-half spread

- Metric: `p75 - p25`.
- Order: descending.
- Label: `Middle-half spread (P75 − P25)`.
- Meaning: dispersion among the central half of qualifying contracts.

The metric deliberately uses the interquartile range rather than `max - min`.
That is more resistant to an extreme filed contract and matches the visible
P25–P75 evidence used elsewhere. Copy must not call it volatility, risk, price
uncertainty, or negotiation room.

### 5.4 Deepest sample

- Metric: `n`.
- Order: descending.
- Label: `Qualifying reported contracts`.
- Meaning: evidence depth under the fixed filter, not district market size,
  demand, liquidity, or quality.

### 5.5 Ties and precision

Every metric sorts by its primary numeric value and then by Seoul legal code
ascending. Displayed rank is ordinal row position, so deterministic ties remain
stable across server render, hydration, tests, and deployments. The page does
not invent fractional or shared ranks.

Money displays in whole KRW using the existing formatter. Change displays one
decimal place, preserving signed zero as `0.0%`. Counts display as integers.
The model sorts raw numbers, never formatted strings.

## 6. Exclusion and failure behavior

Withheld summaries are omitted from all four rankings rather than placed last.
The page states the number of excluded districts and the rule: money is not
published when fewer than five qualifying contracts are available.

A published summary with `chg3m: null` remains eligible for the other three
lists but is excluded from the change list. The change section states how many
districts were excluded because either three-month window lacked five
qualifying contracts.

If the root artifact, provenance, period, city reconciliation, district order,
or any summary is invalid, the entire page fails closed to the existing
`Verified district summary unavailable` state. It does not show a partial
ranking, reuse city numbers as district values, read the P1 artifact, or fall
back to fixtures.

If the artifact is valid but a list has zero eligible districts, that section
shows an explicit empty state and no numeric rows. Other independently eligible
lists remain visible.

## 7. Server architecture

Add a focused rankings model beside the existing public-area route model. It
depends on the existing repository and district catalog and exports a frozen
union:

- `ready`: source boundary, exclusion counts, and four immutable ranked lists;
  or
- `unavailable`: the sanitized unavailable message and source boundary.

Each ranking row contains only the district identity, detail-page URL, raw
metric, formatted label, ordinal position, and any visualization geometry.
React components do not read environment variables, parse artifacts, calculate
IQR, or sort rows.

The model performs one repository read per server render. It never mutates the
repository array or shared summaries. Derived arrays are newly allocated and
frozen.

## 8. Page and component design

The page opens with one concise explanation of the fixed evidence boundary:
MOLIT reported zero-rent jeonse contracts, 45–55㎡ filed area, the configured
completed period, and the five-contract publication minimum.

Four semantic sections follow. At desktop they form a two-column grid; at
720px and below they become one natural-flow column. Each section renders a
heading, metric definition, eligibility note, and a complete ordered list or
table. Every district name links to its detail page. Numeric columns use
tabular numerals and remain readable without colour or JavaScript.

The three unsigned lists use the shared table language already established by
Explore. The change list uses a dedicated signed-bar primitive:

- zero is fixed at the 50% centre line;
- negative values extend left with a filled treatment;
- positive values extend right with an outline treatment;
- zero renders an exact zero-length mark;
- geometry normalizes against the largest absolute eligible value;
- symmetric axis endpoints are printed; and
- text always includes the signed numeric value, so bar shape is supplemental.

At 390px, values do not rely on horizontal scrolling, the signed axis remains
visible, links have at least 44px targets, and focus uses the existing cobalt
ring. No list is collapsed behind a client-only control.

## 9. Source, rights, and copy

The page reuses the existing public source-boundary component and names:

- MOLIT as provider;
- the exact completed period;
- the 45–55㎡ filed-area band;
- the five-contract minimum;
- the combined new and renewal state;
- unknown contract-type and record-status limitations; and
- the general-reference, non-appraisal limitation.

The ranking footer also states that a rank compares only the displayed fixed
filter and does not rank neighbourhoods, individual homes, legal safety,
condition, transit, schools, or future price movement.

All prose counts, rank positions, extrema, axis labels, and exclusion totals
derive from the same model arrays rendered beside them. No hardcoded number may
sit next to computed rows.

## 10. Testing

Implementation follows test-first development.

### Model tests

- exact cheapest, change, IQR, and sample order from hand-derived fixtures;
- legal-code tie breaking for every list;
- IQR uses `p75 - p25`, not full range;
- withheld districts never enter any list;
- null change excludes only the change list;
- positive-only, negative-only, mixed, all-zero, and empty change inputs;
- source arrays and summaries remain unmodified and all outputs are frozen;
- invalid artifact and period mismatch fail closed with no numeric rows.

### Rendering and accessibility tests

- initial server HTML contains all eligible district names and values;
- four semantic section headings and ordered rank positions;
- visible metric definitions and exclusion reasons;
- links resolve to the 25 existing district routes;
- signed values, centre line, symmetric endpoints, and fill/outline vocabulary;
- no money appears in unavailable or empty states;
- Explore is the current primary tab and no future tab becomes a dead link;
- metadata remains noindex with no canonical or hreflang.

### Browser and release tests

- 1440px, 720px, and 390px Chromium runs with no horizontal overflow;
- keyboard focus reaches every district link in logical order;
- minimum 44px interactive targets;
- no hydration, console, request, build, or runtime error;
- Production-like build reads the verified artifact with no provider call;
- sitemap excludes Rankings; and
- actual Preview values and row counts reconcile with the installed artifact.

## 11. Delivery and rollback

Delivery follows the established P2 gate:

1. focused unit and render tests;
2. full package/web regression, lint, typecheck, build, and whitespace checks;
3. independent code review with all Critical and Important findings resolved;
4. exact-SHA Vercel Preview and browser verification;
5. PR and CI verification;
6. Production promotion under the user's standing P2 authorization; and
7. post-deploy DOM, metadata, artifact reconciliation, log, and runtime checks.

No Production environment variable changes are expected. If the route must be
rolled back, revert the code deployment; Explore, district pages, Rent Check,
and both existing public-summary variables remain untouched.

## 12. Success criteria

The slice is complete only when:

- all four rankings derive from the exact installed P2 artifact;
- every metric, order, exclusion, tie, and label matches this specification;
- no ineligible or unavailable figure is rendered;
- the change visualization encodes sign correctly and is understandable without
  colour;
- all new links resolve and all target/accessibility/responsive contracts pass;
- SEO state remains unchanged;
- Preview and Production evidence show zero observed 5xx; and
- the release report separates local, GitHub, Preview, and Production state.
