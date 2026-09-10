# Mockup Recovery and Singapore Check Design

**Status:** Approved in conversation on 2026-09-02

**Reference archive:** `Korea Home Guide UI Mockups.zip`

**Reference SHA-256:** `f7901bab66e99f4ed023aa3f863330c35fb5473554fffaa8bd15e10ddb9f2daa`

**Supersedes for this scope:**

- `docs/superpowers/specs/2026-08-29-explorer-choropleth-modal-design.md`
- `docs/superpowers/specs/2026-08-29-explorer-spatial-workspace-design.md`
- `docs/superpowers/specs/2026-08-30-explorer-modernist-rebuild-design.md`
- `docs/superpowers/specs/2026-09-01-signedprice-unified-market-explorer-v2-design.md`
- `docs/superpowers/plans/2026-09-02-explore-mockup-parity.md`

Those documents inferred layouts that conflict with the supplied archive. The archive is the visual source of truth for this recovery.

## Goal

Restore Seoul Explore and district/building detail to the supplied mockups, remove cross-product and cross-market navigation leaks, and add a native Singapore Check product based on verified URA and HDB evidence.

The release order is fixed:

1. Seoul Explore mockup parity
2. Seoul district and building detail mockup parity
3. KoreaHomeGuide and cross-market navigation cleanup
4. Singapore Check data contract, engine, route, and UI
5. Resume Seoul station and school proximity work

The existing Explore PR must not merge until the first three gates pass.

## 2026-09-03 unified-market amendment

The supplied archive now governs both published markets. Seoul and Singapore
must share the same visual composition; market-specific evidence must not
create a second design system.

The revised release order is fixed:

1. shared Explore and Detail composition contracts
2. Seoul Explore and Detail parity
3. Singapore Explore and Detail migration onto those contracts
4. market-owned navigation and return-link isolation
5. Singapore Check product completion
6. full browser and production verification
7. proximity artifact activation only after official coordinate inputs pass
   the independent data gate

### Shared composition boundary

- `MarketExploreShell` owns the compact title row, market-layer control,
  420 px discovery column, fluid spatial panel, four view modes, selected
  evidence drawer, and mobile bottom sheet.
- `MarketDetailShell` owns breadcrumb, identity, primary metric, evidence
  column, 380 px contextual rail, source disclosure, and mobile stacking.
- Seoul and Singapore adapters provide copy, native filters, rows, maps,
  evidence modules, and unavailable states. They do not redefine typography,
  spacing, active controls, borders, or page geometry.
- Singapore URA private sale, HDB resale, and HDB rent remain distinct data
  layers inside the shared Explore shell. They are not separate page designs.
- Market navigation is resolved from `{market, locale, surface}`. A market's
  product navigation, breadcrumbs, result actions, and return URLs never fall
  through to another market.
- The upper market switcher may intentionally link between Seoul and
  Singapore. Product navigation below it remains market-owned.

### Visual acceptance additions

- Seoul and Singapore Explore use identical computed values for workspace
  frame, discovery width, interactive height, label/body/heading sizes, rule
  weights, and spacing rhythm at the same viewport.
- Seoul and Singapore Detail use identical computed values for main/rail
  geometry and identity hierarchy at the same viewport.
- No Explore page uses a marketing hero, shadowed card collection, or repeated
  layer navigation.
- Screenshot review covers both markets at 390, 720, 1440, and wide desktop
  widths before merge.

## Source-of-truth screen mapping

| Product surface | Supplied file | Required role |
| --- | --- | --- |
| Seoul Explore | `signedprice - Explore.dc.html` | Main choropleth discovery workspace |
| Explore selection | `signedprice - Map Detail Panels.dc.html` | Neighborhood/building evidence panel opened from the map |
| Seoul rankings | `signedprice - Explore v2.dc.html` | Editorial ranking, conversion curve, and evidence-table surface; not the main Explore layout |
| District detail | `signedprice - Detail View.dc.html` | District evidence page with main column and contextual rail |
| Building detail | `signedprice - Detail View.dc.html` | Building state of the same detail system |
| Route ownership | `signedprice - Detail Pages.dc.html` | Route inventory and responsibility boundaries |

