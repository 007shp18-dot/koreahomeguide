# signedprice Seoul Rent Check release gate

## Authority boundary

This document is a release checklist, not authorization to merge, deploy, promote,
change DNS, publish a Vercel Firewall rule, redirect legacy traffic, or enable
indexing. Keep the candidate on its reviewed commit until every local and exact-SHA
Preview gate is recorded. A missing key, Preview protection blocker, malformed
source envelope, failed live smoke, or unredacted log blocks the merge; do not add
a fallback provider.

This slice must remain at `/kr/seoul/tools/rent-check/`, inherit
`noindex, follow`, and have no canonical or hreflang. Do not create a legacy
redirect and do not make the route indexable.

## 1. Freeze and verify the candidate locally

From a clean checkout, record the exact candidate and prove that no generated or
unrelated file is included:

```bash
CANDIDATE_GIT_SHA="$(git rev-parse HEAD)"
test -n "$CANDIDATE_GIT_SHA"
git status --short

cd v2
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm check:rent-client-boundary
pnpm playwright test tests/e2e/rent-check.spec.ts \
  --grep 'GET-only API|live response validator' \
  --project=desktop-chromium
pnpm playwright test --list
pnpm e2e
cd ..
node scripts/v2-migration/verify-phase-0.cjs
git diff --check
```

Acceptance:

- all V2 unit, typecheck, lint, build, desktop Chromium 1366×768, and mobile
  Chromium 390×844 gates pass;
- the post-build client-boundary scan finds no provider host, RTMS endpoint,
  rights/evidence URL, or credential marker in `.next/static` or any client
  manifest;
- the built Rent Check response contains
  `<meta name="robots" content="noindex, follow">`, and contains no canonical or
  hreflang link;
- the Phase 0 verifier reports `ok: true`, exactly `23` approved pre-existing
  failures, and no new failure title or class; and
- only the reviewed candidate files differ from the candidate's base.

## 2. Check server-only key presence without reading it

In the separate signedprice V2 Vercel project, run both checks. They inspect only
whether the exact environment-variable name is listed and deliberately print no
value:

```bash
vercel env ls preview 2>/dev/null \
  | awk '$1 == "DATA_GO_KR_SERVICE_KEY" { found = 1 } END { exit found ? 0 : 1 }'
vercel env ls production 2>/dev/null \
  | awk '$1 == "DATA_GO_KR_SERVICE_KEY" { found = 1 } END { exit found ? 0 : 1 }'
```

Both commands must exit `0`. The variable is server-only: it must not have a
`NEXT_PUBLIC_` name, appear in browser assets, response JSON, build output, or
runtime logs. Do not use `vercel env pull`, `vercel env get`, `printenv`, `env`,
or any command that prints the value for this gate.

Any environment-variable change requires a new deployment from the same exact
candidate SHA; do not reuse the older deployment. Record the new deployment ID,
URL, and `CANDIDATE_GIT_SHA`, then require `/api/status` to report that exact SHA
and `environment: "preview"`.

## 3. Hard-delete incompatible cache data before contract changes

Before deploying any parser version, quote methodology/version, or rights-policy
change, run a reviewed Vercel-side maintenance action that calls the top-level
Runtime Cache API exactly once:

```ts
await dangerouslyDeleteByTag('kr-seoul-rent-check');
```

This is an irreversible stable-tag deletion. Record the action/deployment ID,
timestamp, actor, old and new parser/method/rights identifiers, and successful
completion before serving the new contract. Do not substitute namespace deletion,
entry expiration, or deletion of only a versioned tag.

This candidate changes immutable source-page identity storage, so the purge is
mandatory even though the public quote math is unchanged:

| Boundary | Old | New |
| --- | --- | --- |
| Parser | `kr-molit-rent-parser-v1` | `kr-molit-rent-parser-v2` |
| Source page kind | `kr-molit-rent-source-page-v1` | `kr-molit-rent-source-page-v2` |
| Source manifest kind | `kr-molit-rent-source-manifest-v1` | `kr-molit-rent-source-manifest-v2` |
| Coverage namespace | `kr-seoul-rent-coverage-v1` | `kr-seoul-rent-coverage-v2` |
| Derived entry kind | `kr-seoul-rent-check-derived-v1` | `kr-seoul-rent-check-derived-v2` |
| Derived cache methodology namespace | `1` | `2` |
| Public methodology | `kr-rent-check-quote-normalization:1` | unchanged |
| Endpoint / rights | `v1` / `kr-molit-rent-v1` | unchanged |

