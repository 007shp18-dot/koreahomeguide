# SignedPrice Sitewide Baseline

- Recorded: 2026-09-04
- Git base: `96713e40200cb5b58a55c6909c07c2ceebebb2ae`
- Branch: `codex/editorial-growth-phase1`
- Public routes: `/`, `/markets`, `/prices`, `/news`, `/guides`, `/kr/seoul`, `/kr/seoul/explore`, `/sg/singapore`
- Required environments: local Vitest, production-like Next.js build, Playwright fixture server
- Deferred: Dubai data ingestion, AdSense delivery, brokerage, investment advice

## Baseline results

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm test` | PASS | 202 files, 1,935 tests, 0 failures |
| `pnpm typecheck` | PASS | 4 workspace projects |
| `pnpm lint` | PASS with warnings | 0 errors, 4 pre-existing warnings |
| `pnpm build` | PASS | Next.js 16.3.3, 858 static pages generated |

The build skipped the persistent-content migration because `DATABASE_URL` was not configured. This is an environment skip, not evidence that the Neon migration path is healthy.

### Existing lint warnings

- `components/singapore/singapore-rankings.tsx`: unsupported `aria-selected` on an implicit button role.
- `lib/public-market/korea-rent-job-handler.server.ts`: unused `_payload`.
- `lib/public-market/korea-sale-job-handler.server.ts`: unused `_payload`.
- `lib/public-market/rent-evidence-schema.ts`: unused `_sha256`.

## Known release blockers

- Global and local information architecture still diverge across route families.
- The public News route exposes the external-news discovery desk.
- Public styles still contain sub-12px text declarations.
- Public entity, location, media, capability, and evidence-release projections are incomplete.
- Singapore public lookups still scan snapshot arrays on request.
- Production-like database connectivity and migration must be verified with the configured Neon environment.

## Preservation rules

- Preserve the already merged photo stabilization, verified building facts, and server-rendered news work.
- Add compatibility repositories and dual reads before switching public routes.
- Do not treat missing credentials, stale data, or rights-blocked media as an empty market.
