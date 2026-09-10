# SignedPrice Entry, Distribution Graph, and Building Explorer Design

**Status:** Approved continuation of the 2026-08-31 SignedPrice release direction

**Date:** 2026-09-01

## 1. Outcome

The product already publishes Seoul district evidence, New/Renewal splits, Rankings, verified News, and an honest structured Community state. This release makes those capabilities visible from the routes users actually enter and completes the missing KoreaHomeGuide-style building journey.

The release has three outcomes:

1. `/`, `/kr/`, and `/kr/seoul/` visibly route users into Check, Explore, Rankings, News, and Guide without dead or overstated product states.
2. The five-number distribution is readable at desktop and mobile widths without five cramped table cells.
3. Seoul Explore supports district -> neighborhood -> verified building selection, with actual building markers and a click-open evidence panel backed only by a verified building artifact.

## 2. Entry surfaces

The global home keeps its international platform framing but adds a prominent `Seoul live` module populated from the installed public area artifact. It exposes the current period, official reported-contract count, New/Renewal/unknown counts, and direct links to Check, Explore, Rankings, News, and Guide. When the artifact is unavailable, the module keeps the routes but publishes no counts or money.

`/kr/` becomes the Korea market hub. Contract Check remains the primary action, followed by the same five evidence destinations and a concise Seoul evidence snapshot. It must not collapse to an environment-paused calculator shell.

`/kr/seoul/` remains the canonical Seoul overview and shares the same route model as the home/hub snapshot. Old `Full product` and generic `Available` claims are replaced by factual states such as `Official district evidence live`, `Community collection not open`, or `Building evidence not loaded`.

Primary navigation is Check, Explore, News, and Guide. Rankings remains a secondary evidence destination linked from Explore and the Seoul live module.

## 3. Distribution graph

The graph retains one semantic `<figure>` and an accessible description. It removes the five-column value table.

- Minimum and maximum anchor the lower left and lower right ends of the axis.
- P25, Median, and P75 use HTML annotations attached to their actual positions and alternate vertical lanes to avoid collisions.
- Median uses cobalt. A user quote marker also uses cobalt but has a distinct diamond and `Your quote` label.
- The sample count and methodology sentence sit below the plot as a separate evidence row.
- At narrow widths the visual label set prioritizes P25, Median, and P75. Minimum and maximum remain in the accessible description and compact end labels.
- Values remain HTML text, not SVG text. Published, withheld, and unavailable branches retain the existing privacy rules.

The graph receives an optional stable axis. New and Renewal selections may share the All range for comparison, but every label and count comes from the selected contract group.

## 4. Building artifact v2

The current building v1 schema is a refusal boundary and test fixture only; Production has no installed real building artifact. Version 2 extends the record rather than substituting legacy KoreaHomeGuide fixtures.

```ts
type PublicBuildingRecordV2 = Readonly<{
  buildingId: string;
  districtSlug: SeoulDistrictSlug;
  neighborhoodId: string;
  neighborhoodName: string;
  name: string;
  latitude: number;
  longitude: number;
  housingType: 'apartment' | 'officetel' | 'villa_multifamily';
  period: string;
  generatedAt: string;
  publicationMinimum: number;
  groups: Readonly<{
    all: PublicBuildingDistribution;
    new: PublicBuildingDistribution;
    renewal: PublicBuildingDistribution;
  }>;
  unknownContractCount: number;
  areaBands: readonly PublicBuildingAreaBand[];
  recentContracts: readonly PublicBuildingRecentContract[];
}>;
```

The artifact is generated from the same complete MOLIT source-month cohort and period as the installed area artifact. Building identity is the normalized legal dong plus normalized official building name. Coordinates come from a deterministic server-side geocoding stage, are validated to Seoul bounds, and are never invented. Records without a verified coordinate remain valid for district lists but do not produce map markers.

`all.n === new.n + renewal.n + unknownContractCount` for every building. Each group independently applies the five-contract publication minimum. Recent contracts remain privacy-safe month/area/deposit/rent rows and do not expose source IDs or exact dates.

The temporary protected Preview generator may be reintroduced only to read the existing server-only data key and isolated verified cache. It is removed before the final release candidate. The final application reads only the versioned artifact.

## 5. Explorer interaction

Explore uses three stable levels:

1. District: the Seoul choropleth and complete 25-district table.
2. Neighborhood: a selected district reveals neighborhoods that contain verified building evidence.
3. Building: selecting a neighborhood shows up to ten building markers/list rows; `Load 10 more` extends the same deterministic order.

A building marker or list row opens an inline evidence panel rather than immediately navigating. The panel contains building name, neighborhood, selected All/New/Renewal distribution, sample, recent contracts, verified News, Community signal state, Street View when its verified coordinate is supported, and an explicit full-detail link. It never shows invented construction year, household count, floor, orientation, or listing data.

URL state uses validated `district`, `neighborhood`, `building`, and `contract` query values. Refresh and back/forward restore the same state. Map clicks update selection; only explicit `Open full evidence` navigates to the building route.

Desktop remains map-led with a bounded evidence rail. Mobile uses map -> current selection -> list in one semantic order. The map never auto-resets while the user is inspecting a building, and map interactions must not cause page scroll jumps.

## 6. Release and preservation

All new values fail closed. KoreaHomeGuide remains unchanged and no redirect cohort is activated in this release. The official SignedPrice logo remains a separate asset gate if the original archive is unavailable.

Release requires unit, type, lint, production build, client-boundary scans, browser checks at 390/720/1366/1440, exact-SHA Preview verification with real environment artifacts, then explicit Production promotion. Preview readiness alone is not reported as a Production update.

