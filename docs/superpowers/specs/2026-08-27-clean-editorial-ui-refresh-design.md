# Clean Editorial UI Refresh Design

**Date:** 2026-08-27
**Approved direction:** Light system refresh across Home, Rent Check, and Explorer

## Goal

Make KoreaHomeGuide feel calmer, more consistent, and easier to scan while keeping Rent Check immediately usable and preserving the existing blue, evidence-first identity.

## Approved Experience

### Shared system

- Keep the white-first canvas and blue primary action.
- Use a compact translucent header, neutral borders, and one consistent surface language.
- Standardize primary card radius at 16px, action radius at 11px, and internal card padding around 24px.
- Remove large decorative shadows. Use borders and restrained hover lift for hierarchy.
- Use 72-80px desktop section rhythm and tighter mobile spacing.
- Preserve visible keyboard focus, 44px tap targets, reduced-motion behavior, existing DOM IDs, URLs, analytics, and product behavior.

### Homepage

- Keep Rent Check above the fold and directly after the promise/trust block.
- Reduce the headline from the current oversized presentation to a compact 44-56px desktop range.
- Present the rest of the page as alternating editorial bands rather than a stack of similar white cards.
- Add a three-step explanation of how the product moves from quote to evidence to action.
- Turn the Explorer section into a dark evidence/proof band centered on official transaction data and map support, not listings.
- Present guide cards as a clearly labeled recently updated content module.
- Keep Rent Check as the only primary CTA; Explore and Guides remain secondary.

### Rent Check and Explorer

- Apply the same header, card, spacing, typography, and action rules to both product surfaces.
- Keep all current form, map, results, confidence, evidence, and handoff behavior unchanged.
- Give product heroes a shorter, calmer first viewport and make evidence surfaces visually distinct from utility controls.

### Localization and responsive behavior

- Ship English and Simplified Chinese parity.
- At tablet and mobile sizes, stack content in task order, retain 16px page gutters, and prevent oversized headings or horizontal overflow.
- On Explorer mobile, keep the map before result lists as currently designed.

## Non-goals

- No brand-color change, full navigation rewrite, animation system, new API, new map behavior, or SEO route expansion.
- No copied text, assets, or exact layout from the reference site.
- No speculative statistics or fake product results.
- No changes to Rent Check calculations, Explorer data, MOLIT parsing, lead capture, or deployment function count.

## Success criteria

1. Home, Rent Check, and Explorer share the same documented radius, border, spacing, and action hierarchy.
2. The homepage retains immediate Rent Check access while adding three-step, evidence/map, and recently updated guide sections in both locales.
3. The desktop homepage headline is capped at 56px and core mobile headings remain within 44px.
4. Existing form IDs, analytics hooks, product behaviors, and localized routes remain intact.
5. Targeted UI tests and the full repository suite pass, and the production build remains valid.
