# Explorer Building Status Window

Date: 2026-08-29  
Status: proposed for implementation  
Reference: `Korea Home Guide UI Mockups.zip`, Explorer three-panel status window

## Goal

When a renter selects a building in Rent Explorer, open one decision-focused status window without leaving the map. The window must answer three questions in order:

1. What did people recently sign in this building?
2. How does that price compare with relevant nearby contracts?
3. Which recent contracts and next actions should the renter inspect?

The supplied high-fidelity mockup is the visual baseline. Implementation must use the existing KoreaHomeGuide tokens and real data contracts rather than copying the prototype's placeholder values.

## Scope

This phase changes only the Explorer building interaction in English and Chinese.

Included:

- Building-row and verified building-marker clicks open the same window.
- Three body panels: signed snapshot, market position, and recent contracts.
- NAVER street view remains part of the building experience.
- Official address and optional building-register facts are shown when confidently matched.
- Save, Rent Check, and full-detail actions remain available.
- Desktop and mobile layouts, keyboard behavior, loading, empty, limited-evidence, and partial-failure states.

Not included:

- The mockup's wider home, guide, and Rent Check visual refresh.
- NAVER Real Estate scraping or undocumented endpoints.
- Owner, landlord, listing, availability, or live asking-price information.
- Inferred construction year, unit count, address, or market score when source matching is ambiguous.

## Why NAVER Real Estate Is Not the Runtime Source

NAVER Real Estate does not provide a documented public building-metadata API for this use case. Scraping its pages would create fragile selectors, unclear reuse rights, rate-limit risk, and silent mismatches between marketing names and official building registers.

Use NAVER Maps only through its documented Maps APIs for geocoding, verified coordinates, address presentation, and panorama. Use the Ministry of Land, Infrastructure and Transport Building HUB building-register Open API for building facts.

Official references:

- Building HUB Open API overview: https://www.hub.go.kr/portal/psg/idx-intro-openApi.do
- Building HUB building-register dataset: https://www.data.go.kr/data/15134735/openapi.do
- NAVER Maps geocoding: https://navermaps.github.io/maps.js.ncp/docs/tutorial-Geocoder-Geocoding.html

## User Experience

### Entry points

- Click, Enter, or Space on a building row.
- Click a verified building marker.
- Links inside a building row continue normal navigation and do not open the window.
- Neighborhood markers keep the existing neighborhood-selection behavior.

### Window frame

The window appears over the Explorer with the map still visible behind a restrained backdrop. It uses the mockup's maximum width of approximately 1000px and a maximum height that fits the viewport.

The header contains:

- localized display building name and official Korean name;
- district, dong, and registered housing category;
- official road address, falling back to official jibun address;
- contract-count and data-through labels;
- verified building-register facts when available: use-approval year, household/unit count, and above-ground floors;
- a compact NAVER street-view preview with capture date, or a neutral unavailable state;
- close button.

The header must never print empty separators or placeholder metadata. Each optional fact is independently omitted when unavailable.

### Three body panels

#### 1. What people signed

- Median monthly rent within the building's representative deposit context.
- Median deposit from the same contracts used for the displayed rent.
- Typical floor area.
- Reported contract count.
- Evidence label.

Deposit and monthly rent must always come from the same comparable group. Do not show a synthetic pair made from unrelated medians. Do not show rent per square metre as a headline metric because it can hide deposit and area-composition differences.

#### 2. Against the market

- Position versus the selected dong.
- Position versus the selected district.
- Six completed months of the building's rent trend.
- Plain-language interpretation, such as `Lower than 62% of comparable recent contracts`.

The mockup's hard-coded gauge fill is replaced by a real percentile position. The marker and label must be derived from the same comparison set.

If evidence is insufficient, show `Limited evidence` and the reason instead of a gauge. A one-contract median or percentile is never rendered.

#### 3. Recent contracts and actions

- Up to five most recent contracts.
- Contract date, floor when reported, area, deposit, and monthly rent.
- `Save building`.
- `Check my quote against this` with district, housing type, and typical area prefilled; no price is invented.
- `Open full details` preserving district, dong, type, and building key.

## Responsive Behavior

Desktop at 861px and wider:

- Header spans the full window.
- Body uses approximately `30% / 40% / 30%` columns.
- One-pixel rules separate panels.

