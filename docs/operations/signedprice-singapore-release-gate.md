# SignedPrice Singapore Release Gate

**Release state:** HOLD  
**Scope:** URA private residential sale intelligence only  
**Last reviewed:** 2026-08-31

Singapore code may merge only as a hidden, `noindex` surface while this document remains on HOLD. Production navigation and promotion require every item below to be evidenced against one exact commit and one immutable snapshot digest. Credentials, provider tokens, raw live responses, and full live snapshot payloads must never be recorded here.

## Required evidence

| Gate | State | Required evidence |
|---|---|---|
| Credential boundary | PASS (code) | Server-only environment key, sanitized provider errors, client bundle scanner |
| Four-batch transport | PASS (synthetic) | Token first; batches 1–4 once; timeout and retry contracts |
| Exact parser | PASS (synthetic) | Exact field set, native enums, safe SGD and square-metre normalization |
| Live schema canary | PENDING | Sanitized schema manifest from all four current live batches |
| Dataset-specific rights | PENDING | Official individual-dataset terms confirming ingest, aggregation, display, and commercial operations |
| Live snapshot | PENDING | Full four-batch build, period, byte size, digest, exclusions, and storage selection |
| Preview installation | PENDING | Protected Preview deployment ID, exact Git SHA, snapshot digest, runtime error check |
| Ready browser flow | PENDING | 390, 720, 1366, and 1440 px entry → Explore → segment → project evidence |
| Failure browser flow | PASS (local contract) | Missing or rights-blocked evidence returns claim-free unavailable pages |
| Secret scan | PASS (code) | Static assets and response HTML contain no credential name/value, endpoint, or provider header |
| SEO containment | PASS (code) | `noindex, follow`, no alternates/canonical, no sitemap URLs |
| Korea preservation | PENDING Preview | Seoul routes and KoreaHomeGuide production behavior unchanged |
| Visual acceptance | PENDING | User acceptance of the exact protected Preview |

Local Playwright collection succeeds for 12 Singapore cases across four viewports, but execution in the current development container is blocked before navigation because the locked Chromium binary is absent. CI installs that binary explicitly; this local limitation is not counted as a browser PASS.

## Promotion rule

Do not expose Singapore in global navigation, merge a rights change, or promote a Singapore snapshot to Production until all PENDING rows are PASS. A static market profile marked `limited` is not publication authorization. A valid snapshot without display rights is also not publication authorization.

## Evidence record

Fill these only after the corresponding gate passes:

- Git commit SHA: pending
- Vercel Preview deployment ID: pending
- Snapshot digest: pending
- Snapshot covered period: pending
- Sanitized schema-manifest digest: pending
- Dataset terms URLs and review date: pending
- Preview runtime-error window: pending
- Browser projects: pending
