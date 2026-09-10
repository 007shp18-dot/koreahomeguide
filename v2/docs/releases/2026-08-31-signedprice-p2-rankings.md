# signedprice P2 Seoul Rankings release evidence

## Candidate scope

- Route: `/kr/seoul/rankings/`
- Source: the existing verified P2 area-summary artifact and configured period only
- Lists: median deposit, three-month median change, middle-half spread, and qualifying sample count
- Navigation: secondary links from Explore and every district state; the four primary tabs are unchanged
- SEO containment: `noindex, follow`, no canonical or hreflang, and no sitemap entry
- KoreaHomeGuide content and URLs: unchanged

## Local candidate evidence

- Unit and server-render regression: 60 files, 725 tests passed.
- Lint and recursive TypeScript checks: passed.
- Next.js 16.3.3 production build: passed; `/kr/seoul/rankings` generated as a static route.
- Built rankings HTML: one `noindex, follow` directive, zero canonical links, zero hreflang links, four ranking sections, and 83 deterministic fixture rows (24 / 11 / 24 / 24).
- Built sitemap: zero `<loc>` entries and no Rankings URL.
- Playwright discovery: 12 cases across 1366×768, 390×844, and the 720×900 boundary.
- Local Playwright execution: blocked before navigation because the execution image has no Playwright Chromium binary. This is an environment limitation, not a passing browser result.
- Local `next start`: blocked before accepting requests because the execution image cannot enumerate network interfaces (`uv_interface_addresses`). Built-artifact verification above remains valid; served HTTP and browser behavior must be proven on the exact Vercel Preview.

## Exact-SHA Preview gate

Record before merge:

- candidate commit SHA and Vercel deployment ID;
- `/api/status` commit and Preview environment;
- four complete server-rendered live-data lists and their reconciliation counts;
- 1440px, 720px, and 390px screenshots with no horizontal overflow;
- logical keyboard order and at least 44px district links;
- zero browser console errors and zero 5xx responses;
- `noindex, follow`, no canonical/hreflang, and an empty sitemap;
- Explore and district cross-links, with exactly four primary tabs;
- GitHub checks passing on the same SHA.

Preview must use the existing verified public-summary artifact and matching period. Do not expose the artifact value, provider endpoint, service key, raw rows, cache contents, rights evidence, or share tokens.

## Production gate

Promote only the reviewed exact SHA. Re-run the Preview assertions against `https://www.signedprice.com`, confirm apex redirect behavior, verify no new runtime errors or 5xx responses, and confirm the existing KoreaHomeGuide home and Rent Check routes retain their prior canonical and hreflang contracts.
