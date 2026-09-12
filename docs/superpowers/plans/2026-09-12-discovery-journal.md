# Discovery Journal Implementation Plan

> **For agentic workers:** Execute inline with superpowers:executing-plans. Sites
> lifecycle ownership requires the owning agent to edit the checkout; use a
> read-only reviewer for the completed branch.

**Goal:** Let visitors resume exploration, keep candidate notes, and move between regional reading and evidence.

**Architecture:** A bounded browser journal uses the existing external-store
pattern. Pure validation and mutations are separate from small client components.
Static editorial navigation connects existing routes without runtime content queries.

**Tech Stack:** Existing Next.js, React, TypeScript, CSS Modules, Vitest and Playwright.

**Spec:** `docs/superpowers/specs/2026-09-12-discovery-journal.md`

## Global Constraints

- No homepage change, new network service, database query, polling, SDK or dependency.
- English, Korean and Simplified Chinese. City order Seoul, Singapore, Dubai, Tokyo.
- Recent maximum 12, shown maximum 3 per current city. Notes maximum 120, each 1,000 characters.
- Safe internal Explore links only; remove private/non-Explore context. Disable speculative link prefetch.
- Minimum text 12px, controls 44px, input text 16px; existing semantic tokens.

### Task 1: Local journal and controls

**Files:** Create `lib/discovery/journal.ts`, `components/discovery/recent-places.tsx`,
`components/discovery/research-note.tsx`, `components/discovery/discovery.module.css`,
`test/discovery-journal.test.ts` beneath `v2/apps/web`.

**Interfaces:**
```ts
type DiscoveryMarket = 'seoul' | 'singapore' | 'dubai' | 'tokyo';
type RecentPlace = { market: DiscoveryMarket; key: string; name: string; href: string; viewedAt: string };
type PlaceNote = { market: DiscoveryMarket; key: string; text: string };
type DiscoveryJournal = { version: 1; recent: RecentPlace[]; notes: PlaceNote[] };
// journal.ts: parseJournal, normalizeExploreHref, withRecentPlace, withPlaceNote,
// readJournal, subscribeJournal, writeJournal; mutations always use the latest state.
// <RecentPlaces market? locale />; <RecordPlaceVisit place />;
// <ResearchNote market placeKey placeName locale />.
```

- [x] Write failing behavior tests for malformed state, bounded/deduplicated visits,
  cross-city URL rejection and private parameter removal, notes that survive visit
  updates, explicit deletion, and blocked-storage fallback.
- [x] Run `node node_modules/vitest/vitest.mjs run apps/web/test/discovery-journal.test.ts` from `v2`.
- [x] Implement the pure journal operations, bounded parsing and external store.
  Store only successful local changes; blocked persistence uses a page-session
  fallback with visible feedback. Listen for same-tab custom and browser storage events.
- [x] Implement collapsed notes with explicit save/delete, visible status and a
  labelled textarea. Render recent links only with valid history, excluding a currently
  viewed place where supplied. Clearing history preserves notes and saved lists.
- [x] Run the focused test and lint/type checks for these files.

### Task 2: Existing saved and Explore integration

**Files:** Modify `components/global-shortlist/saved-cities.tsx`,
`components/global-shortlist/budget-search.tsx`, `components/seoul-shortlist/shortlist.tsx`,
the four existing Explore components and their building/project/area detail components.

**Interfaces:** Consume Task 1 controls; existing saved keys remain unchanged.

- [x] Add `<ResearchNote market={place.market} placeKey={place.key}
  placeName={place.name} locale={locale} />` below each Saved link, outside the link.
  Add the same control to city saved-result cards, including unavailable saved records.
- [x] Add `<RecentPlaces market={city} locale={locale} />` beneath existing Explore
  primary controls and on Saved. Track valid explicit selections and ready detail
  visits with stable entity keys and already-built public evidence/selection hrefs.
- [x] Preserve all existing filter and comparison state; history changes must not
  alter price-data request keys or trigger provider calls.
- [x] Verify existing saved tests and add actual browser coverage for note
  save/reload/delete and recent selection/return/clear without new requests.

### Task 3: Existing regional reading connections

**Files:** Create `lib/discovery/reading.ts` and
`components/discovery/discovery-reading.tsx`; integrate in Explore/detail and
`components/newsroom/neighbourhood-story.tsx`.

**Interfaces:** Static market/area mapping to existing localized article and Explore
routes; minimal strings and existing thumbnail paths, not whole articles, in client bundles.

- [x] Inspect the existing neighbourhood and city-journey route catalog. Create
  explicit exact-area links only for verified identities; use labelled city guides otherwise.
- [x] Add compact reading links below primary Explore/detail information. Chinese
  routes use existing Chinese destinations, with no fabricated translated articles.
- [x] Change each mapped neighbourhood story's Explore link to its correct area
  scope. Preserve existing article layout and homepage uses of shared story cards.
- [x] Test locale links, explicit scope, unknown-area fallback and zero runtime fetching.

### Task 4: Verification and existing-provider delivery

- [x] Run focused journal, saved, Explore and editorial tests, TypeScript and lint.
- [x] Review the full diff against the spec. Resolve functional/visual findings.
- [ ] Push a reviewable PR with expected base/head, run required CI and Vercel preview.
- [ ] Verify mobile and desktop exploration, notes, history and article links.
- [ ] Merge with required gates passing, wait for production READY, verify live routes.

## Execution notes

2026-09-12: Existing isolated checkout reused. Base `dee2248b` includes PR 328 news
changes, which remain untouched. User's affirmative authorizes the concrete first
phase described in the preceding response; later community/notification phases are separate.

Local verification: 15 focused files / 146 tests pass; TypeScript and changed-file
ESLint pass. Independent review approved after preserving Seoul building/contract
filters and using explicit document navigation for saved recent selections.
Hosted browser checks and production delivery are the remaining gates.
