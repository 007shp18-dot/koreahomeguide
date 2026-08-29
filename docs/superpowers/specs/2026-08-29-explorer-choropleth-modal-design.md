# Explorer Choropleth and Building Modal Design

## Goal

Replace the current document-length Explorer with one stable map workspace based on the uploaded `Korea Home Guide UI Mockups.zip`, while preserving KoreaHomeGuide's current official-data definitions, three-step discovery flow, localized pages, SEO surfaces, and verified NAVER nearby street view.

The finished journey is:

1. See all 25 Seoul districts on the map.
2. Choose a district.
3. Choose a neighborhood within that district.
4. Choose a building within that neighborhood.
5. Review the building in a centered, easily dismissed modal.

## Current Defects to Remove

- Selecting a neighborhood can call `normalizedBounds(null)` and throw `Cannot read properties of null (reading 'north')` before building markers render.
- The final document-flow CSS override lets the discovery rail grow to several thousand pixels while the map remains viewport-sized. This creates a large blank region, mismatched columns, and scroll jumps.
- Building detail opens below the map as a long inline section. Users can miss where it opened, and the sticky action row can cover detail content.
- Price cards show values without making the comparison operands and deposit adjustment formula sufficiently explicit.
- The Rent Check size assistance occupies a large empty panel and breaks the primary field rhythm.

## Product Structure

### One Map Workspace

Explorer owns the viewport below the site header and a compact filter/control row. The map and discovery panel share one fixed responsive height:

- Desktop: `calc(100dvh - header/filter allowance)`, with a practical minimum height.
- Mobile: the available dynamic viewport below the header and compact controls.
- The page itself does not grow when districts, neighborhoods, or buildings are rendered.

The existing site header, footer markup, and crawlable neighborhood directory remain outside the interactive workspace. The directory is visually compact and remains available to search engines and no-map users without competing with the primary interaction.

### Map Layers

The map uses the existing Google Maps configuration endpoint and production key restrictions. A simplified Seoul GeoJSON supplies the 25 district polygons. The map API supplies only the basemap and interaction layer; all displayed rental numbers come from official signed-contract aggregation.

Layer progression:

- City layer: 25 district polygons, price labels, metric legend.
- District selection: the panel lists neighborhoods in that district; the selected polygon remains emphasized.
- Neighborhood selection: the map shows verified building markers and the panel lists buildings.
- Building selection: the map stays in place while a centered modal opens above it.

Changing the housing type or metric invalidates stale requests, clears lower-level selection, refetches the relevant aggregates, and redraws the same layer without navigating away.

## Controls and Metrics

The uploaded mockup's floating segmented controls are retained:

- Housing: Officetel, Apartment, Villa.
- Metric: Adjusted per ㎡, Monthly rent, Deposit.

The current official-data semantics override outdated draft calculations:

- `Adjusted monthly cost = monthly rent + deposit × 5% ÷ 12`
- `Deposit-adjusted ₩/㎡ = adjusted monthly cost ÷ floor area`

The server computes displayed medians from contract-level adjusted values. The client does not divide a monthly-rent median by an area median.

Every metric surface shows:

- value and unit;
- period (`latest 6 completed months`, or the actual returned period);
- evidence count;
- comparison labels, for example `This building` and `Neighborhood median`;
- a short formula disclosure for adjusted per-㎡ values.

Sparse evidence remains hidden under the existing reliability thresholds. No zero or inferred value substitutes for unavailable evidence.

## Discovery Panel

### Desktop

A 360–380px panel floats over the left side of the full map. It has the same top and bottom bounds as the map workspace and contains its own scroll region. Only the panel body scrolls.

Panel states:

- Districts: Seoul overview and a compact district list synchronized with polygons.
- Neighborhoods: selected district summary and neighborhood rows.
- Buildings: selected neighborhood summary, sorting, ten building rows initially, and ten-more pagination.

Back navigation changes one level at a time. It never restores a stale asynchronous response.

### Mobile

The same panel becomes a bottom sheet. It has a collapsed preview and an expanded state, uses a maximum percentage of the dynamic viewport, and keeps map attribution and map controls unobstructed.

