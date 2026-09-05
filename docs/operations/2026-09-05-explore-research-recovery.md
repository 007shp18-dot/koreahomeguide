# Explore and investment research recovery

## Authorized scope

Repair Explore and regressions, then continue the approved overseas residential research design across Home, Markets and Guides. Keep Seoul and Singapore first. Check global references before editorial or visual work. Do not introduce fabricated price, rental yield, photo or location evidence.

## Reproduced product defects

- NAVER without configuration or after a loading error renders a loading promise indefinitely. Render an unavailable state and direct people to the list.
- Production Jongno Explore contained 50 buildings, all in a closed location/price verification disclosure, with an empty primary list. Open this disclosure by default when no individual map buildings are available. Do not manufacture map coordinates.

Both cases have focused render regressions. These checks do not replace browser verification.

## CI run 33974952237

82 failed, 321 passed, 21 skipped. Failure instances include viewport repetitions, not 82 distinct product defects.

| Suite | Failure instances | Evidence / next validation |
| --- | ---: | --- |
| area-explore | 14 | Removed SVG selectors, old disclosure controls, hidden legend; current NAVER/list journey needs browser coverage |
| korea-detail | 8 | Old selection link and 280 px rail contract vs current 300 px rail; inspect narrow layouts |
| korea-guide | 4 | Legacy guide index redirects to global Guides; test still expects the former navigation |
| newsroom | 2 | CSS minification serializes 0.875rem as .875rem; compare the numeric value |
| rankings | 12 | Default tab, labels, navigation and row eligibility assertions disagree with current rendered UI; audit fixture semantics before changing expected counts |
| rent-check | 1 | Control is 52 px vs expected 48 px; verify the current design contract |
| singapore | 4 | Explore rail comparison assumes the removed Seoul SVG; does not test Singapore project numeric containment |
| visible-foundation | 21 | Old home/news titles, navigation markers and unverified 404 expectations; inspect routing and mobile layout |
| editorial-growth-review | 16 | Missing screenshot baselines; downloaded diagnostics must be reviewed before accepting images |

Do not classify all failures as pre-existing or all passing Singapore tests as proof that a conditionally skipped project assertion ran. Check skip results explicitly.

## Verification environment

Local Chromium installation failed with CDN 502 and repeated timeouts. Production interaction is available through the connected cloud browser. GitHub Actions has a working Chromium installation. Full CI is still a required follow-up; no failing test is disabled here.

## Global references checked

- Savills international residential research: https://www.savills.com/insight-and-opinion/research.aspx?f=date&p=International-Residential-Property&page=1&q=&rc=World&t=
- PropertyGuru condominium directory: https://www.propertyguru.com.sg/condo-directory
- JLL Hong Kong residential market dynamics: https://www.jll.com/en-hk/insights/market-dynamics/hong-kong-residential

Use market/date/source hierarchy, building identity and comparative charts as references. Write original copy around concrete investor questions. Review full reference pages and layouts before implementing the next editorial surfaces; search excerpts alone are not visual validation.

## Remaining implementation sequence

1. Verify and release the two reproduced Explore defects.
2. Replace stale browser assumptions with current navigation and data contracts, fix actual routing/layout failures, review screenshot baselines, and obtain a fresh complete CI result.
3. Home and Markets: overseas residential research positioning, usable market entry points and distinct availability states.
4. Guides: market entry, buying eligibility, cost categories and research process, with dated official sources and appropriate visual explanations.
5. Verify Seoul/Singapore navigation and detail return state across desktop/mobile; preview, PR, production checks.

Database/photo work remains read-only until its operating branch and existing source connections are verified. Do not create a replacement database.
