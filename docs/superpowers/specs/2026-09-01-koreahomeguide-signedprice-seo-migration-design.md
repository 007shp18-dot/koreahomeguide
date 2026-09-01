# KoreaHomeGuide → SignedPrice SEO Migration Design

**Date:** 2026-09-01  
**Status:** Approved design, pending implementation  
**Scope:** English SEO migration by verified URL cohort; KoreaHomeGuide Chinese SEO remains live

## 1. Outcome

Move the English organic-search value of KoreaHomeGuide to SignedPrice without taking KoreaHomeGuide offline, collapsing distinct search intents, or redirecting indexed URLs to weak substitutes.

The migration is destination-first:

1. A SignedPrice destination must exist and pass its release gate.
2. Only then may its matching KoreaHomeGuide URL return a permanent, single-hop redirect.
3. URLs without an equivalent destination remain live on KoreaHomeGuide.
4. KoreaHomeGuide Chinese routes remain live until SignedPrice has genuine Chinese equivalents.

The final state is one global product brand, SignedPrice, with KoreaHomeGuide retained as a redirect host and temporary home for untranslated or unmatched content.

## 2. Non-goals

- No immediate whole-domain redirect.
- No redirect of multiple property-type intents to one generic district page.
- No redirect of Chinese pages to English pages.
- No mass `noindex` before redirects are ready.
- No redirect chains, JavaScript redirects, or soft-404 destination pages.
- No Search Console Change of Address request during a partial migration.
- No removal of the KoreaHomeGuide domain or Vercel project during the migration.

## 3. Architecture

### 3.1 SignedPrice SEO registry

SignedPrice owns a typed registry of public, indexable destinations. Each record contains:

- canonical SignedPrice path;
- locale;
- page kind;
- source intent and property type where relevant;
- readiness state;
- sitemap eligibility;
- optional matching KoreaHomeGuide source path.

Metadata, sitemap entries, internal links, and migration validation derive from this registry instead of maintaining separate manual URL lists.

### 3.2 KoreaHomeGuide migration manifest

KoreaHomeGuide owns a deterministic redirect manifest. Every entry contains:

- exact source path;
- exact absolute SignedPrice destination;
- cohort;
- locale;
- evidence that the destination is approved;
- permanent redirect status.

The manifest generates the deployed redirect configuration and the test inventory. A source URL cannot enter the manifest unless the target exists in the SignedPrice SEO registry and is indexable.

### 3.3 Destination-first release gate

A migration entry is deployable only when all of these assertions pass:

1. Target returns `200`.
2. Target is server-rendered with useful primary content.
3. Target has a self-referencing canonical on `https://www.signedprice.com`.
4. Target is indexable and appears in the SignedPrice sitemap.
5. Target is reachable through crawlable internal links within three clicks of an indexable hub.
6. Source returns one permanent redirect directly to the target.
7. Source is removed from every KoreaHomeGuide sitemap after the redirect is enabled.
8. No redirect chain, loop, query-loss regression, soft 404, or canonical conflict exists.

## 4. Migration cohorts

### Cohort 0 — SignedPrice SEO foundation

Complete and validate:

- `/`
- `/kr/seoul/`
- `/kr/seoul/check/`
- `/kr/seoul/explore/`
- `/kr/seoul/explore/{district}/`
- `/kr/seoul/rankings/`
- `/kr/seoul/news/` and valid briefs
- `/kr/seoul/guide/` and valid guides
- Korean alternates under `/ko/kr/seoul/`
- `robots.txt`, sitemap, canonical, language alternates, structured data, titles, and descriptions

Only evidence-ready routes are indexable. Empty, rights-blocked, or invalid routes remain out of the sitemap and use the existing fail-closed metadata behavior.

### Cohort 1 — Exact English hubs and tools

Initial candidates:

| KoreaHomeGuide source | SignedPrice target | Rule |
|---|---|---|
| `/explore/` | `/kr/seoul/explore/` | Migrate after Explorer parity and browser verification |
| `/tools/seoul-rent-check/` | `/kr/seoul/check/` | Migrate after form, calculation, evidence, and mobile parity |
| `/guides/` | `/kr/seoul/guide/` | Migrate only after hub intent and guide discovery are equivalent |

`/compare/`, `/buy-or-rent/`, `/value-check/`, and `/net-proceeds/` stay on KoreaHomeGuide until SignedPrice has an equivalent intent-specific page. They must not redirect to a generic home or Check page.

### Cohort 2 — District and property-type intent pages

KoreaHomeGuide routes such as `/rent/{district}/{property-type}/` represent distinct apartment, officetel, and villa intent. SignedPrice must first publish equivalent indexable routes, using this canonical pattern:

`/kr/seoul/explore/{district}/{property-type}/`

Supported property types begin with `apartment`, `officetel`, and `villa`. Each target must expose its own evidence, title, description, canonical, internal links, and sitemap entry. Property-type pages cannot be aliases that render identical generic district content.

### Cohort 3 — Neighborhood and building pages