V2 source chunks persist one SHA-256 exact-raw-item fingerprint digest for each
accepted normalized row. Old chunks do not carry that aligned identity evidence
and must never be replayed as V2. The stable-tag purge removes both old source
generations and derived results; versioned keys prevent accidental overlap, but
are not a substitute for the required deletion.

## 4. Configure the Firewall in staged order

Create one Vercel Firewall rate-limit rule with this exact match and threshold:

- method: `GET`;
- path: `/api/markets/kr-seoul/rent-check/`;
- key: client IP;
- threshold: `30` requests per `60` seconds per IP.

Use this sequence and stop on any mismatch:

1. Save the rule in Preview log-only mode and review that only the exact GET route matches.
2. Apply rate limiting to Preview only; verify request 31 is limited in the test
   window while other methods and routes are not counted by this rule.
3. Review Preview Firewall and runtime logs for false matches, bypasses, 5xx, or
   unredacted query/provider data.
4. After separate authorization for this observation-only side effect, apply the
   exact Production rule in **log-only** mode. It must not rate-limit traffic yet.
5. Observe a representative Production window and require: exact-path GETs match;
   neighboring paths, non-GET methods, and unrelated traffic do not match; no
   expected exact-path GET bypasses the rule; no unexpected 5xx appears; and
   Firewall/runtime logs contain no service key, raw provider endpoint/payload,
   unredacted query value, or internal exception.
6. Show the verified Preview evidence, Production log-only evidence, and exact
   enforcement diff to the founder.
7. Publish the Production rate-limit action only after explicit founder
   authorization. Recheck the exact-path match and 30/60/IP behavior after publish.

Application request validation remains enabled. Firewall publication is not part
of the code merge and must never be inferred from this checklist.

## 5. Create and identify an exact-SHA Preview

After deployment authorization, deploy only the reviewed candidate. The Vercel
project Root Directory remains `v2/apps/web` with outside-root workspace sources
enabled. Immediately before deployment, prove the locally scanned build is the
exact candidate SHA:

```bash
test "$(git rev-parse HEAD)" = "$CANDIDATE_GIT_SHA"
git status --short
cd v2
pnpm build
pnpm check:rent-client-boundary
cd ..
```

Record `PREVIEW_ORIGIN` without a trailing slash and verify identity:

```bash
curl --fail-with-body --silent --show-error \
  "$PREVIEW_ORIGIN/api/status" > /tmp/signedprice-status.json
node - "$CANDIDATE_GIT_SHA" /tmp/signedprice-status.json <<'NODE'
const fs = require('node:fs');
const [expectedCommit, path] = process.argv.slice(2);
const value = JSON.parse(fs.readFileSync(path, 'utf8'));
if (value.commit !== expectedCommit || value.environment !== 'preview') process.exit(1);
if (value.indexing !== 'blocked') process.exit(1);
NODE
```

Preview protection must allow the authorized verifier to reach both the page and
API. If it cannot, stop; do not weaken application security or treat a protection
page as product evidence.

## 6. Prove cold live readiness, then cache and browser behavior

The live Preview tests are separate from deterministic fixture flows. They do
not call `page.route`, the same-origin interception helper, `route.fulfill`, a
service worker, a proxy, or any response stub. Each test checks `/api/status`
against the exact expected SHA/environment.

Immediately before the cold command below, complete the reviewed Preview
stable-tag purge from section 3. No Rent Check page, API request, health probe, or
other verifier may call the Rent Check endpoint between that purge and the cold
test. If one does, repeat and re-record the purge. A cache-isolated equivalent is
acceptable only when its isolation mechanism and namespace are reviewed and
recorded with the deployment evidence.

Run these commands in order. Do not combine them or run the cold tag in parallel
across projects:

```bash
cd v2
PLAYWRIGHT_BASE_URL="$PREVIEW_ORIGIN" \
PLAYWRIGHT_EXPECTED_COMMIT_SHA="$CANDIDATE_GIT_SHA" \
PLAYWRIGHT_EXPECTED_ENVIRONMENT=preview \
pnpm playwright test tests/e2e/rent-check.spec.ts \
  --grep '@live-preview-cold' \
  --project=desktop-chromium

PLAYWRIGHT_BASE_URL="$PREVIEW_ORIGIN" \
PLAYWRIGHT_EXPECTED_COMMIT_SHA="$CANDIDATE_GIT_SHA" \
PLAYWRIGHT_EXPECTED_ENVIRONMENT=preview \
pnpm playwright test tests/e2e/rent-check.spec.ts \
  --grep '@live-preview-cache' \
  --project=desktop-chromium

PLAYWRIGHT_BASE_URL="$PREVIEW_ORIGIN" \
PLAYWRIGHT_EXPECTED_COMMIT_SHA="$CANDIDATE_GIT_SHA" \
PLAYWRIGHT_EXPECTED_ENVIRONMENT=preview \
pnpm playwright test tests/e2e/rent-check.spec.ts \
  --grep '@live-preview-ui' \
  --project=desktop-chromium \
  --project=mobile-chromium
cd ..
```

