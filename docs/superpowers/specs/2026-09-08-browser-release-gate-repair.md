# SignedPrice browser release gate repair specification

## Outcome

The pending market-layout and bilingual-copy release may ship only after the deterministic Playwright release gate passes on `desktop-chromium`, `mobile-chromium`, `tablet-chromium`, and `wide-chromium` with zero failures.

## Diagnosis accepted for this repair

- Candidate CI reported 146 failures, but they collapse to 28 source-test locations. The same assertions repeat across viewports.
- 132 failures already occur on the current `main`; 14 more are stale expectations caused by the approved asking-price and bilingual copy changes.
- A hidden desktop header is intentionally replaced by the disclosure menu at widths up to 720px. Browser tests must exercise the visible navigation instead of querying hidden desktop controls.
- Home market cards intentionally expose two decisions: explore reported prices and compare an asking price. Tests must distinguish those actions rather than assuming one link per card.
- English, Korean, and independently reviewed Chinese pages must emit reciprocal language alternates. Korean pages must use the Korean OG image by default.
- The approved current UI terms include `Compare an asking price`, `Property details`, `Asking sale price`, `Asking deposit`, `Asking monthly rent`, and Singapore `Data available`.

## Constraints

- Do not change market data, calculations, route destinations, indexing decisions, or publication thresholds merely to satisfy a test.
- Do not weaken assertions to generic visibility when a stable user-visible behavior, URL, semantic region, or data value can be asserted.
- Treat Next.js streamed fallback duplication as a test-synchronization concern: wait for the streamed replacement or select the visible instance.
- Treat metadata mismatches as product defects and cover them with direct metadata tests before changing production code.
- Snapshot updates require visual inspection of the current intended page, not blind acceptance.
- Preserve the existing site tone, page hierarchy, spacing system, and regional layout unification already approved in the parent release.

## Verification contract

- Focused tests for each repaired family pass before its task is complete.
- `pnpm --dir v2 test`, `pnpm --dir v2 typecheck`, `pnpm --dir v2 lint`, and the production build pass.
- The exact release command `pnpm --dir v2 e2e --project=desktop-chromium --project=mobile-chromium --project=tablet-chromium --project=wide-chromium` finishes with zero failures.
- The uploaded GitHub tree matches the locally verified tree, PR checks are green, and the production deployment is verified after merge.