## Building Modal

Building detail is no longer rendered inline or as a right-side drawer.

- Centered above the map and page.
- Maximum width around 1,080px and maximum height around 88dvh.
- A bounded internal scroll container holds the detail content.
- The header and large circular close button remain visible.
- Escape, close button, and backdrop click close it.
- Focus moves into the modal on open and returns to the triggering building row on close.
- Background document scrolling is locked only while the modal is open.
- Reduced-motion preferences disable entry animation.

The existing `explore/building-window.js` remains the single building-detail controller. Its mount and presentation change; its official-data fetch, saving, full-detail link, and Rent Check handoff are retained.

### Street View

Verified NAVER nearby street view stays at the top of the modal:

- one reserved 16:9 media frame shared by loading, ready, unavailable, and error states;
- no size changes during SDK initialization;
- initial camera direction continues to point from the capture position toward the verified building coordinate;
- capture time and distance remain visible;
- copy continues to state that it is a nearby street view, not a listing photo.

## Rent Check Layout Repair

The primary form is two equal rows:

- Row 1: Area, Housing type, Size.
- Row 2: Deposit, Monthly rent, Check.

Size presets and the pyeong switch move to one compact assistance row below the primary controls. Housing-type guidance sits with the Housing type field instead of spanning a tall empty panel. All controls share one height and baseline. The English and Chinese forms use the same geometry.

## Data and API Compatibility

The handoff ZIP is a visual and interaction reference, not a drop-in runtime replacement. Integration uses the current contracts:

- `/api/explore-area?scope=all&type=...` for the Seoul aggregate path;
- current district codes and property-type names;
- current `/api/explore-dong` and `/api/explore-building` flows;
- current map configuration endpoint;
- current request gates and stale-response invalidation.

The new district aggregate adapter returns one row per supported Seoul district with server-computed display metrics and contract count. The GeoJSON slug property maps deterministically to the current district catalog.

## SEO and Localization

- Keep `/rent/<district>/<type>/`, localized Dong pages, qualified building pages, `api/seo-*`, and sitemap endpoints.
- Keep the static Explore neighborhood directory and the existing home entry links.
- Keep the canonical Explore URL.
- English and Chinese Explorer pages receive the same structure and behavior, with localized labels and accessible names.
- KRW remains the source value; USD and CNY remain presentation conversions only.

## Accessibility and Failure States

- Polygons and custom price labels have equivalent keyboard-reachable district controls in the panel.
- Segmented controls expose pressed state.
- Panel and modal back/close controls have localized accessible names and visible focus rings.
- Map configuration failure leaves the discovery panel and crawlable links usable.
- District, neighborhood, building, boundary, or Street View failures render localized retry/unavailable states without collapsing the workspace.
- No console error is acceptable in the district-to-building journey.

## Testing and Verification

Automated tests cover:

- null and incomplete viewport bounds;
- request invalidation when district, type, metric, or neighborhood changes;
- server-computed adjusted-per-㎡ district and building medians;
- district → neighborhood → building state transitions;
- fixed workspace and bounded panel geometry contracts;
- ten-at-a-time building pagination;
- centered modal dismissal and focus restoration;
- stable 16:9 Street View states;
- English/Chinese parity;
- Rent Check row alignment;
- SEO and sitemap preservation.

Production browser verification covers desktop and 390px mobile widths:

- 25 district polygons render on first Explorer load;
- metric and housing controls redraw the map;
- district, neighborhood, and building selections work without scroll jumps or console errors;
- panel and map heights remain aligned;
- modal opens centered, stays within the viewport, scrolls internally, and closes by button, Escape, and backdrop;
- Street View frame stays the same size before and after initialization;
- Rent Check controls align without the tall empty assistance panel;
- crawlable district, neighborhood, and building pages still return indexable content where qualified.

## Explicit Non-Goals

- No new framework or bundler.
- No live listings or brokerage inventory.
- No change to official-data evidence thresholds merely to fill the map.
- No NAVER Real Estate scraping.
- No replacement of the current building-detail data controller with the ZIP draft.
- No deletion of SEO pages, sitemaps, header, or footer.
