# signedprice UI Development Direction

**Date:** 2026-08-29

**Status:** Approved working direction

**Applies to:** signedprice V2 public web, decision tools, market intelligence, future account and partner surfaces

## 1. Product thesis

signedprice is a global property decision platform, not a listings portal with market statistics added as decoration.

The interface must help a user answer, in order:

1. Which market fits my situation?
2. Is this asking price or contract term supported by evidence?
3. What local rules, costs, and eligibility constraints apply?
4. What should I compare, save, verify, or do next?
5. When a regulated service is needed, which verified party can fulfil it?

The visual product direction is **Editorial Market Intelligence + Decision Workspace**:

- Editorial pages explain markets, sources, rules, and limitations clearly.
- Workspace pages support maps, filters, checks, comparisons, and scenarios.
- Marketplace surfaces remain visually and methodologically separate from official evidence.
- The interface becomes denser only when the user moves from reading to active analysis.

## 2. Responsibility split

### Claude owns UI/UX direction

Claude is the primary source for:

- information hierarchy and page composition;
- wireframes, high-fidelity mockups, and responsive layouts;
- component appearance, spacing, typography, and interaction states;
- visual design tokens and icon direction;
- intended motion and transition behavior;
- desktop, tablet, and mobile reference screens; and
- visual QA comments against a Preview.

### Codex owns production implementation

Codex is responsible for:

- translating the approved design into the actual repository architecture;
- validating feasibility against the current DOM, data contracts, rights policies, and route model;
- implementing components, application logic, data adapters, tests, CI, and deployment configuration;
- preserving accessibility, performance, security, privacy, SEO, and legacy migration contracts;
- producing a browser-verifiable Preview;
- distinguishing local changes, GitHub state, Preview, and Production state; and
- refusing unsupported figures, claims, datasets, services, or marketplace states.

Codex does not independently redesign approved UI while implementing it. If a Claude design conflicts with a product, rights, accessibility, or technical contract, Codex records the conflict and proposes the smallest safe adjustment for approval.

### User owns final approval

The user approves:

- design direction and major visual changes;
- scope and implementation priority;
- Preview acceptance;
- GitHub merge;
- Production promotion;
- domain, redirect, and SEO migration actions; and
- activation of accounts, enquiries, partners, or regulated services.

## 3. UI handoff contract

A Claude UI handoff should contain the following before implementation begins.

| Required item | Minimum content |
| --- | --- |
| Route and goal | Exact route, primary user, primary decision, success action |
| Reference screens | Desktop `1440px`, compact desktop `1366×768`, mobile `390×844` |
| Component states | Default, hover, focus, active, selected, loading, empty, error, unavailable, rights blocked |
| Layout rules | Grid, max width, spacing, sticky behavior, overflow, stacking order |
| Content | Final or clearly marked draft copy; no lorem ipsum in implementation handoff |
| Data mapping | Which displayed field comes from which model or capability |
| Interaction | Click, keyboard, escape, focus return, scroll, map, drawer/modal behavior |
| Accessibility | Heading order, accessible names, focus order, contrast-sensitive treatments |
| Responsive behavior | What reflows, hides, becomes scrollable, or changes interaction pattern |
| Assets | Source logo/icon/image files with usage and license information |

Preferred delivery package:

```text
docs/ui-handoffs/{feature}/
├─ README.md
├─ desktop.png
├─ compact-desktop.png
├─ mobile.png
├─ states.png
├─ tokens.md
└─ assets/
```

Figma, Claude artifacts, ZIPs, HTML, and CSS may be used as design references. Generated CSS or component code is never pasted blindly. Codex maps the intent to the real component tree, removes incompatible global rules, and protects existing tests and product contracts.

## 4. Information architecture

### Global discovery layer

- `/` — global value proposition, market selection, Rent/Buy/Invest entry
- `/compare/` — compatible cross-market comparison
- market overviews — source posture, local rules, product depth, limitations

### Market decision layer

- `/{country}/{city}/rent/`
- `/{country}/{city}/buy/`
- `/{country}/{city}/invest/`

These routes explain the decision workflow and lead into the deepest capability legally and technically available in that market.

### Analysis workspace layer

- Explorer: geographic and property discovery
- Check: quote or transaction-position verification
- Compare: area, property, and scenario comparison
- Scenario: initial cash, recurring cost, ownership cost, and yield assumptions

### Lifecycle layer

- Saved decisions and alerts
- Transaction checklist and document guidance
- Verified partner connection
- Move-in, ownership, rental management, sale, and reinvestment

Unbuilt layers remain absent or explicitly unavailable. They are not rendered as active navigation merely to make the platform look larger.

## 5. Visual system

### Default concept: Claude Modernist

The default visual language for the entire signedprice site is Claude's Modernist concept. The current reference package is `signedprice-ui.zip`, containing global home, comparison, Buy or Rent, mobile, building Rent/Buy, neighborhood, and map mockups plus design tokens.

The concept extends the existing product language rather than introducing an unrelated theme: strong typographic hierarchy, white and soft-neutral surfaces, restrained cobalt actions, thin structural lines, compact evidence panels, and minimal decoration. Future UI handoffs should remain visually compatible with this reference unless the user explicitly approves a new direction.

The package is a static design reference, not production logic. Interactive controls shown as drawings must be implemented and tested, mockup figures must be mapped to verified data contracts, unavailable SignedValue fields must remain empty or blocked, and global CSS must be adapted to the V2 component boundary rather than pasted verbatim.

