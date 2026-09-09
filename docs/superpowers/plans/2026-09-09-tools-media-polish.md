# Tools research submissions and building media repair

Approved scope: implement the next user-contributed-data milestone, restore approved Neon building photographs, and correct remaining source/typography/alignment defects. The user has authorized autonomous implementation, review, GitHub integration and deployment. Existing calculator use must remain independent of research participation.

## Binding design

- A completed calculation may show one quiet, collapsed research panel below its result. Nothing is sent on opening a page, editing inputs, loading saved state, or opening a shared URL. Submission requires an unchecked consent control and an explicit submit action.
- Share only allowlisted city/tool/type enums and currency-specific amount, area, yield and sample-size bands. Show the actual bands being submitted. Do not send exact input amounts, URLs, queries, building IDs/names, addresses, free text, buyer identity/tax profile or contacts. Use the input snapshot corresponding to the displayed result. Changes to a result reset consent and submission status.
- Records are `user_scenario` for internal `product_research`, separate from official transactions. No public aggregation or claims of independently verified contributors in this milestone.
- A strict, bounded same-origin JSON API writes to the existing Neon database. Generate an opaque HttpOnly Secure SameSite browser ownership cookie; store only its namespace-separated hash. No new account or secret is required. Owner-scoped deletion works even if new collection is disabled. Retry IDs and per-owner/day scenario hashes prevent duplicate counting; repeated submissions do not extend existing retention.
- Retain records for 90 days, exclude expired records from every internal summary, and connect daily physical expiry cleanup using the existing cron authentication. Deletion/expiry removes payload and owner association. Do not log submitted payloads. Saving failures must not affect calculations or claim success. Explain that browser ownership is lost if its cookie is cleared and that records then expire automatically.
- Approved photos must pass existing identity/rights/source rules and use their real building/project IDs. Restore missing projections without bulk approving candidates. If an image cannot load, provide a deliberately composed city context photograph or neutral location panel with truthful labels. Keep required source attribution adjacent to the photograph and detailed source/method information in the lower evidence section.
- Use existing shared design tokens and a common page gutter/type hierarchy. Fix reproducible source placement, CJK tracking, content alignment and action sizing defects without adding decorative dashboards or information density.

## Task 1: Research contract and Neon backend

Create focused modules under `v2/apps/web/lib/tool-research/` for strict schema, deterministic buckets, ownership and repository/handler. Add `app/api/tools/research/route.ts`, migration `0018_tool_research_submissions.sql`, and an authenticated daily expiry endpoint/cron. Reuse raw parameterized SQL, existing `contentDatabase()` and migration runner. Support the existing seven result-producing tools: Passport, property scenario, Seoul single quote, Seoul offer compare, Seoul rent check, Singapore check and Dubai check. Define a typed, client-safe normalized payload contract for their bucketed snapshots. No public GET of submissions. Add a bounded server-only aggregate repository function by broad market/tool, ignoring expired rows.

Meaningful tests: exact/unknown field rejection, invalid tool/currency combinations, explicit versioned consent, bounded body/same-origin checks, retry and same-day dedupe, another owner's deletion isolation, database failure, disable-collection while allowing deletion, cookie attributes, expiry and retained-only summary. Test actual SQL with PGlite or a temporary Neon branch, not just SQL strings. Root owns external DB operations.

## Task 2: Optional result submission and privacy controls

Add a small client `ToolResearchShare` component and shared styles; integrate below completed results in `passport-workspace`, `market-ui/property-scenario`, `single-quote-check`, `contract-check-workspace`, `rent-check-workspace`, `singapore-check-workspace`, `dubai-check-workspace`. Server workspaces pass sanitized snapshots into the client panel. Root owns global/photo CSS; avoid those files. Add management/deletion access in Tools hub and localized privacy descriptions. Preserve EN/KO and existing zh-CN where supported. Do not introduce an always-visible large form in Explore. Fix the existing GA initial page URL sanitization gap using the same URL-redaction contract as subsequent events.

