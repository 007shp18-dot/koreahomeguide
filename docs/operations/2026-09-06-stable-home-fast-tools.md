# Stable home, faster discovery and Tools

User-approved continuation, 2026-09-06. Base: production PR165, main 819c0f30c5758bd9c90546d2f56d175940779a48. Preserve brand, current three markets and approved building photos. No subagents.

## Root causes and changes
- Home market CTA labels had different widths and flex-wrapped. The evidence value row disappeared for Singapore/Dubai and summaries had variable height. All primary actions now say Explore (探索); shared heading, metric, description and action slots reserve equivalent space without inventing numbers. The three lower market rows also align their descriptions and links.
- Corrections retained the legacy oversized title and heavy borders. Both markets now use ResearchPageHeading, a plain dated ledger, contextual links and a Report an issue mailto action. Existing ledger contents and noindex remain.
- Seoul Explore awaited coordinate/media projection before querying verified addresses. A failing concurrency regression demonstrated the serial delay; both independent reads now start together. Source checks and graceful address fallback remain.
- Singapore rebuilt search text and sorted the full matching list on each keystroke. It now memoizes the search index and sorted scope and defers result rendering while the input stays responsive. Prices occupy a predictable separate line, with unbroken numbers.
- News fetched only after hydration and restarted requests on each visit. A streamed server component supplies a small DB-backed initial list using a 60-second public cache. The browser shares in-flight requests and reuses the full list for up to 15 minutes; refresh errors preserve the visible results. Remote ingestion remains after-response on the existing API.

## Approved Tools plan adaptations
The attached organic-entry plan predates PR165. Implement semantic additions on current components rather than replacing them: preserve Dubai/AED and the balanced Prices destinations; use neutral /tools/property-scenario/ and /ko/tools/property-scenario/ instead of routing Singapore through Seoul. Publish Tools hub in EN/KO/ZH so all navigation has five slots. Chinese hub explicitly labels English-only destinations. Existing routes are preserved; no new alias for Check.

- Tools hub: five actual actions, living and investment groups, common heading/footer.
- Standalone manual calculator: KRW/SGD/AED, same formula and exclusions, validated URL context and same-market/same-locale return links. Changing market clears values. This is not a Dubai transaction or tax-estimation tool.
- Detail handoffs: published sale median only, native currency, verified entity/name; no guessed exact area. Keep embedded calculators. Restore Korean Check/local-return parity on exact and public building paths.
- Ready Check results expose copy with a selectable-link fallback and clearly state that the link includes entered terms. No accounts or server-stored scenarios.
- Coarse allowlisted analytics: event, market, surface, tool only. No values, entity IDs or URLs are added to event payloads. Tracking failures cannot block actions.
- Five new canonical base routes registered with reciprocal language alternates. Calculator query states are noindex and canonicalize to the base; no input values in metadata.

## Verification before preview
- Full suite at the first implementation checkpoint: 257 files, 2,197 tests passed.
- Added locale-return assertions and ready/insufficient copy gating: focused 35 tests passed.
- Production build passed; later small entry-link/test additions are checked by CI before release.
- New E2E verifies home geometry across all cities, native currency reset/calculation, translated nav slots and Corrections report action at all configured viewports.
- No performance percentage is claimed. Concrete work eliminated is verified; live navigation and display checks remain required.

## Release gates and growth follow-up
PR/preview, four-viewport browser checks, reviewed changed screenshots, production deployment and live checks are pending at this commit. Record final evidence on the PR.
Search Console is not exposed through the available connectors in this session. Do not claim sitemap submission, inspection, traffic baseline or indexing. After access is available, record day-zero page-group impressions/clicks and tool completions, then review at 48 hours, 7 and 14 days. No growth guarantee.