### Personality

- trustworthy without looking governmental;
- global without using generic travel imagery;
- analytical without becoming a professional trading terminal;
- premium through typography and restraint, not decoration; and
- direct about missing, limited, stale, or rights-blocked data.

### Core palette

| Token | Role | Current value |
| --- | --- | --- |
| Ink | Primary text and strong structure | `#0f172a` |
| Canvas | Warm editorial background | `#f7f3ea` |
| Surface | Cards and working panels | white or approved warm surface |
| Accent | Primary action and focus | `#2563eb` |
| Accent light | Secondary emphasis | `#60a5fa` |
| Muted | Supporting text with AA contrast | implementation token, contrast-tested |
| Available | Verified/available state only | restrained lime/green |
| Limited | Partial capability or evidence | amber family |
| Blocked | Rights or availability block | red/earth family |

Status must never be communicated by color alone. Every status includes explicit text.

### Typography and shape

- Geist is the default product typeface.
- Headlines are concise and editorial, not oversized marketing statements.
- Body copy prioritizes readable measures and clear hierarchy.
- Default radii are square-to-soft, approximately `8–12px`.
- Borders are thin and structural.
- Pills are reserved for compact status or filter values, not general layout.
- Focus indicators must meet non-text contrast requirements on every adjacent surface.

### Density model

| Surface | Density | Purpose |
| --- | --- | --- |
| Global home | Low | Orient and select a market or intent |
| Market overview | Medium | Explain evidence, rules, and limitations |
| Explorer/Check | High but organized | Perform active analysis |
| Comparison | Medium-high | Inspect exact mappings and differences |
| Marketplace | Medium | Evaluate an advertised opportunity with trust labels |

## 6. Page composition rules

### Global home

The first viewport contains the lowercase wordmark, the core headline, the three user intents, and visible entry into all three initial markets. It does not use fake dashboards, stock-property photography, or unsupported transaction totals.

### Market overview

Use this order:

1. market identity and current product depth;
2. what evidence is available;
3. what decisions the product can support;
4. known limitations and rights blocks;
5. local rules and cost categories;
6. next available action; and
7. source and methodology disclosure state.

### Explorer and decision tools

- Keep user-selected market, area, property, and intent stable.
- Viewport movement must not silently change the discovery rail.
- Explicit actions such as `Search this area` control scope changes.
- Comparison methodology remains consistent across map labels, cards, details, and checks.
- Details use modal/sheet patterns when the user must preserve map context.
- Desktop emphasizes simultaneous context; mobile emphasizes a single clear task per layer.

### Comparison

- Preserve native currency, billing period, and area basis before conversion.
- Show conversion dates and assumptions.
- Do not compare incompatible area bases as equivalent.
- Missing costs remain unknown or excluded, never zero.
- HDB and private residential data remain separate.

### Marketplace and partner surfaces

Official evidence, partner listing, developer price, estimate, market index, and sponsored content use distinct labels and treatments. Sponsorship cannot modify official-data rank or methodology.

No enquiry UI is activated before license, consent, privacy, partner, complaint, and operating gates pass.

## 7. Responsive strategy

Design mobile as a prioritized workflow, not a shrunken desktop page.

- Global and market pages collapse to one readable column.
- Comparison tables retain key labels and use deliberate horizontal scrolling when necessary.
- Explorer becomes map plus sheet with explicit state preservation.
- Primary controls meet minimum touch-target and spacing requirements.
- Important evidence, dates, source labels, and blocked states are never hidden merely to fit width.
- Mobile browser tests cover overflow, focus order, touch targets, modal/sheet behavior, and back-navigation state.

## 8. Accessibility and trust gates

Every UI implementation must verify:

- semantic landmarks and one clear page heading;
- keyboard reachability and visible focus;
- escape and focus restoration for overlays;
- text contrast of at least WCAG AA and authored focus/non-text contrast;
- accessible names independent of icons;
- reduced-motion behavior;
- no status communicated only through color;
- source, limitation, and rights language near the relevant claim; and
- no personal-data collection before an approved consent flow exists.

## 9. Claude-to-Codex workflow

1. **Brief:** User selects the next roadmap slice and desired outcome.
2. **Claude design:** Claude produces the required handoff package.
3. **User approval:** User approves the UI direction or requests revisions.
4. **Codex normalization:** Codex maps the handoff to routes, components, data contracts, and testable states.
5. **Conflict gate:** Codex reports any accessibility, rights, data, SEO, or architecture conflicts before implementation.
6. **Implementation:** Codex develops with test-first contracts and isolated commits.
7. **Independent review:** Critical and Important defects are resolved before Preview.
8. **Preview verification:** Desktop and mobile browser checks compare the implementation to the approved Claude references.
9. **User acceptance:** User approves visible behavior and visual fidelity.
10. **Release:** Merge and Production actions occur only after explicit approval.

## 10. Definition of done for a UI slice

A UI slice is complete only when:

- an approved Claude handoff exists;
- every visible state is mapped to real data or an explicit unavailable state;
- desktop and mobile implementations match the approved hierarchy;
- accessibility, metadata, rights, and privacy gates pass;
- unit, build, route, and browser tests pass;
- Critical and Important review findings are zero;
- Preview is verified with the exact candidate commit; and
- the user approves the visible Preview.

“Implemented locally,” “pushed to GitHub,” “Preview READY,” and “Production live” remain separate statuses.
