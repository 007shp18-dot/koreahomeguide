# Property core seed

The checked-in Seoul and Singapore artifacts remain available. Property identity rows populate `buildings`, `property_entities`, `geographies`, and `external_identifiers`; existing enrichment and photo approval routes use these rows. Transaction distributions continue to use their verified artifact repositories.

The evidence seed mirrors only row-level records that are actually present in the installed artifacts. It stores 177,641 published recent Seoul rent records, 62,678 published recent Seoul sale records, and all 133,942 Singapore private-sale records as source records. The verified property inventory accepts all rent and Singapore rows plus 50,177 Seoul sale rows as linked observations. Another 12,501 Seoul sale rows belong to 8,916 sale-only building IDs outside the immutable inventory; their hashes and raw fields remain as unlinked source evidence instead of creating guessed properties. The HDB artifact contains block summaries rather than its 462,792 upstream rows, so the seed stores 40,044 block median/count metrics and retains the upstream count on the evidence release. It never fabricates absent transactions.

Run from `v2/apps/web` with a privately supplied `DATABASE_URL`:

```sh
node scripts/seed-property-core.mjs --dry-run
node scripts/seed-property-core.mjs
node scripts/seed-property-core.mjs --verify-only
node scripts/seed-property-evidence.mjs --dry-run
node scripts/seed-property-evidence.mjs
node scripts/seed-property-evidence.mjs --verify-only
node scripts/seed-kapt-nearby-places.mjs --dry-run
node scripts/seed-kapt-nearby-places.mjs
node scripts/seed-kapt-nearby-places.mjs --verify-only
```

Run the seed twice on a test branch before production. Updates happen only when seeded fields change. Seeding is an explicit operator action, not part of each build, so deployments do not replay source identities over subsequent review work.

Expected source and database identities:

| Dataset | Rows |
| --- | ---: |
| Seoul | 48,999 |
| Singapore private | 3,862 |
| Singapore HDB | 10,011 |
| Total | 62,872 |

- Legacy ID SHA-256: `d86ae08ab146e07570ccbd7b15f07a80f3ca5fd537d7199f58628348439e446a`
- Entity ID SHA-256: `92be10891460d8604c8b6661cd4884c3eaee9ce5791a14ec6c59a49a2d9e3729`

Digest input is the sorted IDs joined by newlines, with no trailing newline. Legacy IDs are `market_key:external_id`.

The 2026-09-05 test on `br-patient-sky-b3ssnche` matched these counts and digests after full loading and replay. Complete row digests (including timestamps) were unchanged for all four seeded tables on replay. The partial test branch contained one incorrect MARINA ONE RESIDENCES ID, `375ca572…d84a6c`; its three rows were backed up and removed after approval, with no photo or transaction dependents. The checked-in correct ID is `9cd03c11…61f93`. Production `br-super-butterfly-b31hhh93` then passed the same seed verification. Dubai rows retained their pre-load digests on both branches.

## Existing photo workflow

Seoul search addresses combine city, district, neighborhood and building name or lot number. They support candidate searches; they do not claim a new geocoded position or independently verified legal address.

The cron-authorized `GET /api/internal/building-enrichment` accepts optional `market=seoul` or `market=singapore` and `limit=1..12`. Use a small scoped batch for migration verification. Omitting parameters keeps the existing scheduled collection behavior. Candidates remain `review_required` until the existing `POST /api/internal/building-photo-approval` review flow approves them. List candidates through the existing authorized GET on that approval route.

Candidate keys match existing screens: `kr-seoul:<id>`, `sg-project:<marketSegment>:<name>`, and `sg-hdb:<town>:<block address>`. Missing Singapore metadata is skipped rather than guessed. Existing Dubai keys and the environment registry fallback are retained.

Configure production-only `DATABASE_URL` to the production pooled Neon connection through authenticated Vercel access. Never put it in source files, reports, or browser variables. The authenticated inspection on 2026-09-05 found the existing production value already matched the specified Neon main connection, including credentials and pooling.