No implementation may blend these roles merely because they share data.

## Visual contract

### Global composition reference

The archive is not a set of isolated page screenshots. Its typography, spacing, frames, controls, rules, and content order form one global composition system. Explore, Detail, Rankings, Check, Seoul, and Singapore may vary by task, but they must not invent competing versions of the same visual role.

The implementation establishes these shared tokens before page work:

| Role | Token contract | Reference value |
| --- | --- | --- |
| Body | `--evidence-type-body` | 15 px |
| UI text | `--evidence-type-ui` | 13 px |
| Caption/source | `--evidence-type-caption` | 12 px |
| Eyebrow/label | `--evidence-type-label` | 10 px, `0.10em` tracking |
| Section heading | `--evidence-type-section` | 19 px, `-0.03em` tracking |
| Subheading | `--evidence-type-subhead` | 25 px, `-0.03em` tracking |
| Detail identity | `--evidence-type-detail-title` | 38 px, `-0.042em` tracking |
| Detail primary metric | `--evidence-type-metric` | 40 px, tight leading |
| Page heading | `--evidence-type-page` | 42 px, tight leading |
| Editorial heading exception | `--evidence-type-editorial` | maximum 54 px |
| Space scale | `--space-1` through `--space-6` | 4, 8, 12, 16, 24, 32 px |
| Reading frame | `--evidence-reading-frame` | 760 px |
| Content frame | `--evidence-content-frame` | 1120 px |
| Workspace frame | `--evidence-workspace-frame` | 1480 px |
| Desktop gutter | `--evidence-page-gutter` | 40 px |
| Mobile gutter | `--evidence-page-gutter-mobile` | 20 px |

Shared roles are implemented once and reused:

- page/section eyebrow
- section heading row
- segmented control or view switcher
- evidence metric row
- source/caption line
- unavailable/insufficient state
- selected-evidence drawer shell

Before adding a new CSS class or component, the implementer must check whether one of these roles already exists. Page-specific CSS may position and size a shared role, but must not redefine its typography, border, active state, or spacing rhythm.

The first migration is intentionally limited to Explore and Detail. Other pages are audited and documented, but not mass-rewritten in the same PR. This avoids a site-wide visual regression while stopping new duplication immediately.

### Shared system

- Paper background, ink typography, teal structural color, and orange accent follow the archive.
- Orange is an accent or warning color. It must not become a large background treatment or the dominant page color.
- Corners remain square.
- Structural boundaries use 2 px rules; row boundaries use 1 px rules.
- Core spacing uses 4, 8, 12, 16, 24, and 32 px increments.
- Body copy defaults to 15 px. Detail page headings follow the reference scale rather than the current 52–83 px global hero scale.
- Desktop Detail headings target the supplied 42 px system value, with the editorial Rankings exception capped at its supplied 54 px maximum. The Explore toolbar is not a hero and does not use the page-heading scale.
- Inputs and buttons keep the reference density but retain a minimum interactive target of 44 px where a user must tap.
- Frames must derive from the screen template. They must not mix unrelated 1040, 1120, and 1320 px containers on one surface.

### Seoul Explore desktop

- Explore begins directly below `SiteHeader` with the compact filter toolbar and result summary from `signedprice - Explore.dc.html`. It has no independent hero, market tape, or oversized promotional heading.
- The default view is `Split`.
- The view switcher preserves `List`, `Table`, `Map`, and `Split` modes.
- The split grid is a 420 px discovery rail on the left and the remaining width as the map on the right: `minmax(0, 420px) minmax(0, 1fr)`.
- Filters, result count, scope copy, legend, and ranked area/building rows belong to the left rail.
- The map remains visible while browsing the left rail.
- Selecting a neighborhood or building opens a 420 px drawer on the right edge of the map. It is not a centered modal and not a permanent 35% right rail.
- The drawer follows `Map Detail Panels.dc.html`: identity, Street View/location hero, evidence metrics, and recent filings or neighborhood buildings according to selection type.
- Loading, unavailable, unpublished, and insufficient-evidence states retain the same geometry so the page does not jump.
- Table mode is a building-evidence table derived from the same filtered building model. It must not be replaced with a second district directory, and unavailable building attributes render as an em dash rather than invented values.