The selected tests issue these exact direct requests and matching browser form
submissions:

- monthly rent:
  `lawdCd=11590&type=officetel&deposit=10000000&rent=1100200&area=28`;
- jeonse:
  `lawdCd=11680&type=villa&deposit=250000000&rent=0&area=60`.

`validateLiveRentCheckResponse` passes each unmodified response through the
production client runtime validator. That boundary requires the complete and
exact success/insufficient public schema, key sets, primitive types, enums,
source and mapping provenance, coverage/retrieval ordering, methodology/result
cross-field invariants, counts, comparables, and literal limitations. The live
gate additionally requires HTTP 200, `Cache-Control: private, no-store`, and
`coverageThroughMonth` equal to the immediately preceding calendar month in
`Asia/Seoul`, including January-to-December year rollover.

Before schema validation, a recursive walk rejects secret-like keys at any depth
(`apiKey`, `serviceKey`, secrets, tokens, passwords, credentials, raw/provider
endpoint URL keys, and host/URL keys) and rejects any public string value
containing a URL or provider hostname, including `apis.data.go.kr`. The tests and
validator do not print response bodies, headers, or secret values.

The first monthly-rent and first jeonse direct requests after the purge must each
return `X-Signedprice-Cache: miss`; `hit` and `stale` do not certify provider-key
or live MOLIT readiness. The immediately repeated direct requests must each be a
non-stale `hit`. Stale behavior remains covered only by the separate deterministic
cache tests and never substitutes for either live proof. The browser flows then
require non-stale `hit` responses and confirm full contract dates, source, period,
sample, method, limitations, focus, target size, and overflow behavior at both
configured viewports.

## 7. Review Preview operations evidence before merge

Record all of the following against the exact deployment:

- the first post-purge monthly and jeonse direct responses are exactly `miss`;
- the immediate repeated monthly and jeonse responses are exactly `hit`, never
  `stale`;
- both browser flows are non-stale `hit` responses;
- every response reports the immediately previous Seoul coverage month;
- every API response is `Cache-Control: private, no-store`;
- deployment and Firewall logs show no unexpected `5xx` during the window;
- logs contain no service key, raw provider endpoint, raw upstream payload, or
  unredacted internal exception;
- the Rent Check HTML has `noindex, follow`, no canonical, and no hreflang;
- TLS is valid for the Preview hostname;
- KoreaHomeGuide production and its Phase 0 evidence are unchanged; and
- no redirect from a KoreaHomeGuide route or signedprice legacy route was added.

Only after this evidence and broad code review have no Critical or Important
findings may the controller prepare a remote-main merge. Preview verification
does not authorize the merge.

## 8. Production and post-publication gate

Before Production promotion or Firewall publication, show the exact-SHA Preview
evidence and Firewall diff and obtain separate explicit authorization for each
side effect. After authorized publication, verify:

```bash
curl --fail-with-body --silent --show-error --head https://www.signedprice.com/
curl --silent --show-error --head https://signedprice.com/
curl --fail-with-body --silent --show-error \
  https://www.signedprice.com/kr/seoul/tools/rent-check/ \
  > /tmp/signedprice-production-rent-check.html
```

Acceptance:

- TLS is valid and `https://www.signedprice.com` serves the reviewed Production;
- the apex performs only the approved permanent redirect to the equivalent
  `https://www.signedprice.com` URL;
- the Rent Check page remains `noindex, follow` with no canonical/hreflang;
- fresh direct monthly-rent and jeonse calls, using the exact queries in section 6,
  pass the same typed-envelope, source, coverage, no-store, cache-status, and
  redaction assertions against `https://www.signedprice.com`;
- Firewall logs show the exact 30/60/IP GET rule and no false matches;
- the verification window has no unexpected 5xx or unredacted runtime log; and
- `https://koreahomeguide.com` and the Phase 0 legacy gate remain unchanged with
  exactly the approved 23 pre-existing failures.

Any failure stops publication or triggers an authorized rollback. Do not activate
a provider fallback, redirect, or indexing as a recovery action in this slice.
