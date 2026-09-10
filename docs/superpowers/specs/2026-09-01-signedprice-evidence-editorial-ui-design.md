# SignedPrice Evidence Editorial UI Design

## Decision and authority

The user approved direction C, **Evidence Editorial**, on 2026-09-01. This document extends `2026-09-01-signedprice-integrated-refresh-design.md`; it does not replace its evidence, rights, data-minimum, calculation, localization, or release-safety rules.

The redesign covers the complete public SignedPrice journey: global home, market entry, Check, Explore, Rankings, district detail, building detail, News/Market Briefs, Guide, Singapore public pages, trust/legal states, and shared header/footer. It is a presentation and navigation redesign. Existing verified calculations and repositories remain authoritative.

## Product position

SignedPrice is a global property decision platform, not a listing portal and not an institutional terminal. The interface combines:

- search-first clarity from Rightmove and consumer property portals;
- market context from Redfin and Bayut market analysis;
- evidence discipline from MSCI and JLL research products;
- editorial rhythm from the Financial Times.

The experience becomes progressively denser: simple decision entry on the homepage, market context on Explore and Rankings, and auditable evidence on district/building detail.

## Global interface system

### Navigation

The desktop header contains the official SignedPrice wordmark, four primary destinations, and one market/language control:

1. Check → `/kr/seoul/check/`
2. Explore → `/kr/seoul/explore/`
3. Briefs → `/kr/seoul/news/`
4. Guide → `/kr/seoul/guide/`
5. Market/language control → current market label; it does not advertise unavailable routes.

The wordmark always links to `/`. Rankings is reached from Explore and market evidence rather than occupying a fifth primary-navigation slot. On narrow screens, the four destinations remain keyboard-accessible and wrap or collapse without removing the current page indicator.

### Typography

- Archivo remains the only required application font and the official wordmark font.
- The wordmark retains its supplied weight contrast. Product headings use restrained weights and tighter letter spacing; body text uses regular weight and a readable measure.
- A page has one dominant heading. Section headings are materially smaller than the page heading.
- Tabular figures are limited to evidence values; editorial prose does not inherit tabular numerals.

### Geometry and spacing

- Square geometry, no decorative shadow, zero radius.
- One-pixel dividers organize dense rows; two-pixel rules are reserved for major structural boundaries.
- Pages use one shared maximum content width and consistent horizontal gutters.
- Sections alternate canvas, strong surface, and deep-green evidence surfaces to create rhythm without filler cards.
- Cards are used only for true peer choices or evidence units. Empty space is filled by useful navigation, verified data, or editorial content—not ornamental metrics.

### Color

The approved warm-paper/deep-green/orange tokens from the integrated refresh remain binding. Orange is reserved for selection, action, and evidence emphasis. Large dark surfaces use paper text. No page introduces a new local brand palette.

### Imagery

- A rights-cleared building or neighborhood image may appear only in the homepage hero or building detail lead media.
- When rights-cleared imagery is absent, the product renders an intentional map/evidence composition, never a generic stock photo or fake building image.
- Repeated article or product cards do not each require photography.

## Homepage composition

The homepage follows this exact order.

### 1. Decision hero

- Permanent Seoul / Singapore / Dubai selector.
- Compact evidence eyebrow and one H1: `See what homes actually signed for.`
- One paragraph that covers rent, buy, and invest.
- Rent / Buy / Invest decision switch.
- The available Rent path exposes real Check and Explore actions.
- Buy and Invest remain visible but are explicitly staged until their evidence connections pass. They do not become fake search paths.
- A right-side evidence visual uses the verified Seoul period and all/new/renewal counts. Singapore and Dubai render their existing readiness/rights states.

### 2. Live evidence strip

For Seoul, show all eligible, new, renewal, unknown, and completed period from `SeoulLiveModel`. Never hard-code those values in JSX. Unavailable state keeps the routes accessible and states that figures were not substituted.

### 3. Decision paths

Three equal decision paths explain Rent, Buy, and Invest. Rent is active. Buy and Invest describe the planned evidence model and link only to a real existing market/intention route whose limitations are visible.

### 4. Explore preview

