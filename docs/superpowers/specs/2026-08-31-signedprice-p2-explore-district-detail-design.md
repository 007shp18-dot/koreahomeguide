# signedprice P2 Explore and District Detail Design

**Date:** 2026-08-31

**Status:** Approved design; implementation plan written

**Roadmap slice:** P2 subproject 1 of 3

## 1. Decision

Build the first public-data Explore surface from one verified, precomputed Seoul
artifact containing the existing city summary and one summary for each of the
25 Seoul districts. Render a server-first SVG choropleth at
`/kr/seoul/explore/` and generate one district detail page at
`/kr/seoul/{district-slug}/`.

The existing KoreaHomeGuide district GeoJSON is the geometry authority. The
official MOLIT rental source remains the numeric authority. No listing,
asking-price, agent estimate, client-side percentile computation, or mock
district figure may enter the public result.

This slice extends P1 without changing its published meaning: refundable
jeonse deposit, contracts with zero monthly rent, filed area 45–55㎡, the last
seven completed months, and no published money when `n < 5`.

## 2. Why this approach

### Selected: versioned district artifact plus server-rendered SVG

- Reuses the complete 700-coordinate MOLIT collection already required by P1.
- Computes every district with the same parser, rights policy, period, filters,
  rounding, and three-month-change method as the Seoul total.
- Produces useful initial HTML for users, crawlers, no-JavaScript clients, and
  automated release checks.
- Keeps geometry stable and accessible without a map SDK, browser key, or live
  provider request.
- Makes the map, fallback table, district pages, rankings, and later News data
  briefs consume one immutable source of truth.

### Rejected: call Rent Check once per district at page load

Twenty-five live source-backed requests are slower, costlier, failure-prone,
and violate the workbook requirement to precompute crawl surfaces.

### Rejected: reuse legacy or design-fixture figures

Legacy geometry and route labels are reusable, but stale figures and UI
fixtures cannot be represented as current official evidence.

## 3. Scope

### Included

- An immutable P2 area-summary artifact with Seoul plus all 25 districts.
- Exact district identity mapping: legal code, route slug, English name, and
  Korean name.
- A server-rendered five-step cobalt choropleth with a non-colour-only state
  vocabulary.
- A complete 25-row HTML district table adjacent to the map.
- Generated district pages with the finding, sample size, five-number range,
  three-month change when publishable, inline quote check, computed FAQ,
  nearby-district links, source, period, rights attribution, and limitations.
- Explicit refusal states for thin samples, missing artifacts, rights blocks,
  and unsupported deal types.
- Protected Preview deployment, browser review, and exact-SHA evidence.

### Excluded

- Neighbourhood and building publication. The current provider record does not
  preserve a release-reviewed neighbourhood identity in the public artifact;
  no approximate grouping or dead internal link will be introduced.
- Live listings, brokerage, appraisal, legal conclusions, or landlord grading.
- Sale and wolse figures. Those states name jeonse as the only loaded deal and
  expose no copied numbers.
- News, Guide, Compare, Budget, Rankings, saved checks, alerts, authentication,
  email collection, Production promotion, DNS, redirects, canonical, hreflang,
  or indexing activation.
- The P3 two-detent mobile map sheet. P2 must still be fully usable with natural
  mobile scrolling, a visible compressed legend, visible focus, and 44px
  targets.

## 4. Route contract

The approved platform roadmap uses city-qualified routes, so this slice keeps
the existing V2 grammar rather than adopting the workbook shorthand
`/:market/explore`.

| Route | Rendering | Initial HTML contract |
| --- | --- | --- |
| `/kr/seoul/explore/` | Server page plus client selection enhancement | All 25 district names, states, sample counts, period, source, and every publishable median |
| `/kr/seoul/{district-slug}/` | Static generation from the verified artifact | District finding, `n`, five-number range or refusal, quote component, FAQ, and nearby links |

Static segments such as `explore`, `tools`, `rent`, `buy`, and `invest` take
precedence over the district segment. Unknown slugs return the custom 404.

Every new route remains `noindex, follow` in Preview, emits no canonical or
hreflang, and stays out of the public sitemap until a separate migration and
indexing authorization.

## 5. Data artifact

### 5.1 Identity and version

Use a new branch-scoped Preview variable:

`SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT`

The parser reuses `SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD` as the independently
configured expected period. A mismatch between the two artifacts fails closed.

The artifact version is `signedprice-public-area-summary-v1`. It does not
replace `SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT` during collection or rollback;
P1 continues reading its proven city artifact until the P2 consumer passes.

