# Explorer Modernist Rebuild Design

## Goal

Rebuild `/explore/` as the first production vertical slice of the Claude Modernist UI system while preserving KoreaHomeGuide's verified rental data, Google Maps integration, building detail workflow, and SEO assets.

## Product contract

- The first screen shows all 25 Seoul districts on the map.
- Users explicitly choose district, neighborhood, and building. Map movement never changes the discovery rail until `Search this area` is pressed.
- The primary comparison metric remains server-computed deposit-adjusted monthly cost per square metre: `monthly rent + deposit × 5% ÷ 12`, divided by area.
- Districts with fewer than 5 eligible contracts show `Not shown` / `未显示`, a hatch pattern, and the sample count. Missing data is never displayed as zero.
- All price, period, source, sample-size, revision, and limitation copy remains visible on narrow screens.

## Visual system

- Low-card Modernist composition: open map canvas, flush-left typography, square controls, 2px structural rules, 1px row rules, no decorative capsules.
- Cobalt is the only accent family. District choropleth uses five cobalt steps; insufficient evidence uses ink plus hatching.
- English/Latin: Instrument Sans. Korean: Pretendard Variable. Chinese: Noto Sans SC. Font files are self-hosted when available; system sans-serif remains the safe fallback.
- Numeric content uses tabular numerals.
- Existing site header, footer, canonical, hreflang, `/rent/*`, `api/seo-*`, and sitemap behavior remain unchanged in this slice.

## Desktop information architecture

- A bounded full-height workspace contains the map and a 380px discovery panel.
- Housing and metric segmented controls sit at the map's upper-left; legend sits at lower-left; Google zoom controls remain lower-right.
- The discovery panel owns district, neighborhood, and building states. It has a strong header rule, metrics, a scrollable result list, source/limitations, and a Rent Check handoff.
- Building selection opens the existing centered building dialog. No second building-detail implementation is introduced.

## Building detail scrolling

- Header and close control remain visible.
- Street View and every evidence section live in one `.building-status-scroll` container.
- The scroll container is the sole vertical scroller inside the dialog. Street View is therefore not pinned while users read the evidence below it.
- Footer actions remain visible at the bottom.
- Mobile uses the same DOM and scrolling contract in a bottom sheet capped at 94dvh.

## Mobile information architecture

- The map fills the workspace and the discovery panel becomes a bottom sheet capped at 64dvh.
- Controls have 44px minimum targets. The legend may be hidden because every district label contains its value, but source, period, sample size, and limitations are never hidden.
- Building detail is a bottom sheet. Street View scrolls away with the data; actions remain reachable.

## Accessibility

- District labels are real buttons with meaningful accessible names.
- Segmented controls use `aria-pressed`.
- Close, Escape, backdrop click, and focus restoration remain supported.
- Focus uses a visible 2px cobalt ring with 2px offset.
- Motion respects `prefers-reduced-motion`.

## Data and rights boundaries

- Only existing official MOLIT-derived values are rendered.
- No mockup fixture values ship to production.
- The existing server aggregation remains authoritative for adjusted per-square-metre values.
- Insufficient evidence is a distinct state, not a zero or a client-side estimate.

## Non-goals for this slice

- No global V2 route migration.
- No new listing marketplace or brokerage flow.
- No deletion or redirect of current SEO pages.
- No site-wide header/footer redesign until the Explorer slice is verified.

## Acceptance gates

- Phase 0 remains locked at 23 known failures; the new verified total is `895 / 872 / 23`.
- Explorer focused tests pass, including unified building-dialog scrolling.
- Desktop 1440×900 and 1366×768, plus mobile 390×844, are browser-verified.
- District, neighborhood, and building selection stability is preserved.
- A building dialog can scroll from Street View to the final contract/action content on desktop and mobile.