A map-dominant preview links to Explore and shows how city → district → building depth works. It uses only existing district/building artifact values. If the artifact is unavailable, it shows the required title/reason/action empty state.

### 5. Market Brief ledger

The editorial section uses the label `Market Briefs` and presents Seoul, Singapore, and Dubai as three market lanes. It does not invent daily articles. Existing published content is shown in its actual market lane; a market with no approved brief shows `No approved brief yet` and the human-approval boundary. The intended operating cadence—three English briefs per market per day—may be described as an operating target, not as published inventory.

### 6. Trust boundary

A compact deep-green statement closes the page: official sources, rights disclosure, human-approved briefs, visible methods. The current large principles and trust sections are consolidated so trust is clear without making the homepage feel unfinished.

## Detail-page system

### Shared product intro

Check, Rankings, News/Briefs, Guide, district detail, and building detail share a compact product intro grammar:

- market and product eyebrow;
- one H1;
- one short deck;
- current evidence period/status when available;
- primary next action placed adjacent to the intro, not isolated in a large hero.

### Check

The two-offer calculator remains canonical and immediate. The redesign reduces form chrome, strengthens the result sentence, separates editable assumptions from evidence, and keeps the curve and calculation trace readable on mobile. No calculation or parsing semantics change.

### Explore

Explore becomes map-first on desktop and map plus bottom-flow on mobile. The desktop workspace targets approximately 62/38 map-to-rail proportion. District, neighborhood, and building discovery are visually one flow. A real text filter is added for the retained building artifact and may initialize from a `q` query parameter from the homepage. Filtering never creates or estimates buildings.

### Rankings

Rankings uses the existing four verified views but presents one primary ranking at a time with a compact view selector, clear signed axis, and direct value labels. The default view shows the most decision-useful evidence. All 25 rows remain accessible without horizontal compression.

### District detail

District pages follow summary → distribution → New/Renewal/All comparison → buildings → source order. The shared box plot remains authoritative. Coverage and limitations are compact metadata, not competing hero cards.

### Building detail

The implemented decision-detail shell remains the behavioral foundation. It is aligned to the new shared intro, media fallback, typography, spacing, and source-treatment system. Rent, Buy, and Invest remain visible; unavailable modes disclose why and never borrow Rent evidence. Evidence tables, cohort comparison, floor absence, and source rights retain their current semantics.

### Market Briefs and News

The stable route remains `/kr/seoul/news/`; navigation labels it `Briefs`. The index becomes an editorial ledger rather than a generic card grid. Detail pages prioritize headline, market/date/status line, concise summary, evidence list, then source and correction boundary. Existing methodology articles remain accurately labelled; they are not relabelled as daily market briefs.

### Guide

The Guide index becomes a compact decision library organized by Rent, Buy, Invest, and Method. Only real documents render as links. Guide detail pages use a narrow editorial reading column with a persistent product next step.

### Singapore and Dubai

Singapore pages consume the same shell and editorial/evidence geometry while preserving URA snapshot rights and readiness gates. Dubai remains visible on the homepage and generic market page but gets no public data or detail routes before written clearance.

## Responsive and accessibility requirements

- No horizontal page overflow at 360, 390, 720, 1024, or 1440 CSS pixels.
- Interactive targets are at least 44 CSS pixels on coarse pointers.
- Header, city tabs, decision tabs, cohort tabs, ranking controls, and building filters retain keyboard access and visible focus.
- Visual order matches DOM order.
- Map failure never removes the building rail or page navigation.
- Every page has one H1; landmark and accessible-name tests remain green.
- Motion is limited to state changes and honors `prefers-reduced-motion`.

## Non-goals

- No new listing marketplace, agent marketplace, account system, or saved-home feature.
- No invented market index, price estimate, prediction, ROI, yield, or daily article.
- No new external UI, chart, map, or image dependency.
- No production promotion before exact-SHA Preview review and explicit user approval.

## Release acceptance

The redesign is accepted only when targeted tests, full Vitest, typecheck, lint, production build, client-boundary scans, desktop/mobile browser checks, and Preview route checks pass. The reviewed Preview must cover home, Check, Explore, Rankings, one district, one building, News index/detail, Guide index/detail, and Singapore ready/unavailable behavior.
