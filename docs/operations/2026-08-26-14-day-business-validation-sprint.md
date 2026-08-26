# KoreaHomeGuide 14-Day Business Validation Sprint

**Start date:** 2026-08-26  
**Scope:** Seoul acquisition and monetization evidence  
**Operating rule:** Freeze cosmetic UI work. Fix only a broken funnel stage, accessibility defect, data-reliability issue, or a conversion problem supported by evidence.

## Sprint question

Can a foreign renter discover KoreaHomeGuide, complete a useful official-data Rent Check, and voluntarily take a follow-up action?

The sprint is not judged by page views alone. The primary path is:

```text
qualified entry visit
  -> Rent Check CTA/tool arrival
  -> Rent Check start
  -> result or explicit error
  -> email save or help request
```

## Verified launch state

The following production checks were completed on 2026-08-26 without exposing credentials or personal data:

| Surface | Evidence | Status |
| --- | --- | --- |
| Home | `https://koreahomeguide.com/` returned HTTP 200 and the current question-led Rent Check funnel | Verified |
| Rent Check | `https://koreahomeguide.com/tools/seoul-rent-check/` returned HTTP 200 and exposed the value-first lead module | Verified |
| Crawl entry | `robots.txt` allows crawling and points to the root sitemap | Verified |
| Sitemap | Root sitemap returned 31 sitemap locations, including the 30 district/property market sitemaps and static sitemap | Verified |
| Official-data calculation | Production Rent Check returned HTTP 200 for a supported Gangnam apartment request, using 13 comparables across three completed months | Verified once; not an availability SLO |

Still unverified because repository access cannot prove connected-console state:

- GA4 Realtime/DebugView event delivery and custom dimensions;
- Search Console sitemap processing, selected canonicals, indexing and live query baseline;
- Google Sheets lead delivery and help-message upsert in the production Apps Script;
- Vercel error rate, latency distribution and environment-variable scope.

## Day 0: prove the complete path

Complete one controlled end-to-end run before distributing links.

1. Open one English market page with an approved test UTM URL and confirm the automatic GA4 pageview.
2. Click its contextual Rent Check CTA and confirm district, property type and source context survive.
3. Submit a valid quote and retain the response timestamp, result state and comparable count. Do not record the exact quote in analytics evidence.
4. Confirm GA4 receives `rent_check_cta_click`, `rent_check_tool_view`, `rent_check_start`, `rent_check_result` and `lead_form_view` with no PII.
5. Submit one controlled test email, then one optional help request. Confirm `lead_submit` and `help_request` in GA4 and one normalized row in the production Sheet.
6. Repeat the email with different capitalization and confirm the same row is updated, not duplicated.
7. Check Vercel logs for the run: response status, duration, retry/timeout/429 signal and absence of service-key leakage.
8. Capture the Search Console and GA4 pre-distribution baseline. Record unavailable fields as unavailable; do not backfill estimates.

**Stop condition:** do not place external links if the valid Rent Check fails, the lead disappears, PII reaches GA4, or source attribution is missing.

## Day 1: controlled distribution

Use the four reviewed drafts in `docs/operations/2026-08-26-external-acquisition-kit.md`. Start with no more than two placements:

- one answer to a real foreign-renter question in a moderated community; and
- one direct message or email to a relevant university, relocation, expat-support or housing-information organization.

Rules:

- answer the question before linking;
- use the exact destination-specific UTM link;
- do not mass-post, cross-post identical text, purchase traffic or imply endorsement;
- record the final destination, wording and URL in the placement log;
- do not activate AdSense or partner offers during the baseline sprint.

## Days 2-6: operate, do not redesign

Check once daily:

- valid Rent Check success and latency for one rotating supported district/type;
- Vercel 429, timeout and 5xx signals;
- lead/help delivery count against Sheet rows;
- GA4 funnel events and session count;
- Search Console sitemap/index changes, without reacting to single-day noise;
- replies, objections and recurring questions from each placement.

Only intervene when a stage is broken. Do not add new search pages during this period.

## Day 7: first diagnosis

Calculate:

| Ratio | Formula | Initial decision threshold |
| --- | --- | ---: |
| Entry-to-CTA | Rent Check CTA clicks / qualified entry visits | Observe baseline |
| CTA-to-tool | Rent Check tool views / CTA clicks | At least 90% |
| Tool-to-start | Rent Check starts / tool views | Observe baseline |
| Start-to-result | Rent Check results / starts | At least 60% |
| Valid-request success | successful valid requests / all valid requests | At least 95% |
| Result-to-follow-up | lead submits + help requests / results | At least 5% |

Fix the earliest failing stage. Do not compensate for a broken calculation or conversion path by increasing traffic.

If fewer than 20 qualified entry visits have accumulated, treat every conversion ratio as directional only. Continue the same placements or add at most two new context-specific placements; do not declare a winner.

## Days 8-13: repeat what produced qualified use

- Continue only channels that generated a Rent Check start, useful reply, earned mention or credible institutional response.
- Revise a title or landing introduction only if Search Console shows impressions with weak CTR and enough observations to interpret.
- Turn repeated unanswered questions into a content backlog, not immediate pages.
- Begin partner discovery interviews using the separate pilot playbook. Do not expose a partner offer to users during this sprint.

## Day 14: evidence review

Retain raw GA4 and Search Console exports, placement records, Vercel evidence and aggregate Sheet counts. Classify the earliest failing stage:

| Evidence | Decision |
| --- | --- |
| No impressions or qualified external visits | Improve discovery and distribution relevance |
| Visits but few CTA clicks/tool views | Improve entry promise and contextual CTA |
| Tool views but few starts | Investigate form comprehension and input friction |
| Starts but few results or many errors | Stop acquisition and fix data reliability |
| Results but no follow-up | Improve the post-result proposition before monetization |
| Follow-up demand appears | Proceed to a small, disclosed partner pilot after its launch gates pass |

## Data-operations backlog

Request-time safeguards are already substantial: bounded retries/timeouts, per-instance concurrency control, request coalescing, response validation and 24-hour shared caching. The next reliability release should focus on operations rather than more request-path code.

Priority order:

1. protected scheduled freshness canary and named data owner;
2. structured metrics and alerts for key validity, 429, timeout, malformed payload, cache failure and unexpected row-count drops;
3. user-visible `fetchedAt`, freshness and stale/degraded state;
4. last-known-good snapshots and recent-month reconciliation;
5. deployment-wide cache-miss coordination and rate budgeting.

These items require a separate design because they add scheduled infrastructure, durable state and operational ownership.
