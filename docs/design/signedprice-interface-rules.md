# SignedPrice interface rules

These rules extend SignedPrice's existing white/grey surfaces, dark typography and blue selection colour. SEED's [tokens](https://seed-design.io/foundations/design-token), [chips](https://seed-design.io/components/chip) and [responsive panels](https://seed-design.io/components/side-panel) inform the interaction patterns.

## Common controls

- Reuse colours, spacing and typography from `v2/apps/web/app/globals.css`. Standard controls use `--control-height` (48px), interactive targets have at least `--control-min` (44px), and controls use `--radius-control` (8px).
- Use `--accent` for the primary action and `--accent-soft` for selected conditions. Pair selection colour with a label or accessible state.
- Use the shared `AppliedFilters` component for removable query conditions. Removing one condition preserves unrelated conditions, resets pagination and clears a release identifier whose scope may have changed. Reset restores the documented default for the selected city/ward.
- Keep main input text at 16px and regular control labels at 14px. Amounts use tabular numerals; long names may wrap.
- Keep keyboard focus visible. Loading, empty results, missing publications and failed requests must remain distinguishable. Missing data must never become a zero price or zero transaction count.

## Explore

- City order: Seoul, Singapore, Dubai, Tokyo, including navigation and tool selectors.
- Use one page title. Avoid repeating the same heading above both columns.
- Desktop: discovery on the left and map on the right. Keep the map available while browsing results.
- Tokyo is the first consumer of `ResponsiveResultsPanel`: at 760px and below, its results open in a native modal sheet with a visible close button and Escape dismissal. Without JavaScript, results remain readable inline.
- Preserve the active ward, publication period, property type and area conditions through navigation. Keep exact neighbourhood selection distinct from free-text search.
- Only display the geographical precision supplied by the source. Tokyo transactions do not identify individual buildings or available listings.

## Localisation and verification

- Support the existing English, Korean and Simplified Chinese routes. Translate new control labels and retain locale prefixes in all action links.
- Display the currency explicitly in the active market context. Use locale-aware date formatting, including a month name for English dates.
- Verify filter removal and reset, period selection, pagination, map-to-area navigation, empty/error states, keyboard dismissal and narrow-screen overflow before extending the pattern to another city.
