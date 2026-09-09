# Editorial Depth Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for the bounded editorial rewrite and review tasks.

**Goal:** Audit the existing editorial catalogue and publish a first substantive correction batch.
**Architecture:** Keep existing typed portfolio records, journey JSON and canonical routes. Improve the content in place; no database or photo changes.
**Tech Stack:** TypeScript content modules, bilingual JSON, existing Vitest and publication CI.
**Spec:** docs/superpowers/specs/2026-09-09-editorial-depth.md

## Global Constraints
- Preserve route IDs, publication history, translations and working examples.
- Research dates and legal applicability must be explicit; synthetic inputs remain labelled.
- Do not normalize unrelated files or add tests that merely restate prose.
- One implementation agent owns its named files; root owns integration and audit documentation. Research agents remain read-only.

### Task 1: Catalogue and evidence
- [x] Consolidate the portfolio and journey audits into docs/editorial/2026-09-09-audit/ with per-record actions, priorities, and distinct-record versus translated-page counts.
- [x] Preserve the verified Dubai and Tokyo source memos beside the audit.
- [x] Write docs/editorial/editorial-standard.md with practical column, guide and source requirements derived from the approved reference analysis.

### Task 2: Rewrite the two analytical features
- [x] Edit v2/apps/web/content/en/dubai-rental-yield.ts and content/ko/dubai-rental-yield.ts: clear rent-collection thesis, CBRE Q2 context, one cash-flow table, one sensitivity table, practical document checks. Keep a concise financed-cash-flow result and calculation assumptions if no separate financing article exists.
- [x] Replace only tokyo/old-condo-costs and tokyo/which-home in v2/apps/web/content/city-journey-articles.json: explain the price/total-cash gap early, preserve the ten-year model and original survey scope in the column; make the which-home guide a document/field/decision guide with distinct work from the column.
- [x] Verify both languages, source links, all scenario arithmetic and the existing article/schema tests.

### Task 3: Correct recurring editorial weaknesses
- [x] Shorten the four legacy city-story bodies in content/city-stories.ts into six distinct stage summaries, linking each to the existing independent article. Preserve titles, section IDs and useful action links.
- [x] Rewrite at least the deposit-protection and Singapore ABSD policy records through content/policy-explainers.ts and the existing EN/KO/zh-CN portfolio imports with actual rules, scope and a usable example after original-source verification. Keep other unverified changes in the audit backlog rather than imply all records have been refreshed.
- [x] Remove repeated long inline source labels from Singapore journey paragraphs only where the same sources are already attached to the section; preserve any unique citation.

- [x] Correct the Seoul 59 sqm headline/deck to disclose the actual inclusive 55–65 sqm screen; keep its dataset and canonical URL.

### Task 4: Review and release
- [ ] Independent editorial/source review of the complete diff, recalculation of worked examples, targeted existing content tests, typecheck and lint.
- [ ] Publish one GitHub PR, complete required CI, merge under existing authorization and verify the changed public articles.
- [ ] Report the exact reviewed and rewritten scope and the remaining ordered backlog.