Mobile at 860px and narrower:

- Header compacts building identity and street view.
- Body becomes three accessible tabs: `Overview`, `Market`, and `Contracts`.
- Tabs use native buttons with `aria-selected`, arrow-key navigation, and a 44px minimum target.
- The main modal scrolls; the page behind it remains locked.

At all widths:

- Escape, close button, or backdrop click closes the window.
- Focus moves into the window on open and returns to the originating row or marker on close.
- Reduced-motion users receive no rise/fade animation.

## Data Architecture

### Existing transaction detail

Extend the existing `/api/explore-building` response rather than creating another Vercel function. The endpoint already returns the building summary, contextual deposit bands, six-month trend, and recent transactions.

The browser sends only stable identifiers:

- `lawdCd`
- `type`
- `dong`
- `buildingKey`

Rows do not embed the complete detail response in `data-building`. The window fetches the current detail on demand, shows a skeleton, caches the result in memory for the current Explorer session, and reuses it on reopen.

### Address resolution

Use this priority:

1. a single consistent road address from official transaction rows;
2. a single consistent jibun from official transaction rows;
3. the verified NAVER geocoding result already used for the building marker;
4. no displayed address.

Never use a building-name-only geocode as an official address unless the returned district, dong, and building identity all match. Show the source label `Official transaction address` or `NAVER geocoded address` in accessible supporting text.

### Building-register profile

The server-side provider queries the Building HUB building-register title/summary data using official location identifiers derived from the transaction row:

- sigungu code;
- legal-dong code;
- land/parcel type;
- main and sub parcel numbers.

The rental XML parser should preserve official region-code fields when the source response supplies them. If a code is absent, the client may obtain a legal-dong code from NAVER reverse geocoding and request a second validated enrichment through the existing building endpoint. Any supplied legal code must share the requested Seoul district prefix.

Candidate selection requires:

- exact parcel match;
- compatible official building name when a name exists;
- compatible main-use category;
- one unambiguous main building or aggregate title.

The optional profile may expose:

- official building name;
- use-approval date/year;
- household count or family count, labelled according to the returned field;
- above-ground and underground floor counts;
- official road and parcel address;
- building-register management key for internal caching only.

If more than one candidate remains or the returned name/use is incompatible, return `profileStatus: "ambiguous"` and show no profile facts. Never choose the first result silently.

Building-register data changes slowly. Cache successful and confirmed-empty lookups for 30 days with stale-while-revalidate. Do not cache upstream failures as empty data.

The existing `DATA_GO_KR_SERVICE_KEY` can be reused only after the account has requested access to the Building HUB building-register API. The application must degrade cleanly until access is enabled.

### Market position

Market position uses KHG's official signed-rental transactions, not portal asking prices.

For the selected building:

1. Choose recent monthly-rent transactions from the latest six completed months.
2. Establish the building's representative area and deposit context.
3. Build dong and district comparison sets with the same property type.
4. Restrict comparables to an area band around the representative area.
5. Normalize each comparable monthly rent to the building's representative deposit using the existing Rent Check deposit-adjustment method.
6. Calculate the building representative rent's empirical percentile within each set.

Evidence thresholds:

- Dong gauge: at least 8 valid comparable contracts from at least 3 named buildings.
- District gauge: at least 20 valid comparable contracts from at least 5 named buildings.
- Building snapshot: at least 3 valid monthly-rent contracts for a median and trend interpretation.

The response includes counts, percentile, comparison deposit, area range, and a localized-ready reason code. The UI displays `directional` when the minimum is met but the evidence is still thin; it never uses a safety score or appraisal language.

Seoul-wide comparison is deferred. It would add 15-district aggregation cost and is less useful than a properly matched dong and district comparison.

## Modules and Responsibilities

### `building-window.js`

- Owns open/close state, focus management, tabs, loading, and rendering.
- Accepts stable identifiers and fetches `/api/explore-building`.
- Uses existing money, date, property-label, and building-name utilities.
- Does not calculate market statistics or trust embedded HTML JSON.

### `providers/building-profile-provider.cjs`

- Calls Building HUB.
- Parses XML/JSON defensively.
- Matches title/summary records conservatively.
- Returns typed optional profile data and a status code.

### `providers/provider-utils.cjs`

