# Photographic visual fidelity implementation

Goal: match the approved visual hierarchy rather than recolour the old budget-first skeleton. Spec: docs/superpowers/specs/2026-09-19-visual-fidelity.md.

- [x] Read actual mockups, existing source and official design references.
- [x] Write and observe the failing real-browser visual contract on baseline d0aebf77 (run 35409154684).
- [x] Replace home layout/CSS with full-width photographic hero, functioning locale search, four equal photo cards and asymmetric editorial cards. Preserve BuyingJourney interactions.
- [x] Add reusable MarketPulse, TokyoBudgetChart, LocalLifeGallery and IllustratedCta. Reuse recorded source values and licensed source imagery. No new packages.
- [x] Replace old generic purchase explainer on city overviews with sourced graphs and actual local-life images. Keep the available data facts, source boundary, actions and children.
- [x] Separate public styling from archived design-review surface and restore original 2px focus offset.
- [ ] Verify lint, types, existing units, production build and actual desktop/mobile/tablet screenshots.
- [ ] Inspect original and rendered page side by side; fix discrepancies and repeat real UI checks.
- [ ] Publish reviewed preview/PR with exact test coverage. Do not claim production until deployed.

All layouts retain English, Korean and Simplified Chinese routes, no database/API/SEO/consent changes. Photo credits remain visible. The decorative houses are from the conversation's generated concept, not a real property. The pulse shows historical transaction counts, not a price index. Tokyo ranges use the existing anonymous condominium comparison groups.
