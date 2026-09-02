# SignedPrice Explore V2 UI Design

## Goal

Replace the visible legacy AreaExplorer composition with the approved Explore V2 workbench while preserving the verified Korea evidence repositories, Naver map integration, locale routes, and URL-backed filters.

## Non-goals

- Do not change evidence publication thresholds or invent missing prices.
- Do not remove News or Community integration points.
- Do not redesign Building Detail, Check, or Singapore Explore in this change.
- Do not replace Naver Maps for Korea.

## Information architecture

1. **Market header** — compact location, period, result count, and evidence status.
2. **Filter board** — transaction, area, housing type, district, neighborhood, and building query grouped into readable rows.
3. **View switcher** — URL-backed Split, List, Table, and Map controls.
4. **Evidence workbench** — district/results rail, map canvas, and selected-building evidence panel.
5. **Coverage and source boundary** — publication coverage, complete district table, and source notes below the workbench.

## View behavior

| View | Primary composition |
|---|---|
| Split | District/results rail + map + selected evidence |
| List | Wide retained-building results + selected evidence |
| Table | Complete district evidence table + compact context rail |
| Map | Large map + compact selected evidence panel |

The same filter and selection state is retained across all views. A building chosen from a map marker or result row becomes the same selected building and is encoded in the Explore URL.

## Visual system

- Warm paper surface, dark ink, petrol green, and a restrained orange signal color.
- Square geometry: no decorative shadows, pills, or arbitrary rounded cards.
- One component owns each dividing line to prevent doubled borders.
- Numeric evidence uses tabular figures and stronger hierarchy than labels.
- Headings and labels use readable line-height and restrained letter spacing.
- Map labels and legends must not overlap controls.

## Responsive behavior

- At 390px the page is one column with no horizontal viewport overflow.
- View controls wrap into an accessible two-by-two grid.
- The map has a bounded mobile height; selected evidence follows it in document flow.
- Wide evidence tables scroll inside their own region instead of widening the page.
- Touch targets remain at least 40px high.

## Acceptance criteria

- Initial HTML exposes `data-explorer-version="v2"` and named regions for filters, results, map, and selection.
- All four views have materially distinct layout states.
- Map, list, selection card, and URL converge on one selected building.
- Existing 25-district, sale/jeonse/monthly, all-area, and evidence-withholding behavior remains intact.
- Desktop and 390x844 browser checks show no overlap, clipping, double rules, or illegible labels.
- Existing News and Community navigation/integration surfaces remain present.