- Builds building snapshot, recent-contract view model, and market-position comparison sets.
- Reuses the existing median, deposit-band, and deposit-adjustment logic.

### `api/explore-building.js`

- Validates stable identifiers and optional legal code.
- Orchestrates transaction detail and optional building profile.
- Returns partial success when profile enrichment fails.
- Preserves existing cache and origin guards.

### Explorer runtimes

- Render rows as accessible window triggers.
- Open the same window from verified building markers.
- Preserve canonical full-detail links.
- Keep English and Chinese behavior structurally identical.

## Response Shape

The existing detail fields remain compatible. New fields are additive:

```json
{
  "profile": {
    "status": "matched",
    "officialAddress": "서울특별시 마포구 연남동 227-1",
    "roadAddress": "서울특별시 마포구 동교로 227",
    "useApprovalYear": 2019,
    "householdCount": 84,
    "householdLabel": "households",
    "groundFloors": 12,
    "undergroundFloors": 2,
    "source": "MOLIT Building HUB"
  },
  "marketPosition": {
    "buildingRepresentative": {
      "depositWon": 10000000,
      "monthlyRentWon": 1150000,
      "areaSqm": 33.6,
      "contractCount": 9
    },
    "dong": {
      "status": "sufficient",
      "percentile": 0.62,
      "comparableCount": 42,
      "buildingCount": 11
    },
    "district": {
      "status": "sufficient",
      "percentile": 0.55,
      "comparableCount": 218,
      "buildingCount": 37
    }
  }
}
```

Missing or ambiguous enrichment is represented by status fields, not fabricated zeroes.

## Failure States

- Transaction detail failure: retain the compact row summary, show retry and full-detail link.
- Building HUB unavailable: show transaction panels normally and omit registry facts.
- Ambiguous register match: show `Building registry details could not be matched confidently.`
- NAVER panorama unavailable: show address/map context without an empty black canvas.
- Market evidence insufficient: show counts and `Limited evidence`; omit gauge and comparison claim.
- Currency conversion unavailable: keep KRW values primary.

## Analytics

Add bounded, non-identifying events:

- `explorer_building_window_open`
- `explorer_building_profile_status`
- `explorer_building_streetview_status`
- `explorer_building_save`
- `explorer_building_rent_check_click`
- `explorer_building_full_detail_click`

Parameters are limited to district code, property type, evidence bucket, profile status, and trigger type (`row` or `marker`). Do not send building name, exact address, coordinates, quote amounts, or saved-home text.

## Testing

### Unit

- Building HUB response parsing and number/date normalization.
- Exact, ambiguous, and incompatible profile matching.
- Market percentile uses area-matched, deposit-adjusted comparables.
- Threshold and limited-evidence behavior.
- No synthetic rent/deposit pair and no one-contract median.
- HTML escaping and localized labels.

### API

- Existing response compatibility.
- Profile success, empty, ambiguous, and upstream failure all return safe partial responses.
- Cache writes only valid matched/empty results.
- Optional legal code must match district.
- Origin and method guards remain unchanged.

### UI

- Row and marker open the same building.
- Inner links do not open the window.
- Focus trapping/return, Escape, backdrop, close, and reduced-motion behavior.
- Desktop three-column and mobile tab layouts.
- Street-view success and empty states.
- Add/save/Rent Check/full-detail actions preserve the selected context.
- English and Chinese copy and mobile overflow.

### Production verification

- Verify at least one apartment and one officetel with exact register matches.
- Verify one villa/detached ambiguous or missing-profile fallback.
- Confirm a real NAVER panorama and capture date.
- Compare displayed use-approval year, unit/household count, and address against the official Building HUB result.
- Confirm dong/district percentile counts and manually reproduce one sample calculation.

## Rollout

1. Ship behind a local code flag disabled by default.
2. Enable for the Explorer building rows after production verification.
3. Enable building-marker entry after row flow is stable.
4. Measure window opens, downstream Rent Check clicks, saves, profile coverage, panorama coverage, and errors for one week.
5. Decide whether to extend the broader mockup system to home, Rent Check, guides, and dong pages based on observed use.

Success means the window opens reliably, presents no inferred building facts, has useful profile coverage, preserves Explorer performance, and increases building-to-Rent-Check or building-save actions without increasing confusion or API failures.
