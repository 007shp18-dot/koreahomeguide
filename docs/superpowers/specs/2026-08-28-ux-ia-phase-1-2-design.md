# UX Completion and Home Stage Entry Design

**Date:** 2026-08-28
**Baseline:** GitHub `main` at `c36c9558ee3d054bdf436df661d79f415bc4efdd`
**Source:** `spec-merged.md`, adjusted to the routes and evidence currently available in KoreaHomeGuide

## Goal

Improve the clarity, accessibility, sharing quality, and task flow of the existing English and Simplified Chinese product without adding a new service or hiding the current Rent Check entry point.

This release combines two approved passes:

1. Complete the high-confidence UX work already supported by the product.
2. Add a homepage-only four-stage entry pilot that measures where visitors are in the rental process before changing global navigation.

## Product Decisions

- Keep the current desktop navigation unchanged during the pilot. Five historical search terms are useful directional evidence but not enough to justify a site-wide information-architecture change.
- Keep `Saved` in the mobile bottom navigation. It is the only persistent entry to browser-saved comparisons on small screens and must not become harder to find.
- Do not create `/tools/settlement-timeline/` in this release. The route does not exist, and creating a legally current settlement tool would be a separate content and product project.
- Link the signed-lease stage to the existing foreign-renter guide's move-in section after adding a stable `#move-in` anchor in both languages.
- Link the budget stage to the same guide's budgeting section after adding a stable `#budget` anchor in both languages.
- Preserve all existing Rent Check field IDs, API requests, saved-quote storage, analytics events, canonical URLs, and hreflang links.
- Add no email modal, dark mode, animation system, gradient treatment, listing inventory, broker matching, or new user account.

## Phase 1: UX Completion

### 1. Social sharing metadata

Create one restrained 1200×630 default Open Graph image that communicates the product purpose, official-data basis, and KoreaHomeGuide brand without implying a listing or appraisal service.

Add the default image, dimensions, and `summary_large_image` Twitter card to:

- English and Chinese homepages
- English and Chinese Rent Check pages
- English and Chinese Explorer pages
- the shared dynamic SEO `pageHead()` renderer

Homepage Open Graph titles use the page's actual rent-check proposition instead of the brand name alone. Dynamic SEO pages retain their page-specific title and description.

### 2. Searchable district combobox

Progressively enhance the existing `#rentCheckArea` select on all four Rent Check entry points. The select remains the canonical form value and fallback, so existing prefill logic, tests, and API code continue to work.

A shared `district-combobox.js` module will:

- match the English, Korean, and Simplified Chinese names in `KHGLocations.RENT_CHECK_DISTRICTS`;
- support pointer selection plus Arrow Up, Arrow Down, Enter, Escape, and Tab;
- expose an accessible `combobox` and `listbox` relationship;
- synchronize the selected value back to `#rentCheckArea` and dispatch `change`;
- show the current selection when the input is empty;
- keep at most three recently selected district codes in local storage;
- fail back to the visible native select when JavaScript, storage, or catalog access fails.

Recent selections affect ordering only. They are not sent to analytics.

### 3. Dominant Rent Check verdict

Keep the existing result DOM IDs and evidence order, but make the verdict the visual anchor of the result. The panel contains:

- a non-color icon plus the localized rating text;
- the difference from the comparable median as the main supporting number when available;
- the signed-contract count and sample level as supporting evidence;
- existing detailed explanation and market-distribution evidence below it.

The single next action remains rating-specific:

- `above` → localized Explorer with district and official property type;
- `fair` and `below` → localized Before You Sign guide;
- `insufficient` → the matching localized district/property market page when the district code is present in `KHGLocations.DISTRICTS` and the official type is `apartment`, `officetel`, or `villa`; otherwise localized Explorer. This uses the existing 15-district market-page catalog rather than a filesystem or network check in the browser.

The existing `rent_check_next_action` event remains bounded to action ID, language, rating, district, and property type. No quote amount is added.

### 4. Saved comparison completeness

When a selected quote has no fixed management fee:

- render `+ Add fee to compare` / `+ 添加管理费以比较` instead of a passive dash in the fixed-fee and known-total comparison rows;
- activate the corresponding saved-home fee input when the action is used;
- show a localized completeness note beside the lowest-known-total badge, for example `2 of 4 selected homes have no fee entered`;
- keep incomplete homes excluded from the lowest-known-total calculation;
- suppress the lowest badge unless at least two selected homes have complete known totals, preserving the existing honest comparison rule.

### 5. Mobile dynamic SEO tables

Add localized `data-label` values to cells emitted by the dynamic SEO renderer and switch `.seo-table` to stacked comparison cards at small widths. Desktop table structure and semantics remain unchanged. Rent Check comparable tables are not reimplemented because they already use `data-label` mobile cards.

### 6. Design tokens and regression guard

Normalize `styles.css` after the structural additions so the new components do not introduce another radius or color dialect.

- Replace hardcoded `#475569`, `#64748b`, `#94a3b8`, `#fff`, and `#f8fafc` with existing tokens outside token declarations.
- Replace positive numeric corner radii with `--radius-sm`, `--radius-md`, or `--radius-lg` according to component size.
- Allow `0`, token-based mixed corners, `50%`, and `999px` for square edges and intentional circles/pills.
- Preserve functional Google Maps and transparency colors where no equivalent semantic token exists.
- Add a CSS contract test that fails when the replaceable colors or unapproved positive numeric radii return.

