# Phase 0 final-fix report

## Commit

- Implementation: `80dc82f` (`test: close Phase 0 legacy contract findings`)
- Scope: local branch `codex/signedprice-v2-1-phase0`; no push, merge, deploy, or Production mutation

## Delivered

- Normalized the current `4acbcca` Production browser evidence with actual Rent Check district control `11590`, captured 10,000 ms URL stability, current geometry, and finite numeric validation.
- Added one shared browser schema/normalizer for the Playwright producer and offline gate. Non-Production targets require a separate evidence path, and failed runs write no canonical evidence.
- Added the approved descriptor `Real prices. Better property decisions.` to source, artifact, tests, plan, and operations documentation.
- Added per-file SHA-256 provenance to all 11 API contracts and to the Korea calculation fixture for `deposit-conversion.js` and `lib/rent-check-core.cjs`.
- Added a deterministic manifest for all 23 known failures by test file and stable title. The CLI runs the direct `tests/*.test.cjs` suite without recursion; `verifyPhase0(rootDir)` remains pure unless `{ suiteEvidence }` is supplied.
- Repaired the Playwright lockfile's missing optional `fsevents@2.3.2` entry so `npm ci` is reproducible with the current npm.

## Principal files

- Browser: `scripts/v2-migration/browser-baseline-schema.cjs`, `tests/e2e/legacy-production-baseline.spec.ts`, `artifacts/v2-migration/legacy-browser-baseline.json`
- Provenance: `scripts/v2-migration/collect-api-contracts.cjs`, `artifacts/v2-migration/legacy-api-contracts.json`, `artifacts/v2-migration/korea-calculation-fixtures.json`
- Failure identity/gate: `scripts/v2-migration/legacy-test-contract.cjs`, `scripts/v2-migration/verify-phase-0.cjs`, `artifacts/v2-migration/legacy-test-failures.json`
- Brand/docs/tests: `scripts/v2-migration/brand-contract.cjs`, `artifacts/v2-migration/signedprice-brand-contract.json`, Phase 0 migration tests, and the two operations documents

## Verification evidence

- TDD red run: 6 expected failures covering missing descriptor, missing source digests, replacement-failure acceptance, missing shared browser schema, and uncaught source drift.
- `npm ci`: PASS; 28 packages installed from the repaired lockfile.
- Focused Phase 0 command: PASS, 18/18 tests.
- `npx playwright test --list -c playwright.legacy.config.ts`: PASS; one producer test discovered and TypeScript loaded.
- Invalid-base safety check: expected exit 1 with `LEGACY_EVIDENCE_PATH is required`; canonical artifact SHA-256 remained `507a835633f62cf16ad5dc8750aebae8ae665fc7636399af2c93d86022a767ac`.
- `node scripts/v2-migration/verify-phase-0.cjs`: PASS with `ok:true`, `890` tests, `867` pass, and the exact `23` known failures.
- Direct `node --test tests/*.test.cjs`: expected exit 1; independently classified as `890/867/23`, with all 23 file/title identities exactly matching the manifest.
- `git diff --check` and staged diff check: PASS.

## Residual risks

- The approved 23 legacy SEO/currency failures intentionally remain; the new gate prevents replacement or expansion but does not fix them.
- Current browser evidence is the controller-provided read-only cloud Chrome capture from approximately 16:32–16:34 UTC. The local Playwright producer was compiled/discovered and its invalid-target safety was exercised, but a local Chromium replay against Production was not performed.