Neighborhood and building migration requires an exact identity match between the legacy KoreaHomeGuide artifact and the SignedPrice artifact.

- Matched, published identities receive a one-to-one redirect.
- Thin, withheld, stale, or ambiguous identities remain on KoreaHomeGuide.
- A generated mapping artifact records source identity, target identity, and validation result.
- Readable-name changes may never override the stable building identity.

### Cohort 4 — Exact guide migrations

Each English KoreaHomeGuide guide is evaluated separately:

- equivalent SignedPrice guide exists: redirect one to one;
- SignedPrice guide is not equivalent: keep KoreaHomeGuide page live;
- content is consolidated: publish the stronger SignedPrice document first, then redirect.

Duplicate publication across domains is not allowed indefinitely. Exact duplicates use a migration redirect, not a long-lived cross-domain canonical workaround.

### Cohort 5 — Root and remaining brand routes

The KoreaHomeGuide home page and residual English brand routes move last, after the important English cohorts are stable in Search Console. KoreaHomeGuide then remains online as a redirect host and as the active Chinese site until the Chinese migration has its own approved design.

## 5. Chinese SEO boundary

- `/zh/` routes stay live, indexable, self-canonical, and in KoreaHomeGuide sitemaps.
- They are never redirected to English SignedPrice routes.
- For a genuine translation pair during the transition, cross-domain hreflang may connect SignedPrice English and KoreaHomeGuide Chinese pages only when both pages are reciprocal and semantically equivalent.
- If reciprocity or equivalence cannot be proven, each page remains outside the other's hreflang cluster.
- Chinese migration begins only after SignedPrice has real Chinese routes and translated primary content.

## 6. Sitemap, robots, and canonical rules

### SignedPrice

- `www.signedprice.com` is the only canonical host.
- Root/non-`www` variants redirect to `www` without chains.
- Sitemap contains only `200`, self-canonical, indexable routes.
- Evidence-dependent pages enter or leave the sitemap with their readiness state.
- Parameter variants do not create new canonical pages unless explicitly registered.

### KoreaHomeGuide

- Non-migrated routes remain self-canonical and indexable.
- Redirected routes are removed from static and dynamic sitemaps in the same release that enables the redirect.
- `robots.txt` continues allowing crawlers to request redirected URLs; redirected paths are not blocked.
- Chinese sitemaps remain active.

## 7. Redirect behavior

- Use HTTP `301` for the approved migration manifest.
- Preserve only query parameters that retain user intent and are supported by the destination.
- Drop tracking-only parameters at the destination canonical.
- Redirects must be single-hop from every protocol and hostname variant.
- Unknown legacy paths continue returning their correct live response or `404`; they do not fall back to the SignedPrice home page.

## 8. Search Console operations

SignedPrice and KoreaHomeGuide remain separate Search Console properties during the partial migration.

1. Verify the SignedPrice Domain property.
2. Submit the SignedPrice sitemap after Cohort 0 deploys.
3. Keep the KoreaHomeGuide property and sitemaps active.
4. Inspect representative source and target URLs for each cohort.
5. Monitor indexing, redirect recognition, crawl failures, and impressions by page group.
6. Do not use Change of Address until the entire domain, including language strategy, is moving.

## 9. Failure behavior and rollback

- A target validation failure blocks only its cohort entry, not the whole application build.
- A missing target removes its redirect from generated configuration before release.
- If Production target checks fail after deploy, revert the redirect cohort while keeping the SignedPrice page live.
- Never roll back by blocking crawlers or returning temporary empty pages.
- The previous production deployment and manifest remain identifiable for Vercel rollback.

## 10. Testing and release evidence

### Static and unit tests

- registry and manifest schema validation;
- unique source and target rules;
- exact locale and property-type mappings;
- sitemap membership and exclusion;
- canonical and hreflang reciprocity;
- redirect status, query handling, and chain prevention;
- thin/withheld data exclusion;
- deterministic identity mapping.

### Browser and HTTP verification

At desktop and mobile widths:

- render all SignedPrice target page kinds;
- confirm crawlable internal navigation;
- inspect metadata and structured data;
- verify representative source redirects without JavaScript;
- confirm no console errors, horizontal overflow, or broken target content.

### Production gate

The PR may merge only after:

- full repository tests, typecheck, lint, and Production build pass;
- Preview target pages pass browser checks;
- redirect manifest audit passes;
- SignedPrice and KoreaHomeGuide robots and sitemaps validate;
- Production deployment is Ready;
- post-deploy source/target probes and runtime error scan are clean.

## 11. Release order for PR #32

1. Add the registry, manifest, and tests.
2. Finish SignedPrice Cohort 0 metadata and internal linking.
3. Implement only Cohort 1 redirects whose parity tests pass.
4. Publish Cohort 2 destination pages before enabling their redirects.
5. Keep Cohorts 3–5 disabled until their mapping artifacts pass.
6. Update PR #32 and deploy Preview.
7. Verify desktop, mobile, robots, sitemaps, canonicals, and redirects.
8. Mark the PR ready, merge to `main`, and verify both Production domains.

