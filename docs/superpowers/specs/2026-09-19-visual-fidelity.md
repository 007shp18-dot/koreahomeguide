# SignedPrice: implement the illustrated design, not a recolour

The user approved rebuilding the previous implementation on 19 September 2026. The visual reference is the image-based homepage and detail mockups in the conversation: full-bleed photographic hero with a readable white-to-transparent gradient, large blue-accented headline and working search; four equal photographic city cards; visible sourced charts; asymmetric photo-led editorial cards; a blue illustrated CTA. Preserve Seoul, Singapore, Dubai, Tokyo and all published locales. The user explicitly permits removing unnecessary old UI and prefers reusing existing images.

## Deliverable
Replace the old homepage arrangement instead of layering more overrides. Remove duplicate tool-directory boxes and repeated buying-explanation sections from overview screens. Keep useful budget and evidence actions accessible. Reuse source-backed monthly report charts on home and city overview pages with explicit periods, units and scope. Detail pages must keep their existing true transaction-series charts visible, rather than substituting illustration or mock numbers. Use the existing licensed city photographs and decorative illustration assets; generated building visuals must never identify an actual property.

## References
Aceternity Apple Cards Carousel: photo-led cards and scroll snapping, adapted to four equal cities and native links.
Magic UI Scroll Progress: restrained reading-progress enhancement; no hidden content while animation runs.
Skiper CssLink: short CSS link/arrow affordances; acknowledge any reused source.
HyperUI: semantic details lists, tables and filter layouts.
GetLayers/Awwwards: photographic hierarchy and consistent section rhythm, not paid template scraping.
Shapefest: a consistent small blue/clay illustration treatment; only reuse assets with permission.

## Preserve
Existing routes/redirects/canonical metadata, data/source policies, currencies, filters, API boundaries, consent, saving, check forms, translations and admin pages. No database writes or dependency changes. Never infer missing prices/counts or repurpose old counts as live values. No external contact submission during tests.

## Acceptance
A screenshot must show the full photographic hero, four destination cards, an actual data-backed chart and illustrated CTA, not just a release marker. Test desktop, phone and tablet widths, locale search, keyboard focus and existing data journeys. Compare actual screenshots side by side with the reference and report any remaining visual differences. Production deployment is not complete until verified.
