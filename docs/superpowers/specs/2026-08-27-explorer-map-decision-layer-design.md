# Explorer Map Decision Layer v1 Design

**Date:** 2026-08-27
**Status:** Approved
**Roadmap position:** Phase 2 closeout before controlled acquisition

## Goal

Turn the Explorer map from a location reference into a bounded neighborhood decision aid. A renter should be able to see which mapped neighborhoods fit the selected rent and deposit limits, understand how much contract evidence supports each marker, and continue into a prefilled Rent Check without introducing listings, geocoding, or commute features.

## Decision Model

The map continues to use curated neighborhood centroids and official reported rental summaries.

- **Strong:** the neighborhood fits the active budget limits, when present, and has at least 10 relevant reported contracts.
- **Limited:** the neighborhood fits the active budget limits, when present, but has fewer than 10 relevant reported contracts.
- **Outside budget:** no reported deposit band or neighborhood context fits every active budget limit.
- With no budget limit, markers communicate evidence strength only.

When a budget is active, evidence strength is based on contracts in matching deposit bands when that information exists. Otherwise it falls back to the neighborhood contract count. Missing constrained values never count as a fit.

## Map Experience

- Keep every mapped neighborhood visible after an area comparison so renters retain geographic context.
- Use green for strong evidence, amber for limited evidence, grey for outside-budget context, and blue for the selected marker.
- Scale markers conservatively by evidence count and keep the reported-contract count as the marker label.
- Add a localized legend that explains the colors without implying listings, safety, or investment quality.
- Selecting a marker reveals one compact decision card containing neighborhood name, contextual monthly rent, contextual deposit, reported-contract count, evidence wording, and a Rent Check action.
- Marker selection continues to highlight and focus the matching neighborhood card when that card is present.
- Hovering or focusing a neighborhood card continues to highlight and pan to the corresponding marker.
- On mobile, the decision card sits directly below the bounded map instead of covering the map with a modal.

## Rent Check Handoff and Measurement

- The map decision card uses the existing Explorer Rent Check handoff contract.
- It carries only the selected district, property type, validated Explorer source, and existing campaign context. It does not treat budget limits as an offered quote.
- Existing `rent_check_cta_click` measurement identifies the action with `cta_id=explorer_map_handoff`.
- Add bounded `explorer_map_view` and `explorer_map_select` events containing locale, district, property type, budget-filter state, visible marker count, and evidence/budget classification. Do not include currency amounts, free text, contact data, or API error messages.

## Localization and Accessibility

- Ship English and Simplified Chinese parity.
- Keep the card list as the complete keyboard-accessible alternative to the map.
- The decision card is an `aria-live` region and the legend is visible text.
- Marker titles name the neighborhood, classification, and reported-contract count.
- Preserve the current missing-key and map-load failure states; the Explorer cards and Rent Check handoffs remain usable without Google Maps.

## Out of Scope

- Building-level markers, exact property locations, live listings, address search, polygons, routes, commute time, nearby places, safety scores, or investment recommendations.
- API response changes, new providers, new map APIs, or changes to Rent Check verdict logic.
- Treating median rent and median deposit from unrelated observations as one synthetic offer.

## Success Criteria

1. Active budget limits visibly distinguish fitting and outside-budget mapped neighborhoods.
2. Evidence strength is derived deterministically and does not overstate small samples.
3. A marker selection exposes localized price context, evidence, and a correctly prefilled Rent Check action.
4. English and Chinese Explorer pages remain symmetric and usable at 1280×720 and 390×844.
5. Map view, marker selection, and map-origin Rent Check clicks can be distinguished without collecting quote values or PII.
6. The complete automated suite and browser checks pass with the map available and unavailable.
