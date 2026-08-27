# Rent Check Conversion Consistency Design

**Approved:** 2026-08-27 in chat

## Goal

Reduce avoidable friction and visual inconsistency in the English and Simplified Chinese product flows without changing the Rent Check API, calculation rules, analytics event names, URLs, or SEO structure.

## Scope

1. Replace the fixed Studio / 1.5-room / Two-room size presets with property-type-aware size presets.
2. Keep user-entered and Explorer-prefilled areas intact when the property type changes; only replace an area that still came from a preset/default.
3. Make KRW the initial primary currency across interactive product and market pages, persist an explicit USD/CNY choice locally, and keep KRW as the primary displayed amount with foreign currency as a reference.
4. Format active money inputs with thousands separators and show a Korean `만원` interpretation while preserving numeric KRW values for the API.
5. Reduce the Rent Check result to one verdict-dependent next-step CTA, with local quote saving remaining a separate secondary action.
6. Apply a limited type-scale and visual-token cleanup to the core Rent Check, Explorer, calculator, saved-home, and market surfaces.

## Property-type presets

| Type | English | Simplified Chinese | Representative areas |
| --- | --- | --- | --- |
| Apartment | Compact / Standard / Family | 紧凑 / 标准 / 家庭型 | 35 / 60 / 85㎡ |
| Officetel | Compact / Standard / Spacious | 紧凑 / 标准 / 宽敞 | 15 / 20 / 30㎡ |
| Villa / low-rise | Small / Medium / Large | 小型 / 中型 / 大型 | 20 / 35 / 60㎡ |
| Detached / multi-unit | Small / Medium / Large | 小型 / 中型 / 大型 | 20 / 35 / 50㎡ |
| Studio / one-room | Compact / Standard / Large | 紧凑 / 标准 / 大型 | 15 / 20 / 25㎡ |

The labels describe approximate floor area, not bedroom count, because the official contract source does not provide a reliable bedroom field. The preset clusters are fixed for predictable UI behavior and are supported by the current six-month Mapo contract distribution checked on 2026-08-27.

## Interaction rules

- The initial type renders its matching presets and selects the middle representative area.
- Clicking a preset updates the numeric field in the active ㎡/평 unit and marks that preset selected.
- Manually editing the area marks it as user-owned. Later property-type changes update button labels but do not overwrite the value.
- Explorer query-string area prefill is user-owned and is never overwritten.
- When the current value still came from a preset/default, changing the property type selects the new middle preset.
- The same shared controller drives the four Rent Check forms: English/Chinese home and English/Chinese standalone tool.

## Currency and amount rules

- Every static currency selector starts at KRW to avoid a pre-JavaScript flash of USD/CNY.
- `currency-utils.js` reads and writes one local preference key. A valid saved USD or CNY choice wins after the shared script loads.
- Official Korean amounts remain the visually primary amount. A selected foreign currency appears beneath as an approximate reference.
- Rent Check and brokerage inputs remain usable in KRW, USD, or CNY. Visible values use grouping separators, while parsers strip separators before conversion.
- KRW inputs show a localized helper such as `= 1,000만원`; foreign-currency inputs continue to show the equivalent KRW amount.

## Result hierarchy

- `resultNextStep(rating)` returns one `primary` action only.
- Above-market results lead to Explorer; fair/below results lead to the before-signing guide; insufficient results lead to the relevant market view.
- Browser-local quote saving remains available beneath the evidence as an outlined secondary action.
- Inline email/help capture remains below the saved quote module and is not promoted into the verdict action row.

## Visual system

- Keep Geist Sans with Noto Sans SC/KR fallbacks.
- Add a compact shared type scale and apply it to core labels, body copy, result headings, and evidence metadata. Important result labels must not render below 12px.
- Keep white/slate/blue as base colors. Remove legacy forest-green calculator and market surfaces; reserve green/amber/red/gray for state meaning.
- Replace hardcoded radii in the touched core surfaces with the existing `--radius-sm`, `--radius-md`, and `--radius-lg` tokens. Unrelated editorial pages are not broadly rewritten in this sprint.

## Compatibility and verification

- Preserve all existing IDs, URLs, APIs, query parameters, lead behavior, saved-quote storage schema, GA4 events, Vercel Analytics, and SEO metadata.
- Add unit/contract tests before implementation.
- Run the full Node test suite.
- Verify English and Chinese Rent Check and Explorer at desktop and mobile widths.
- Push only after confirming GitHub main has not moved; then verify the Vercel production deployment commit and live flows.
