# SignedPrice Explore V2 UI Implementation Plan

**Spec:** `docs/superpowers/specs/2026-09-02-signedprice-explore-v2-ui-design.md`

## 1. Lock the user-visible V2 contract

- [x] Add a rendering test that fails when the V2 root and filter/results/map/selection regions are missing.
- [x] Add a rendering test proving Split, List, Table, and Map expose distinct layout state while retaining URL-backed controls.
- [x] Run the focused test and observe the expected failure against the legacy composition.

## 2. Implement the V2 composition

- [x] Recompose `AreaExplorerReady` into market header, filter board, view switcher, and evidence workbench regions.
- [x] Preserve district map, evidence model, filters, complete table, and source boundary.
- [x] Make each view emphasize its intended primary content without removing accessible server-rendered evidence.
- [x] Run focused Explorer tests.

## 3. Unify building selection and URL state

- [x] Add a failing test for initial `buildingId` selection from the Explore URL.
- [x] Add a failing test for the literal URL emitted by list/marker selection.
- [x] Route both marker and list selection through one state-and-URL update function.
- [x] Clear invalid building IDs without fabricating a selection.
- [x] Run selection and Explorer state tests.

## 4. Replace legacy styling with the V2 visual system

- [x] Build the square editorial layout with single-owner borders and readable typography.
- [x] Add materially distinct desktop grids for Split, List, Table, and Map.
- [x] Add 390px-safe mobile rules, bounded map height, local table scrolling, and touch target sizing.
- [x] Keep News and Community surfaces untouched.
- [x] Run CSS/UI contract tests.

## 5. Verify the complete Korea Explore flow

- [x] Run all Explorer, map, URL-state, and public-market tests.
- [x] Run the full workspace test suite, typecheck, lint, and production build.
- [ ] Start the production build locally and verify desktop plus 390x844 in a real browser.
- [ ] Check Split/List/Table/Map, transaction filters, marker/list selection, Search this area, and selected detail.
- [ ] Request code review, resolve findings, and rerun affected verification.
- [ ] Push the branch and create a PR only after the verified UI is present in the exact commit.