The root contains only:

- `artifactVersion`;
- `generatedAt` as a canonical UTC instant;
- exact provenance;
- one city summary; and
- exactly 25 district summaries in legal-code order.

Provenance contains the market, period, provider, endpoint version, parser
version, rights-policy ID, and `sourceComplete: true`. No source URL, service
key, raw XML, source record, building label, cache value, or provider error body
is included.

### 5.2 Summary identity

Each district summary uses:

- `marketId: "kr-seoul"`;
- `area`: the canonical district slug from the district catalog;
- `parent: "seoul"`;
- `deal: "jeonse"`;
- `band: "45-55sqm"`;
- the exact city period; and
- `n` plus `published`.

A published row carries `min`, `p25`, `med`, `p75`, `max`, and nullable
`chg3m`. A withheld row carries none of those keys. The parser rejects extra
keys, duplicate identities, missing districts, wrong order, wrong period,
wrong parent, impossible five-number ordering, invalid change values, and a
city `n` that does not equal the sum of district `n` values.

### 5.3 Derivation

While finalizing the existing 700-coordinate job, retain each source month
under its coordinate's `lawdCd`. Build:

1. the Seoul summary from all records; and
2. one district summary from the records collected for that district.

Both call the existing `buildKoreaPublicMarketSummary` function. No district
formula is copied into the web app.

The P1 inclusion rules remain exact:

- contract status is not cancelled;
- refundable deposit is positive;
- monthly rent is zero;
- filed area is between 45 and 55㎡ inclusive;
- contract month is one of seven contiguous completed months; and
- `chg3m` compares the latest three months with the preceding three and is null
  unless both windows independently have at least five eligible contracts.

### 5.4 Collection and rollback

If the existing source-month cache is still complete, P2 finalization reads it
without a provider call. If any coordinate is absent, the protected,
branch-scoped Preview generator resumes only the missing coordinates. The
generator is removed before the final release candidate, and an absence test
prevents its route or handler from remaining in the bundle.

The old P1 artifact remains installed until the P2 artifact passes canonical
JSON, digest, semantic, source-period, rights, no-sensitive-marker, and served
page verification. Rollback is therefore an environment-variable removal plus
deployment rollback, not data reconstruction.

## 6. Server architecture

### 6.1 District catalog

Extend the Korea district catalog with a canonical route slug and validate it
against all 25 GeoJSON features. The catalog owns public identity; geometry
must not invent or rename districts.

### 6.2 Repository boundary

Create a server-only area-summary repository that parses the environment
artifact once and exposes:

- `getCitySummary()`;
- `listDistrictSummaries()`; and
- `getDistrictSummary(slug)`.

The repository returns the shared `PublicMarketSummary` union, so every
consumer must handle published and withheld shapes. Invalid or unavailable
artifacts fail closed with a single sanitized unavailable error.

### 6.3 Route models

Pure route-model builders combine a district summary, catalog identity,
neighbouring districts, market config, and copy. Neighbours come from a
versioned district-adjacency table derived from the checked-in GeoJSON; no
runtime geometry calculation changes internal links. React components consume
only these models and never read environment variables or raw artifacts.

Metadata, visible copy, structured data, chart values, sample counts, and
pluralization derive from the same route model. No prose number is hand-written
beside a computed value.

## 7. Explore experience

### 7.1 Desktop

The primary workspace uses a wide SVG map and a 380px district rail. The map
shows all 25 districts on first response. Each district path and each rail row
select the same item; the row is the keyboard-equivalent control for SVG paths.

The rail exposes district name, median or `Not published`, three-month change
when available, and `n`. Selecting a district updates the explanation and link
without fetching new evidence. Opening the detail page is an explicit action.

### 7.2 Map encoding

Published districts are sorted by median and then legal code; rank is assigned
to `min(4, floor(rank * 5 / publishedCount))`. Those five deterministic rank
buckets select the cobalt steps, and the legend prints the actual minimum and
maximum median in every non-empty bucket. Every path also has a text label or a
keyboard-equivalent row. Selected state adds a 3px outline and explicit
`Selected` text. Thin samples use hatching and `Not published`; missing artifact
uses a hairline unavailable frame. Colour is never the only state carrier.

The legend states its numeric endpoints and that the fill represents the
district median refundable jeonse deposit for 45–55㎡ homes. It never implies
monthly rent, listing price, or appraisal.

### 7.3 No-JavaScript and failure behavior