Meaningful verification: no request before consent and explicit submit, request contains only visible bands, input changes cannot mix with stale results, retry uses same ID, submission/delete failure states are truthful, result remains usable, keyboard/focus behavior and compact mobile layout. Use focused component/browser checks rather than tests that merely mirror styles.

## Task 3: Approved photograph projection and fallback

Inspect actual Neon media counts and code path. Initial evidence: Seoul 13 approved photographs are projected; Singapore 71 approved legacy rows have matching property entities but no media assets/public projection. Repair the authoritative projection pipeline so existing and future Singapore approvals can be displayed, preserving rights/identity review. Add a versioned idempotent backfill if needed through normal migrations. Test on a temporary Neon branch before production migration. Check representative exact photos and failed remote image behavior in public pages; no approval of the 39k unreviewed candidates.

## Task 4: Shared layout correction and release

Use the visual audit's concrete DOM/CSS findings to fix source placement, tracking/line height, left/right gutters and action dimensions across EN/KO city Explore/details and Tools. Preserve useful data via lower sections/details. Review the combined diff and validate type/lint, targeted tests, required build/browser CI, then merge and verify actual production photos, optional submission/deletion and layouts. Update the product and data roadmaps with implemented versus still-planned scope and measured media coverage.

## Preflight and ownership

| Shared boundary | Owner and rule |
|---|---|
| Research schema/bands/API | Task 1 establishes contract; Task 2 consumes it |
| Result integration and research CSS | Task 2 only; no media/global style changes |
| Photo migrations | Root allocates 0019 or later after 0018; do not edit historical migrations |
| Production/temporary Neon | Root performs all external operations |
| Git commits | Each implementer stages only owned files; root integrates and releases |

Ruling: explicit per-result submission is the first collection mechanism, because it implements the approved optional contribution path without changing existing analytics consent or silently collecting historical state. Cost evidence uploads and public demand statistics remain later roadmap milestones.
Ruling: the user's existing release authorization applies; no additional permission ceremony is needed for reviewed implementation and normal deployment.

## Task 5: Repair the photo approval bottleneck

Added after the user challenged the 84 approved-photo count. A live operational audit found 40,451 pending rows: 40,430 NAVER search links (34,480 without a title name match), 20 licensed Commons candidates, and one Google candidate. The queue contains 26,568 extra URL uses across 3,844 duplicate groups. A pending row incorrectly prevents other providers from inspecting the same building; the review endpoint exposes only the newest 100 and accepts caller-supplied publication metadata.

Pause the NAVER discovery cron and retain its private evidence. Add migration 0019 with a stable publication key, provider-specific private candidate keys based on canonical building IDs, source/title/dimension fields, and review events. Preserve existing approved keys and media references. A pending candidate blocks only its own source; Google and Commons discovery records metadata without claiming a visual review. Keep existing provider spending limits.

Replace the raw approval endpoint with bounded oldest-first cursor/source/market/status lookup and stored-candidate approve/reject/broken decisions. Require explicit visual confirmation, source/license evidence, a review note, and an exact candidate version; record each decision atomically. Unknown or caller-supplied identity/asset fields are rejected. Duplicate URLs are reported; an approval never propagates to another building because it uses the same URL. Each canonical candidate requires its own review, including any shared parent-estate photograph and its parent-context label. Retractions apply to public reads and projection refreshes. A replacement first retracts the old approved candidate and then approves the reviewed replacement; no implicit overwrite.

Review the 20 existing licensed Commons candidates using their actual pixels, source and location evidence. Do not mass approve the search queue. Retrospectively inspect the nine prior metadata-only automatic approvals. Record measured approvals, rejected subjects and unresolved identity questions in the release report.

Verification: actual PostgreSQL migration/provider coexistence, canonical public lookup, cursor traversal, rights refusal, microsecond version conflicts, competing approval exclusion, physical retraction and audit event; focused provider/route tests plus the combined release gates. Root owns this task and all external mutations; the client implementer continues independently in its owned files.
