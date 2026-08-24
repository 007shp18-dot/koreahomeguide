# KoreaHomeGuide v9 Rent Explorer Design

## Goal
Turn KoreaHomeGuide from a collection of rent tools and SEO pages into a simple housing-data explorer where a foreign user can move from city/area to building-level rental evidence, while keeping the data layer extensible to Tokyo and New York later.

## Product Positioning
KoreaHomeGuide remains a housing-information and decision-support product, not a live-listings marketplace or brokerage service.

North star:
- Simple to use.
- Official data first.
- Built for people new to a city.

Primary user journey:
1. Open `/explore/`.
2. Search or select an area.
3. Select property type.
4. See area-level summary and ranked buildings.
5. Open a building detail view.
6. Inspect recent signed transactions and building-level rent statistics.
7. Use Rent Check for a quote the user received.

## Scope
### In v9
- New `/explore/` page.
- Seoul only in the visible product.
- District selection for the currently supported five districts: Gangnam-gu, Mapo-gu, Yongsan-gu, Seongdong-gu, Yeongdeungpo-gu.
- Apartment, officetel, and villa/multi-family.
- Building-level aggregation from existing MOLIT rental transaction data.
- Area summary metrics: median monthly rent, median deposit, number of comparable signed contracts, recent 3-month change where data supports it.
- Building list with: building name, typical size, median monthly rent, median deposit, contract count.
- Building detail panel/page with: building summary, recent signed transactions, and Rent Check handoff.
- English-first UI with currency display preserving the existing KRW/USD/CNY conversion system.
- Provider abstraction so Seoul data is delivered through a `KoreaHousingProvider` interface rather than accessed directly from the UI.

### Not in v9
- Live listings.
- Brokerage or landlord contact.
- User reviews.
- Accounts, favorites, alerts.
- Tokyo or New York live data.
- Map-first browsing.
- Exact unit-level/dong-ho information.
- Price estimation beyond descriptive statistics from signed transactions.

## Information Architecture

```text
/
/explore/
/tools/seoul-rent-check/
/tools/brokerage-fee-calculator/
/rent/{district}/{property-type}/
/guides/...
/zh/...
```

`/explore/` becomes the primary product exploration surface. Existing SEO rent pages remain indexable landing pages and link into the explorer with the corresponding district and property type preselected.

## UX Design

### Explore landing
Keep the first frame intentionally sparse:

- Eyebrow: `SEOUL RENT EXPLORER`
- Heading: `Understand Seoul rent before you sign.`
- Search/select row:
  - Area
  - Property type
  - `Explore rents`
- Popular area chips.
- Small clarification: `Official signed rental transactions — not live listings.`

No map in the first v9 explorer.

### Area results
Show four metrics only:
- Median monthly rent
- Median deposit
- Signed contracts
- 3-month change

Below, show `Buildings with recent contracts` as a simple sortable-looking list, but without adding sorting controls in v9.

Each building row contains:
- Building name
- Typical size
- Median monthly rent
- Median deposit
- Contract count
- `View building` action

### Building detail
A detail page or route-safe view contains:
- Building name
- District + property type
- Typical monthly rent
- Typical deposit
- Typical size
- Recent contract count
- One simple monthly rent trend chart if at least 3 months of usable observations exist
- Recent signed contracts table
- CTA: `Got quoted a rent here? Check if it's fair`

If the public data does not provide a stable building identifier, the internal key is a normalized composite of district + property type + building name. The visible URL can use a slug generated from the building name, but the app must not claim that this identifier uniquely represents a legal parcel across all data sources.

## Data Architecture

### Provider interface
Create a city-neutral provider contract:

```js
HousingDataProvider = {
  getAreaSummary({ areaCode, propertyType, months }),
  getBuildings({ areaCode, propertyType, months }),
  getBuildingDetail({ areaCode, propertyType, buildingKey, months })
}
```

Implement:

```text
providers/
  korea-provider.cjs
  provider-utils.cjs
```

Future adapters can implement the same contract:
- JapanHousingProvider
- NewYorkHousingProvider

The browser never needs to know MOLIT field names.

### API endpoints
Add:
- `/api/explore-area`
- `/api/explore-building`

`/api/explore-area` returns area metrics plus building aggregates.
`/api/explore-building` returns building metrics, monthly trend points, and recent transactions.

### Aggregation rules
Monthly-rent statistics:
- Exclude rows with monthly rent = 0 from monthly-rent median calculations.
- Median deposit for monthly-rent mode is computed on rows with monthly rent > 0.
- Contract count is the count of usable returned rental contracts for the selected property type and period.
- Typical size is the median floor area of usable rows.

Jeonse-style rows may remain visible in recent transaction data but do not influence monthly-rent median.

Recent change:
- Compare the median monthly rent from the most recent 3 completed months with the preceding 3 completed months.
- Return `null` when either window has fewer than 3 usable monthly-rent contracts.
- UI displays `Not enough data` rather than inventing a percentage.

Building aggregation:
- Group by normalized building name.
- Ignore records without a usable building name from building ranking, but retain them in area-level transaction counts where appropriate.
- No inferred or synthetic building names.

### Freshness
Use completed contract months only. The provider fetches six completed months by default, matching the existing SEO data architecture. Server caching can reuse the existing public-data cache pattern.

## Currency
All source data and calculations remain KRW.
Existing currency preference may display approximate USD/CNY conversions.
Converted values are presentation-only and must not alter building grouping, medians, change calculations, or Rent Check logic.

## SEO
`/explore/` has its own canonical URL and descriptive metadata.
Existing `/rent/...` pages remain the main programmatic SEO landing pages.
The explorer is a product surface, not a generator of thousands of parameter URLs.
Do not index arbitrary query-string combinations.
Building detail pages are not added to sitemap in v9 unless their URL is static and stable. v9 prioritizes product validation over large-scale building-page indexing.

## Legal / Trust Guardrails
Every explorer surface must clearly say the data represents historical signed rental transactions and is not a live-listings search.
Do not use `Available`, `For rent`, `Book viewing`, `Contact landlord`, or similar listing language.
Do not recommend a particular transaction or claim a price is an appraisal.
Keep the Rent Check disclaimer that it is a market reference based on official MOLIT data, not legal or appraisal advice.

## Error Handling
- If MOLIT is unavailable: keep the page shell usable and show `Official transaction data is temporarily unavailable.`
- If area data is sparse: show available transaction count and `Not enough data` for unsupported statistics.
- If a building disappears from the selected period: show a clear empty-state instead of falling back to a different building.
- Currency API failure must never block KRW data.

## Testing
TDD coverage must include:
- provider contract shape;
- building-name normalization/grouping;
- medians and typical area;
- monthly-rent zero exclusion;
- 3-month change calculation and insufficient-data behavior;
- explorer API validation;
- building detail selection;
- live-listing wording regression guard;
- existing Rent Check, calculator, FX, Chinese pages, guides, and SEO routes remain green.

## Rollout
v9 is successful if:
1. A user can select Gangnam-gu + Officetel and see real building-level aggregates.
2. Clicking a building shows recent signed transactions for that same building.
3. The page remains visually simple enough that the primary action is obvious without explanation.
4. Existing v8.1 features are unchanged unless explicitly linked into the explorer.
5. The provider layer is city-neutral even though only Seoul is implemented.
