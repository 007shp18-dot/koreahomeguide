# SignedPrice discovery journal

Approved in conversation on 2026-09-12: apply the first lightweight part of the
Hogangnono-inspired service model: connect regional reading and evidence, resume
recent exploration, and attach private notes to existing saved candidates.

## Scope

- Preserve the homepage, existing data semantics, maps, filters, comparison and saved lists.
- Support Seoul, Singapore, Dubai and Tokyo, in that order, with English, Korean
  and Simplified Chinese labels and locale-preserving navigation.
- Show up to three recently viewed places for the current city, only after a real
  detail visit or explicit valid Explore selection. A default map area is not a visit.
- Persist recent place identity, display name and a safe Explore route in this
  browser; preserve relevant public filters and never persist Passport/query secrets.
- Keep at most twelve recent places. Deduplicate a place across filter changes.
  Clearing recent history must not clear saved places or their notes.
- Add a collapsed private note to each existing saved candidate, editable from
  Saved and the city's saved results. Notes are at most 1,000 characters, at most
  120 stored notes. Save and delete are explicit; a storage failure is visible.
- Connect existing regional stories and city buying/area guides to Explore and
  detail pages. Exact area matches must be curated; city-level reading is labelled
  as city-level. Link a story back to its correct published Explore scope.
- Reuse existing imagery and CSS tokens. Minimum text 12px; controls at least
  44px; inputs 16px. Keep new information compact and below primary exploration.
- No new API, database queries, polling, third-party SDK or dependencies. Small
  local state and static editorial links only. Links do not speculative-prefetch.

## Delivery and verification

Implement in the existing isolated checkout on a feature branch from current main.
Test bounded state, corrupt storage, safe URLs, note persistence and deletion,
same-tab updates, locale links, and actual desktop/mobile journeys. Run required
repository checks, review, merge and deploy using the existing GitHub/Vercel path.
Publishing is already authorized in this conversation.

Community posting, accounts, background notifications and partner enquiries remain
later stages of the approved roadmap; they are not represented as working here.
