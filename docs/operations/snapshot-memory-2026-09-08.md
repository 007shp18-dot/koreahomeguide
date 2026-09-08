# Snapshot runtime memory reduction

Production had Vercel OOM/HTTP 500 events on Singapore private/HDB detail routes and other pages. A local Node 24 reproduction loads the actual installed Singapore Explore, all three Singapore Check markets and Korea evidence in one process, without database access or page rendering.

Before: peak RSS 1,771 MiB; retained heap after these loaders 934 MiB.
After: peak RSS 1,137 MiB; retained heap 448 MiB (455 MiB after initializing strict Korea Check and ten warm lookups). These are process measurements, not a production error-rate guarantee. Page rendering and request concurrency still need deployment observation.

The Singapore installed paths previously converted parsed objects back to large JSON strings, parsed duplicate histories, and built whole canonical JSON strings for snapshot/index hashing. Check validation also allocated a second normalized history solely to find the first and last month.

Changes preserve source digests, periods, record counts and publication checks:

- Accept already parsed objects through the same validation path, preserving immutable row identity.
- Hash sorted-key canonical JSON incrementally with a bounded token buffer, preserving existing canonical bytes and Unicode tokens.
- Find Check period extrema in one validation pass.
- Reuse strict Korea Check repositories only for the deployment's exact installed registry/resolver. Disabled data, external resolvers and registry overrides bypass that cache.

The reproduction printed identical Singapore source digests and counts before and after: Explore/private Check 133,942 records; HDB resale 239,465; HDB rent 209,852. Korea counts were 340,704 rent and 76,570 sale source records.

Run from `v2`:

```sh
node --expose-gc --max-old-space-size=1536 --conditions=react-server --experimental-loader ./scripts/typescript-extension-loader.mjs --experimental-transform-types scripts/profile-snapshot-memory.mts --max-rss-mib=1536
```

The CI budget is 1.5 GiB for this repository-loading reproduction, leaving further room below a 2 GiB process for other work. It is not a claim that all production invocations have a particular configured memory limit. A tighter exploratory 1 GiB target was not met (1,137 MiB). Further partitioning can reduce the remaining retained histories; this change removes the demonstrated duplication first.

Validation: 120 focused evidence/package tests passed, typecheck passed, lint passed with seven pre-existing unused-import warnings. The memory reproduction passed, including ten strict warm Check lookups. Three regression assertions were observed failing before implementation (installed row reuse, object Check source, strict Korea warm reuse). Existing full browser failures from the prior audit must be distinguished from regressions introduced by this change; do not blanket-approve snapshots or disable checks.
