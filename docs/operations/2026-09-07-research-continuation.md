# Research readability continuation — 7 September 2026

## Recovered state

Continued from `origin/main` at a8e4d8e. The old local typography branch was
preserved. GitHub confirms #185 (Tools typography) and #187 (long official facts)
are merged. The user's pasted conversation stopped before that status was clear.
This checkpoint distinguishes merged code from independently verified production.

## Cause and change

The Seoul recent-contract and Singapore monthly charts share a 720-unit SVG
viewBox with 12-unit text, `width: 100%`, and no minimum width. At a 360px
container their axis glyphs therefore scale to about 6px. This is a concrete
readability problem; it does not establish the cause of an unseen device-specific
font/encoding complaint.

- Keep the plot at least 45rem wide with 14-unit axis text inside a horizontally
  scrollable region, with a visible hint, accessible name and keyboard focus.
- Give monthly and size-comparison tables a readable minimum width inside their
  own scroll regions; raise table text, period labels and disclosure labels to
  0.875rem and explanatory paragraphs to 1rem with comfortable line height.
- Keep exact monthly figures available beneath the chart. Retain every existing
  data value, sample threshold, transaction point, currency and period selector.

## Verification

- Ten existing targeted suites passed: 82 tests spanning research calculations,
  Seoul pagination and map fallbacks, Singapore map coverage and navigation,
  Google map projection, Tools routes, and all three city Check workspaces.
- Web typecheck and ESLint for both changed TSX components passed.
- No Explore defect was reproduced by these checks, so map/data code is unchanged.
  Fixture coverage does not certify all live coordinates or map-provider access.
- Agent preview could not start: the restricted preview filesystem could not
  resolve the existing Next.js monorepo dependency, and the supervisor supplies
  Vite-specific flags. Preserve the existing Next.js architecture. No manual
  browser/mobile verification is claimed for this continuation.
- Production build passed, including all 2,760 generated static pages. No database
  migration ran because DATABASE_URL was not configured in this local environment.
- Remote review status is recorded with the change handoff. This file alone does
  not establish that the new changes are deployed.

## Next verification and product work

Visually check both chart types, scroll/keyboard behavior, table disclosure and
1Y/3Y/All selection at mobile and desktop widths. Then deepen Passport's
budget → candidate → detail → scenario path across Seoul, Singapore and Dubai.
Candidate retention/comparison follows; verified purchase support remains the
product destination. Do not start account or partner flows with invented data.