### 7. Accessibility baseline

- Add one global `:focus-visible` treatment for interactive elements while preserving specialized high-contrast treatments.
- Give interactive buttons and links in the new combobox, saved comparison, stage cards, and result actions a minimum 44×44 CSS-pixel target where layout permits.
- Restrict `--muted-light` to disabled, decorative, or secondary metadata use; body copy uses `--muted` or stronger.
- Preserve visible labels for form inputs and do not make placeholder text the only label.
- Respect reduced-motion settings for homepage hash scrolling and any existing smooth scrolling.

## Phase 2: Homepage Stage Entry Pilot

### Placement and layout

Place a compact `Where are you in the process?` section after the existing trust strip and immediately before the Rent Check section. The Rent Check form remains visible directly below it and keeps its existing `#rent-check` anchor.

Use four equal desktop cards and a two-column mobile grid, collapsing to one column only when necessary for readable copy. The cards are links, not modal controls.

### Stage destinations

| Stage ID | English label | Chinese label | Destination |
|---|---|---|---|
| `budget` | Setting a budget | 正在制定预算 | `/guides/rent-apartment-korea-foreigner/#budget` and localized equivalent |
| `looking` | Looking at listings | 正在看房源 | `/explore/` and localized equivalent |
| `quote` | Got a quote | 已拿到报价 | homepage `#rent-check` |
| `signed` | Signed the lease | 已签租约 | `/guides/rent-apartment-korea-foreigner/#move-in` and localized equivalent |

Add stable `budget` and `move-in` anchors to the existing guide headings. Do not duplicate their legal or administrative content on the homepage.

### State and analytics

Use a small shared `home-stage-entry.js` module. It stores only the stage ID in local storage and marks that card as the visitor's previous selection on return. It does not automatically redirect or reorder the homepage.

On an intentional stage-card activation, emit:

```js
gtag('event', 'stage_selected', {
  stage: 'budget|looking|quote|signed',
  language: 'en|zh-CN'
});
```

No amount, district, label, URL query, email, or saved-home detail is included.

### Pilot guardrail

Do not rename the global desktop or mobile navigation in this release. After deployment, compare:

- `stage_selected` distribution;
- stage selection to destination arrival;
- pages per session;
- Rent Check start-to-result completion rate against the preceding measurement period.

If Rent Check completion materially declines, move the stage section below the form or remove it. If the stage distribution and downstream use are strong, a later IA project may evaluate `Areas · Quote · Signing · Moving in` after a real moving-in destination exists.

## File Boundaries

- `district-combobox.js`: district matching, recent ordering, accessible interaction, select synchronization.
- `home-stage-entry.js`: stage catalog, safe persistence, previous-selection state, bounded analytics.
- `rent-check-ui-utils.js` and `zh/rent-check-ui-utils.js`: localized verdict presentation and next-action destination models.
- Four Rent Check runtime files: DOM binding only; no duplicated business rules.
- `saved-homes-page.js`: missing-fee actions and completeness presentation.
- `seo/seo-page-renderer.cjs`: dynamic OG metadata and mobile table labels.
- `styles.css` and `cold-start.css`: shared component styling, tokens, responsive and accessibility rules.
- Core EN/ZH HTML: script mounts, homepage stage markup, stable guide anchors, and static OG metadata.
- Focused test files: one behavior per test, followed by the full `node --test tests/*.test.cjs` suite.

## Error Handling and Fallbacks

- Storage failures never block navigation, Rent Check, saved quotes, or district selection.
- Missing location catalog data leaves the native district select usable.
- An invalid recent district code is discarded rather than displayed.
- An unavailable static market route falls back to Explorer for insufficient Rent Check data.
- A missing fee-action target re-renders safely and reports a localized status rather than throwing.
- Missing analytics is ignored and never blocks navigation.

## Verification

Automated verification must cover:

- EN, Korean, and ZH district matching;
- keyboard combobox selection and native-select synchronization;
- recent-district limit and storage failure;
- all four stage destinations, persistence, and exact GA4 payload;
- dominant verdict model and all four CTA branches;
- missing-fee counts, actions, and lowest-badge rules;
- OG metadata on static and dynamic surfaces;
- dynamic mobile table labels;
- token-lint failures for forbidden colors and radii;
- global focus visibility and mobile navigation bottom clearance;
- existing API, SEO, acquisition, saved-quote, privacy, and analytics contracts.

Manual verification must cover English and Chinese at desktop and approximately 390px mobile widths, including keyboard focus order, combobox operation, stage-card navigation, saved-fee focus, Rent Check result hierarchy, social-image rendering, and absence of framework/runtime overlays.

## Deployment States

Completion must be reported separately as:

1. Local implementation and tests complete.
2. GitHub `main` contains the reviewed file tree.
3. Vercel production is `READY` for that exact GitHub commit and the live EN/ZH desktop/mobile flows have been checked.

No commit, push, or deployment occurs without explicit user authorization under the project handoff rules.