### Seoul Explore responsive behavior

- At narrow widths, filters and results become the primary sheet and the map remains the spatial context.
- A selected result opens a full-width bottom sheet rather than a shrunken desktop side drawer.
- The bottom sheet is dismissible and restores the previous map position and filters.
- No horizontal scrolling is permitted at 390 px.
- Desktop information order is preserved: controls, discovery results, spatial context, selected evidence.

### District and building detail

- Desktop uses a fluid main evidence column plus a 380 px contextual rail.
- District and building are two states of one visual system, not unrelated page templates.
- The page preserves transaction tabs, scope breadcrumb, identity, period, median, interquartile range, sample count, and recent filings.
- District state includes building comparison rows and insufficient-evidence rows.
- Building state adds area bands, physical facts, history, and any measured adjustment only when its source exists.
- News, community, and brief modules remain in their supplied rail positions. Missing data produces an honest empty/unavailable state rather than silently deleting the entire module.
- New/renewal splits appear only when the installed evidence distinguishes those contracts. No split may be synthesized from totals.
- Measurements such as orientation, slope, sunlight, walking time, or premiums appear only when an installed source and validation contract exist. Otherwise the row is explicitly unavailable.

## Data and trust contract

### Seoul surfaces

- UI work consumes the installed public evidence models. Browser fixtures must not become production data.
- Median, P25–P75, percentile, and sample count use the latest verified completed-month window, capped at 12 months.
- A short source window is displayed exactly. It is never relabeled as a full year.
- Low sample size may widen geography but must not silently widen time.
- Unsupported facts stay unavailable; they are never filled with mockup example values.

### Singapore Check markets

Singapore Check is a new native product at `/sg/singapore/check/`. It is not a redirect or a relabeled Seoul Check.

The page contains three first-class market tabs:

1. `URA private sale`
2. `HDB resale`
3. `HDB rent`

Each tab uses its native source and units:

| Market | Native filters | Primary amount | Secondary evidence |
| --- | --- | --- | --- |
| URA private sale | market segment, project, property type, district, floor-area band, contract month | Sale price in SGD | PSF, tenure, floor range, sale type, sample |
| HDB resale | town, block/street, flat type, storey range, floor-area band, resale month | Resale price in SGD | remaining lease, flat model, sample |
| HDB rent | town, block/street, flat type, approval month | Monthly rent in SGD | sample and observed range |

The engine computes only from source records inside the chosen verified window:

- median
- P25 and P75
- percentile of the entered offer within comparable records
- sample count
- exact first and last completed months used
- comparable scope and fallback level

The default window ends at the latest verified completed month and contains at most 12 months. It never expands backward because a segment is sparse.

Five comparable records are required to publish a percentile or market range. Below five, the result reports insufficient evidence and names the next valid geography or scope when one exists.

### Singapore A/B comparison

- Single-offer and A/B comparison are modes of the same Singapore Check product.
- A and B independently choose one of the three markets.
- Same-market comparison may compare market position, amount, range, and evidence strength.
- Cross-market comparison displays the native amounts and evidence side by side and returns a neutral trade-off summary.
- The product must not invent currency conversion, mortgage financing, stamp duty, lease decay, security deposits, future appreciation, or sale-to-rent equivalence.
- A cross-market comparison never declares a winner unless the user later supplies an explicit, documented decision model.

### Singapore evidence artifact

