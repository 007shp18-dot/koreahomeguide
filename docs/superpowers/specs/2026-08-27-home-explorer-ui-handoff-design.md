# Home and Explorer UI Handoff Design

**Date:** 2026-08-27
**Baseline:** `c77c7e658474c892937e1dc1bdd3b1e852908a49`
**Roadmap position:** Phase 2 — Entry-page and tool connection

## Goal

Make the first Rent Check action easier to reach on the homepage and make every quote-oriented Explorer action carry the selected district and housing type into Rent Check.

## Approved Scope

### Homepage

- Reduce hero and trust-strip vertical space so the Rent Check section begins within the first desktop viewport and substantially sooner on a 390px mobile viewport.
- Keep the existing cold-start funnel, copy, DOM IDs, analytics, and lead-capture order.
- Preserve Rent Check as the single primary action; Explorer and Guides remain secondary.

### Explorer

- Add a compact, clearly worded Rent Check handoff within the filter card.
- Update all Explorer quote CTAs whenever area or property type changes.
- Carry only `lawdCd`, `type`, bounded `/explore/` or `/zh/explore/` source attribution, and existing campaign context.
- Do not copy budget limits into quote fields: a maximum budget is not an offered rent or deposit.
- Compute CTA analytics context at click time so a changed Explorer selection is attributed correctly.
- Keep the existing map, results, APIs, URL state, and neighborhood/building behavior unchanged.

### Localization and Responsive Behavior

- Ship English and Simplified Chinese parity.
- Verify 1280×720 desktop and 390×844 mobile layouts.
- Keep keyboard focus, `aria-live`, and existing reduced-motion behavior intact.

## Non-Goals

- No full visual rebrand or design-system rewrite.
- No changes to MOLIT parsing, statistics, API response shapes, SEO routes, sitemap eligibility, or Vercel function count.
- No new Singapore or Dubai surface.
- No deployment to `main` without review of the branch diff and verification evidence.

## Success Criteria

1. Homepage Rent Check content starts noticeably earlier on desktop and mobile without removing trust language.
2. An Explorer selection such as Gangnam-gu + Officetel produces a Rent Check URL containing `lawdCd=11680`, `type=officetel`, and the localized Explorer source.
3. Changing the Explorer selection before clicking updates both navigation and `rent_check_cta_click` attribution.
4. English and Chinese flows remain symmetric.
5. Targeted tests pass; the full suite has no failures beyond the two pre-existing Windows `find` portability failures.
