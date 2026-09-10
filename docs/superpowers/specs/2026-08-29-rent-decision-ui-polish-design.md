# KoreaHomeGuide rent-decision UI polish design

## Outcome

The Rent Check and Explorer should feel like one calm decision product. Every filter uses the same control geometry, the result leads with a single position verdict instead of a stack of competing cards, the Explorer map has one compact information bar, and a building opens into a stable Street-View-first drawer without an intermediate full-size flash.

## Approved scope

- Apply the same 52px control height, border, radius, focus ring, typography and chevron treatment to native selects and the enhanced district combobox.
- Keep the desktop Rent Check form in two aligned rows. Size presets remain secondary controls and cannot increase the first-row control baseline.
- Reduce the first Result view to verdict, difference, annual impact, quote-versus-median values and next action.
- Put market distribution, confidence explanation and signed contracts in one disclosure labelled `See signed contracts` / `查看已签约成交`.
- Keep save, experience and share modules available after the primary decision content, but visually subordinate them.
- Merge the Explorer title, back action, view control and marker legend into one compact glass toolbar.
- Keep the map as the dominant Explorer surface: a left discovery rail on desktop and a bottom sheet on mobile.
- Keep the building drawer fixed to the right on desktop and as a bottom sheet on mobile. Street View is the first large visual block and all building data follows vertically.
- Prepare the selected building, loading skeleton, links and Street View reset while the drawer is hidden. Reveal only after the stable opening state exists.
- Ignore stale detail and Panorama responses when the user changes buildings quickly.
- Preserve English and Simplified Chinese parity, KRW-first values, existing API contracts, element IDs and accessibility behavior.

## Visual direction

Use a quiet data-terminal hierarchy rather than stacked marketing cards: white surfaces, slate rules, one blue action, small uppercase evidence labels and tabular numeric values. Controls should look deliberately related. Loading skeletons use the final drawer geometry so no content or page-size jump is visible.

## Responsive behavior

- Desktop: controls align to one baseline, the map toolbar stays inside the usable map area, and the 520px drawer never changes outer dimensions while loading.
- Tablet: the drawer remains fixed until the existing 860px mobile boundary; its width is stable at 460px.
- Mobile: form fields stack, the map toolbar wraps without overlap, and the drawer becomes a 92dvh bottom sheet with Street View above the scrollable data.
- Reduced motion: the drawer appears without animation while preserving the same staged rendering order.

## Verification

- A regression test proves the drawer is staged before it becomes visible and Street View reset occurs before the opening event.
- Source and CSS tests cover uniform control geometry, the two-row form, the compact result disclosure, the merged map toolbar and stable drawer skeleton.
- All existing Node tests remain green.
- Changed JavaScript passes syntax checks and the diff passes whitespace validation.
- Production verification checks the deployed Rent Check and Explorer endpoints after Vercel reports ready.