The 25-row server table is always present. JavaScript enhances synchronized
selection only. If geometry, hydration, or client code fails, district links,
figures, counts, source, period, and refusals remain usable.

An invalid artifact does not fall back to P1 Seoul numbers for every district.
The page returns the explicit verified-summary-unavailable state and no district
money.

### 7.4 Mobile

At 390px the map, 88px compressed legend, and district table follow natural
document flow. Interactive targets are at least 44px, the selected district is
announced, focus uses the 2px cobalt ring with 2px offset, and no horizontal
overflow is allowed. P2 does not hide the legend or source disclosure.

## 8. District detail experience

The page heading states the finding with its sample size. A published page
shows the same BoxPlot, QuoteInput, VerdictLine, and SampleChip primitives as
P1, with the fixed Korea axis. Typing a quote recalculates locally and makes no
request.

A withheld page shows the real count, hatching, `Not published`, and an action
to compare nearby districts or return to Explore. It renders no median,
percentile, range, marker, or money-bearing structured data.

Computed FAQ answers cover:

- the district median and sample size when published;
- whether a typed quote is above or below the median without calling it fair or
  unfair;
- what the middle half means;
- why thin data is refused; and
- source period and limitations.

The page emits `FAQPage` and `Dataset` JSON-LD only from the same safe route
model. Withheld pages omit monetary fields from JSON-LD and remain noindex.

## 9. Shared navigation and ambient state

The four workbook tabs are introduced only on these signedprice public
surfaces: Check, Explore, News, and Guide. Unbuilt News and Guide tabs are
non-interactive labelled future states until their P2 subprojects land; they do
not link to 404 pages.

Ambient-area cookie state is deferred to the News subproject. This slice stores
no cookie and puts no personal context into a shared URL.

## 10. Accessibility and copy

- Every state remains understandable in greyscale.
- Focus is visible on every control.
- SVG districts are not the sole interaction mechanism.
- Screen-reader copy names the district, metric, value or refusal, and sample.
- Counts use correct singular and plural forms.
- English is plain and specific; Korean names appear as local identity, not as
  untranslated interface copy.
- The footer names MOLIT, the seven-month period, the rights attribution, the
  45–55㎡ filed-area band, new/renewal mixing, unknown source status, and the
  general-reference limitation.
- Reading never asks for an email.

## 11. Testing

### Package and artifact tests

- The finalization produces exactly 26 unique summaries in canonical order.
- District `n` values sum to the city `n`.
- Each district uses only records from its legal code.
- A district with `n = 4` contains no monetary or change keys.
- Three-month change independently enforces five records in each window.
- Parser rejects malformed provenance, extra keys, missing districts, duplicate
  slugs, order drift, impossible tuples, and sensitive markers.

### Web tests

- Initial Explore HTML contains all 25 names, all counts, period, source, and
  every allowed median.
- No withheld value appears in HTML, React payload, metadata, or JSON-LD.
- All 25 district paths resolve; unknown paths 404.
- Sale and wolse states name jeonse as loaded and expose no jeonse value under
  another heading.
- Map steps, hatching, outlines, labels, and table order share one model.
- Quote changes produce zero network calls and clamp to the fixed axis.
- New routes remain noindex with no canonical or hreflang and no sitemap entry.
- Client asset scans find no service key, endpoint URL, raw record, artifact
  text, server module, or temporary runner marker.

### Browser gates

Verify protected Preview at 1440×900, 1366×768, and 390×844:

- all 25 districts are visible or reachable immediately;
- keyboard and pointer selection agree;
- legend remains visible and meaningful;
- a published and, if present, withheld district render correctly;
- detail-to-Explore navigation preserves explicit selection;
- focus, 44px targets, greyscale states, and overflow pass;
- no observed console error or 5xx occurs; and
- deployment SHA, branch-scoped artifact digest, and Vercel protection are
  recorded while Production remains unchanged.

## 12. Release gate

P2 Explore is complete only when:

1. P1 unit, workbook, build, browser, client-boundary, and Phase 0 gates remain
   green;
2. the area artifact passes all source, rights, shape, arithmetic, privacy, and
   digest checks;
3. the temporary generator is absent from the final source and client/server
   route tables;
4. every new page is server-rendered and protected by noindex plus Vercel
   Authentication;
5. an independent review has no Critical or Important finding; and
6. no Production deployment, domain, redirect, sitemap, canonical, hreflang,
   or indexing change has occurred.

After this gate, P2 continues with Guide and evidence-backed News/content as a
separate approved specification. Compare, Budget, and Rankings remain the third
P2 specification.
