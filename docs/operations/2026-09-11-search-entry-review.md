# Search-entry review

## Search Console evidence supplied by owner

Two exports dated 2026-09-11: the 24-hour chart contains 63 impressions and one click (1.59% CTR); the last-three-months export contains daily rows from August 30 through September 8, 106 impressions and one click. Do not add the two exports or sum page impressions as property impressions. The hourly export is local UTC+09:00 and provisional; daily exports use Search Console's day boundaries.

The Korean seoul-59sqm-under-700-million-2026 article has 28 impressions, one click and position 7.57 in the 24-hour export. The only disclosed clicked query is 벽산5단지, one impression and position 32. Query and page tables are separate; this is not a proven query-page join. The disclosed query table covers only five impressions, so it cannot explain all 63. This small sample does not establish demand or a successful content format.

## Implemented editorial changes

- EN and KO chart titles now state the actual 55–65 sqm screen, consistent with the already corrected main titles.
- KO explicitly warns that building detail defaults do not reproduce the historical article cohort.
- Both editions add two focused reader questions: interpreting groups below a KRW 500m median, and reconciling detail-page prices with the article. They are additions to the existing article, not two new columns.
- Stable URLs, original publication date, data release, transaction values and building links are retained. Only editorial modified dates change.

## Evidence boundary

The retained aggregate audit is docs/operations/2026-09-08-seoul-59sqm-under-700m-evidence.json. It records 17 groups, 112 eligible sales, 110 at/below KRW 700m, and five groups/31 sales with medians at/below KRW 500m. The latter is not a count of contracts all below KRW 500m. Record ranges support 59.9 sqm for 거성푸르뫼2 and 62.22 sqm for 신동아아파트1. Added tests reconcile this aggregate snapshot and match the 17 links to the installed building inventory. This does not independently recalculate raw medians. The referenced source CSV was not found in this checkout, so no raw-source or current-price verification is claimed.

## URL review

Existing code uses HTTPS www canonicals. Filtered Seoul Explore routes retain the base canonical and noindex/follow. News filters strip unsupported building/tracking parameters while retaining supported market/type selection. The old /kr/seoul/news/ route already permanently redirects to /news/?market=seoul. No broad redirects or indexing-policy changes were needed. Tests guard the news canonical and legacy redirect behavior. HTTP host redirects and production-rendered metadata still require a successful live check; the local transport failed during this review.

## Small follow-up content experiments (not published)

1. KO: 서울 5억원 이하 아파트 실거래, 중앙값과 개별 계약을 구분하는 법. EN: Seoul apartments below KRW 500m: group medians versus individual sales. Before creating a separate article, recover the dated raw snapshot and validate individual contracts, identity and cancellations. Avoid duplicating the existing shortlist.
2. KO: 같은 아파트인데 실거래 중앙값이 다른 이유. EN: Why the same apartment can have different transaction medians. Build a reproducible period/area comparison from source rows, disclosing sample sizes and corrections. Do not invent a fresh market movement.

Until those prerequisites are met, the two Q&A additions answer the questions in the existing article. No community changes, mass content publication, indexing requests or paid services are included.

## Verification

Regression tests added in apps/web/test/search-entry-evidence.test.ts. Local file/command transport closed before test execution; local tests and live URL checks are not marked passed. CI must pass before production release.
