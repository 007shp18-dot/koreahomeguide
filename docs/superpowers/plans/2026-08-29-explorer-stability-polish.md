# Explorer stability polish

## Reproduced causes

- District display reads the 15-district SEO catalogue, so newer supported codes such as `11590` fall back to the raw code.
- Every Google Map `idle` event filters and re-renders the neighborhood or building list. Automatic marker fitting therefore races with selection and makes the rail appear to move between states.
- Each neighborhood result has two competing click targets: the building drill-down and a separate guide link.
- The final Explorer workspace leaves avoidable viewport space below the map, while its command bar uses two rows.
- Rent Check's assistance row wraps its hint, presets, and unit toggle into a tall uneven strip.

## Implementation

1. Use the complete Rent Check/Explorer district catalogue for display labels while retaining the existing indexability allowlists.
2. Keep viewport events as map telemetry only; never filter or re-render the rail automatically. `Search this area` remains the explicit map refresh action.
3. Remove per-result guide links. Keep the crawlable guide directory as a collapsed disclosure below the map.
4. Increase the desktop map to the available viewport and collapse the command bar to one row.
5. Make the Rent Check assistance row a compact single line on desktop and a controlled stack on mobile.
6. Verify English and Chinese flows, `11590`, district → neighborhood → building state stability, modal stability, and responsive geometry.
