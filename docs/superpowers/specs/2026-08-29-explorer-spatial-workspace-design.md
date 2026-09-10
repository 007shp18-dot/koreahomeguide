# Explorer Spatial Workspace Design

## Purpose

Turn Explorer into a map-first decision workspace where a renter can move from neighborhood discovery to building evidence without losing geographic context. Replace the blocking centered building modal with a larger right-side detail drawer whose first visual is Street View and whose evidence is stacked below it.

## Product decision

Use a full-canvas map with two contextual overlay panels on desktop:

- a persistent left discovery rail that switches from neighborhoods to buildings;
- a right building drawer that opens only after a building is selected;
- the map remains the spatial background and keeps the selected marker visible.

A permanently docked three-column grid is rejected because it makes the map too narrow on common 1280–1440 px laptop viewports. A map-above-content layout is rejected because it forces repeated vertical scrolling and breaks the geographic context while comparing buildings.

## Scope

### Included

- English and Simplified Chinese Explorer pages.
- Desktop, tablet, and mobile responsive behavior.
- Neighborhood-to-building navigation inside one discovery rail.
- Building detail drawer with Street View above all numeric evidence.
- Selection, close, back, loading, empty, and error states.
- Existing save, Rent Check, full-detail, map-marker, geocoding, and analytics behavior.
- A companion homepage repair that keeps the size input and its presets inside the Rent Check card at every viewport.

### Excluded

- New APIs or database changes.
- Changes to rent, deposit, adjusted price, or market-position calculations.
- New map providers or listing photographs.
- Changes to the standalone building detail route.

## Desktop layout

Explorer results occupy the available viewport below the site header. The map canvas extends across the workspace instead of sitting beside a document-style results column.

### Left discovery rail

- Width: 360 px on viewports at least 1440 px and 320 px from 1024–1439 px.
- Position: inset over the left side of the map with a small outer gutter.
- Maximum height: available viewport height; its list body scrolls independently.
- Header remains compact and contains the current area, housing type, budget summary, and a filter-edit action.
- Neighborhood mode shows market summary followed by neighborhood cards.
- Selecting a neighborhood changes the same rail to building mode. It does not append a long building list below the neighborhood list.
- Building mode shows `← Neighborhoods`, selected neighborhood summary, sort control, and building rows.
- Closing the right drawer keeps the rail in building mode and preserves its scroll position.

### Map canvas

- Fills the workspace underneath both panels.
- Maintains all existing neighborhood and building marker behavior, `Search this area`, zoom caps, and verified-location rules.
- The selected marker is visually emphasized.
- Map viewport padding accounts for the visible left rail and right drawer so programmatic fitting does not hide the selected marker.

### Right building drawer

- Width: 520 px on viewports at least 1440 px and 460 px from 1024–1439 px.
- Position: inset over the right side of the map; it is not a centered modal and does not darken or lock the whole page.
- The drawer scrolls internally while its identity header, close action, and footer actions remain easy to reach.
- Opening another building reuses the same drawer and replaces its content without closing the map workspace.
- Escape and the close button dismiss the drawer and return focus to the building row or marker that opened it.

## Building drawer information order

The drawer uses one vertical reading flow:

1. Compact identity: building name, Korean official name when available, address, neighborhood, housing type.
2. Street View: a large 16:9 area at the top, followed by capture date and the existing nearby-view disclaimer.
3. Price snapshot: monthly rent, deposit, typical size, and deposit-adjusted KRW per square meter.
4. Market position: neighborhood comparison first, district comparison second, using the existing evidence thresholds and gauges.
5. Building facts: approval year, household or family count, and floors when officially matched.
6. Recent contracts: up to five contracts with date, floor, size, rent/deposit, and adjusted price per square meter.
7. Actions: save, check the quote in Rent Check, and open the full building detail page.

If Street View is unavailable, the drawer shows the existing status explanation in the same reserved media position so the data below does not jump above the identity block.

## Responsive behavior

### Tablet, 761–1023 px

- The map still fills the workspace.
- The discovery rail becomes a compact 320 px overlay.
- The building drawer occupies up to 56% of viewport width.
- Only one overlay may receive focus at a time, but both remain visually associated with the map.

### Mobile, up to 760 px

- The map fills the screen below the compact Explorer filter header.
- Discovery and building details use one bottom sheet with three snap states: 96 px collapsed summary, approximately 62dvh list view, and approximately 92dvh full detail.
- Neighborhood selection switches the sheet from neighborhood cards to building rows.
- Building selection expands the sheet to full detail with Street View first and stacked evidence below.
- Back returns from building detail to the building list, then from the building list to neighborhoods, without reloading data.
- The existing Map/Results control remains available and reflects the active sheet state.

## Companion homepage size-field repair

The homepage size field uses a two-row control instead of forcing the numeric input, three presets, and unit toggle into one horizontal line.

- Row one contains the numeric size input at the full width of its grid cell.
- Row two contains `Compact`, `Standard`, and `Family` in three equal columns.
- The pyeong toggle is a separate low-emphasis action below the presets.
- The field, presets, toggle, and Check button remain within the Rent Check card at desktop, tablet, and mobile widths.
- No homepage data, validation, preset values, or unit-conversion behavior changes.

## State model

The visual shell has three explicit states:

- `neighborhoods`: neighborhood markers and neighborhood cards are active; building rail and drawer are absent.
- `buildings`: a neighborhood is active; building markers and building rows are active; drawer is absent.
- `building-detail`: building mode remains active and the selected building drawer is visible.

Transitions reuse the existing `khg:map-select-dong`, `khg:map-select-building`, and `khg:building-window-open` events. The building window controller owns the detail drawer; the Explorer app owns neighborhood/building rail mode; the map controller owns marker selection and viewport padding. No controller duplicates another controller's data fetching.

## Loading and failure behavior

- Loading the neighborhood or building list replaces only the rail body, not the map.
- Loading a building replaces only the drawer body and keeps identity plus Street View placeholder visible.
- A building-detail API failure provides retry and close actions in the drawer.
- A map failure leaves the discovery rail fully usable.
- A Street View failure leaves all signed-contract evidence available and labels the media as unavailable.
- Stale building responses must not replace a newer selection.

## Accessibility

- The left rail has a descriptive navigation/region label and the right drawer is a complementary region on desktop.
- The mobile sheet uses dialog semantics only while showing a selected building.
- Focus is returned to the opening building row or marker on close.
- Escape closes building detail; it does not exit neighborhood building mode.
- All controls remain keyboard reachable with visible focus rings.
- Motion is disabled under `prefers-reduced-motion`.

## Analytics

Preserve existing map-view, marker-selection, save, and Rent Check events. Add no personally identifying fields. Layout state changes may reuse the existing Explorer view event; no new analytics provider is introduced.

## Acceptance criteria

- At 1363 px viewport width, the page and every rail/drawer have zero horizontal overflow.
- The map occupies the full workspace and remains visible behind contextual panels.
- Neighborhood selection replaces neighborhood cards with building rows in the left rail.
- Building selection opens a right drawer rather than a centered page-blocking modal.
- Street View appears before price and contract evidence in DOM and visual order.
- Closing building detail preserves neighborhood selection, building list, map position, and list scroll.
- English and Simplified Chinese pages expose equivalent structure and localized controls.
- Mobile supports neighborhood list, building list, and building detail in one bottom sheet without hiding Street View.
- Existing Explorer API, marker, save, Rent Check, and full-detail tests continue to pass.
- The homepage Rent Check card has zero horizontal overflow and its size controls never cross the card's right edge.