- Check receives its own server-only evidence artifact and repository contract rather than reaching through public summary UI models.
- The artifact retains only fields required for filtering and calculation and includes source identifier, source period, row count, schema version, and digest.
- URA, HDB resale, and HDB rent are validated independently. A valid URA payload must not make an invalid HDB market appear ready.
- Production and Preview fail closed on missing, stale, malformed, or digest-mismatched evidence.
- Browser tests inject deterministic Check fixtures through a Check-only path. They must not replace Explore, rankings, district, or building fixtures.

## Navigation and product ownership

- `SiteHeader` must render the links supplied by the active market shell.
- Singapore pages may not emit `/kr/seoul/*` product links.
- Seoul pages may not send primary product actions to `koreahomeguide.com`.
- The Seoul overview CTA returns to a SignedPrice Seoul route.
- Singapore `Check` navigation is exposed only when the native route and its fail-closed server loader exist.
- Language links change language for the same product surface when that counterpart exists; they do not change market.
- A route-isolation regression test renders the complete page shell for both markets and asserts that no opposite-market product links are present.

## SEO and availability

- Canonical URLs are self-referential and market-specific.
- Singapore Check remains `noindex, nofollow` until verified production evidence, correct canonical metadata, and the full browser gate pass on the production SHA.
- Empty query state, invalid query state, insufficient evidence, and valid result state have separate metadata tests.
- A conversion or unrelated market artifact cannot make Singapore Check indexable.

## Implementation boundaries

The recovery is split into independently reviewable releases:

### Release A — Explore parity

Replace the current inferred composition with the exact source mapping, preserve real Explore data and filters, and verify all four desktop view modes plus mobile selection behavior.

### Release B — Detail parity

Apply the supplied district/building visual system to existing public routes. Preserve every evidence module and explicitly gate unavailable source-dependent sections.

### Release C — route isolation

Remove KoreaHomeGuide CTAs, fix market-owned navigation, and add cross-market route regression coverage.

### Release D — Singapore Check foundation

Add the independent artifact schema, builder/installer, repository, recent-window calculations, and statistical tests without exposing the route.

### Release E — Singapore Check product

Add server route models, single/A-B modes, the three native market forms, result surfaces, metadata, and Singapore-owned navigation.

### Release F — production verification

Verify exact deployment SHA, 390 px/desktop/tablet/wide layouts, all supported submissions, metadata, canonical URLs, no cross-market links, and no client bundle import of raw evidence.

## Verification gates

Every release must pass its focused tests before the full repository gate.

Required evidence includes:

- mockup-structure component tests for column widths, drawer ownership, visual order, and view-switcher modes
- rendered screenshot comparison at the supplied desktop widths, reviewed for spacing, type scale, emphasis, and section order
- 390 px browser checks for overflow, control targets, sheet behavior, and dismissal/restoration
- district/building route tests for published, sparse, and unavailable evidence
- navigation tests that render complete Seoul and Singapore shells
- Singapore statistics tests for month boundaries, percentiles, quartiles, sparse scopes, and independent market readiness
- Singapore browser submissions for every market and representative same-market and cross-market A/B pairs
- typecheck, lint, full unit suite, production build, server/client boundary check, and full Chromium suite

No PR may merge after a test retry alone if the same timeout repeats. Repeated instability is fixed as part of the gate.

## Non-goals

- Copying example numbers from the mockups into production
- Treating `Explore v2` as the default Explore screen
- Replacing real maps with decorative panels
- Activating unsupported Seoul proximity values
- Converting Singapore sale prices into rent equivalents
- Sharing Seoul evidence registries with Singapore Check
- Adding a new external KoreaHomeGuide dependency

## Acceptance statement

The work is accepted only when the supplied mockup archive explains every major region of Explore and Detail, all displayed facts come from installed evidence or an explicit unavailable state, Singapore Check stays inside the Singapore route and data boundary, and the verified production pages contain no cross-market or KoreaHomeGuide product escape.
