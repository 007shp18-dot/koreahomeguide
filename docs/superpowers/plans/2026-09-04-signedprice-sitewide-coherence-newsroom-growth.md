# SignedPrice Sitewide Coherence and Newsroom Growth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 서울·싱가포르의 공개 데이터 경로를 안정화하고, 전 화면을 하나의 제품 문법으로 통일한 뒤, 외부 헤드라인 피드를 정책·시장·데이터 스토리 중심의 검수된 Newsroom으로 전환한다.

**Architecture:** 기존 Next.js App Router와 시장별 snapshot 생성기는 유지한다. 원천·ingestion 데이터 위에 공개 전용 projection과 repository를 추가하고, 화면은 오직 승인된 projection 또는 마지막 정상 release를 읽는다. 외부 뉴스는 내부 발견 계층으로 격리하고, 공개 콘텐츠는 출처·검수·개정 이력이 있는 `content_articles` 계층에서만 제공한다.

**Tech Stack:** Next.js 16.3, React 19.2, TypeScript 5.9, Vitest 4, Playwright 1.62, Neon Postgres, 정적 evidence artifact, HTML/SVG infographic renderer

**Specs:**

- `docs/superpowers/specs/2026-09-04-signedprice-three-market-experience-data-model-design.md`
- `docs/superpowers/specs/2026-09-04-signedprice-production-coherence-data-readiness-design.md`
- `docs/superpowers/specs/2026-09-04-signedprice-data-newsroom-content-system-design.md`

## Global Constraints

- 기존 white/navy/cobalt 색상 체계는 유지한다.
- 글로벌 메뉴는 `Markets / Prices / News / Guides`로 통일한다.
- 시장 화면은 글로벌 헤더 아래 `Overview / Explore / Check / Rankings / Corrections` 중 실제 capability가 있는 항목만 표시한다.
- 공개 텍스트는 12px 미만을 금지하고, 상호작용 레이블은 14px 이상, 클릭 영역은 최소 44×44px로 한다.
- Desktop 1440px, Tablet 1024px, Mobile 390px를 필수 검수 뷰포트로 사용한다.
- 공개 route는 raw ingestion table이나 검수 전 외부 item을 직접 읽지 않는다.
- 모든 공개 수치는 기간·단위·표본·source 또는 evidence release를 가진다.
- 자동 기사 발행과 자동 번역 공개를 금지한다.
- 이번 프로그램의 데이터·정책·콘텐츠 범위는 서울과 싱가포르다. Dubai는 글로벌 시장 선택기에 남기되 research-only capability 외의 새 데이터와 콘텐츠를 만들지 않는다.
- AdSense 실제 송출과 신청은 이 계획의 출시 gate를 모두 통과한 뒤 별도 승인으로 진행한다.

---

## 1. 현재 상태 요약

### 운영 화면

- 글로벌 홈페이지는 `Markets / Prices / Journal / Guides`를 쓰지만 `/news/`와 `/guides/`는 7개 메뉴와 별도 헤더 문법을 아직 노출한다.
- `/news/`는 외부 헤드라인 500건, provider 연결 상태, 15분 cache 진단을 공개 화면에 표시한다. 이는 내부 desk 정보이며 공개 편집 제품이 아니다.
- 서울 Explore는 구·건물·거래 경로가 존재하지만 공개 위치 projection이 없어 목록과 지도 핀의 완전한 양방향 연결을 보장하지 못한다.
- Singapore repository는 큰 snapshot 배열에서 segment·project·record를 요청 시 반복 검색한다.
- 공개 CSS에는 8–11px 텍스트와 0.54–0.68rem 텍스트가 여러 화면군에 남아 있다.

### 데이터

- `0001_persistent_content.sql`은 `markets`, `districts`, `buildings`, `building_photos`, `transactions`, `news_articles`, `content_articles`를 제공한다.
- `property_entities`, `evidence_releases`, `market_capabilities`, 공개 위치·미디어 projection, policy lifecycle, source links, infographic spec은 아직 별도 공개 계약으로 존재하지 않는다.
- 기존 evidence artifact와 DB 데이터는 모두 보존해야 하므로 destructive rename 대신 새 core + compatibility repository를 사용한다.

### 채택한 실행 방식

한 번에 DB 전체를 교체하지 않는다. 각 release는 `schema → projection → repository → route model → UI → browser path`가 함께 끝나는 vertical slice다. 각 release가 단독으로 배포·회귀·롤백 가능해야 다음 release로 이동한다.

## 2. 글로벌 레퍼런스 적용 원칙

| 제품 역할 | 참고 패턴 | SignedPrice 적용 | 배제할 패턴 |
| --- | --- | --- | --- |
| 즉시 탐색 | [Rightmove](https://www.rightmove.co.uk/house-prices.html), [Zillow](https://www.zillow.com/us/) | 첫 화면에서 시장·거래 유형·검색을 바로 시작하고 지도/목록 선택을 동기화 | 매물 광고·배지·필터 과밀 |
| 데이터 제품 | [Redfin Data Center](https://www.redfin.com/news/data-center/), [Zillow Research](https://www.zillow.com/research/data/), [Realtor.com Research](https://www.realtor.com/research/data/) | 갱신 주기, 정의, 방법론, 다운로드 원값, 관련 해설을 한 흐름으로 연결 | 출처 없는 단일 추정값과 순위 |
| 독자 질문 중심 연구 | [Domain Research](https://www.domain.com.au/research/), [PropertyGuru Insights](https://www.propertyguru.com.sg/property-guides/property-insights-singapore) | Renting·Buying·Neighborhoods·Market data로 콘텐츠를 분류 | 시장별 고유 분류를 다른 시장에 복제 |
| 기관형 연구 | [JLL Insights](https://www.jll.com/en-us/insights), [Savills Research](https://www.savills.com/research_articles/255800/388365-0), [Knight Frank Research](https://www.knightfrank.com/research) | 작성·검수 주체, 기준일, 관련 연구, 시장/주제 필터 | 기업 서비스 메뉴와 PDF 중심 탐색 |
| 편집 브랜드 | [The Modern House Journal](https://themodernhouse.com/journal) | 카드 벽보다 타이포그래피·사진·서술 순서로 위계를 형성 | 데이터 도구까지 사진 중심으로 만드는 방식 |
| 정책 생애주기 | [GOV.UK update history](https://www.gov.uk/government/publications/how-to-rent), [Singapore MND](https://www.mnd.gov.sg/newsroom/press-releases), [HDB News](https://www.hdb.gov.sg/hdb-pulse/news), [MAS measures](https://www.mas.gov.sg/news/media-releases/2023/measures-for-a-sustainable-property-market) | announced·enacted·effective·amended·expired와 변경 이력을 분리 | 발표 기사를 곧바로 시행 중 정책으로 표현 |
| 비교 가능성 | [OECD Affordable Housing Database](https://www.oecd.org/en/data/datasets/oecd-affordable-housing-database.html), [URA release calendar](https://www.ura.gov.sg/property-data/data-release-calendar/) | metric 정의, 비교 한계, 데이터 issue, release cadence를 공개 | 서로 다른 기간·부문·단위를 같은 랭킹에 배치 |

### 화면별 UI/UX 레퍼런스 매트릭스

글로벌 사이트의 표면을 복제하지 않는다. 각 화면군을 구현하기 전에 아래 reference 3곳의 현재 desktop/mobile 화면을 캡처하고, 가져올 원칙을 한 문장으로 기록한다. SignedPrice의 차별점은 매물 수가 아니라 `검증된 거래 근거 → 해석 → 다음 의사결정` 연결이다.

| SignedPrice 화면 | 1차 레퍼런스 | 가져올 UI/UX 원칙 | 구체 적용 | 가져오지 않을 것 |
| --- | --- | --- | --- | --- |
| 글로벌 홈 | [Rightmove House Prices](https://www.rightmove.co.uk/house-prices.html), [The Modern House Journal](https://themodernhouse.com/journal), [Redfin Data Center](https://www.redfin.com/news/data-center/) | 첫 화면에 주행동 하나, 그 아래 편집 위계와 근거 | 세 도시 선택은 유지하되 1개 primary action과 `핵심 기능 → Insight → Guide` 순서만 노출 | 검색·프로모션·추천 카드가 동시에 경쟁하는 포털형 hero |
| 시장 Overview | [Redfin Data Center](https://www.redfin.com/news/data-center/), [Zillow Research](https://www.zillow.com/research/data/), [Domain Research](https://www.domain.com.au/research/) | 핵심 수치 바로 옆에 기간·정의·갱신일 배치 | desktop은 6:6 설명/16:9 이미지, 핵심 지표 3–4개, Explore 진입 1개; mobile은 본문→지표→이미지 순서 | 근거 없는 큰 숫자, 자동 회전 carousel |
| Prices / Explore | [Zillow](https://www.zillow.com/us/), [Redfin](https://www.redfin.com/), [PropertyGuru](https://www.propertyguru.com.sg/) | 검색·filter·map/list의 즉각적 피드백과 단계적 상세 공개 | desktop은 구/건물 목록 42% + 지도 58%, 선택 상태 단일화; mobile은 `List / Map` 전환과 44px control, 선택 건물 bottom sheet | 매물 배지, 중개 CTA, 한 화면에 모든 필터 펼치기 |
| Building Detail / Check | [Rightmove House Prices](https://www.rightmove.co.uk/house-prices.html), [Redfin](https://www.redfin.com/) | 주소 입력과 검증 결과를 한 여정으로 연결 | 48px 입력·버튼, 사진→신원→최근 거래→비교 근거→주변→출처; 비교 건물에서 원래 filter/지도 상태 복원 | 거래 근거보다 먼저 나오는 문의·광고·대출 유도 |
| News index | [PropertyGuru Insights](https://www.propertyguru.com.sg/property-guides/property-insights-singapore), [JLL Insights](https://www.jll.com/en-us/insights), [Knight Frank Research](https://www.knightfrank.com/research) | 주제 탭, 대표 기사 1개, 최신 목록, 명확한 작성/갱신일 | `Latest / Policy / Market / Data Stories`, 16:9 lead 1개, 그 아래 행 중심 latest list와 topic filter | 공개 provider 상태, 500개 외부 headline feed, 동일 크기 카드 벽 |
| Policy Tracker | [GOV.UK update history](https://www.gov.uk/government/publications/how-to-rent), [MND Newsroom](https://www.mnd.gov.sg/newsroom/press-releases), [HDB News](https://www.hdb.gov.sg/hdb-pulse/news), [MAS measures](https://www.mas.gov.sg/news/media-releases/2023/measures-for-a-sustainable-property-market) | 현재 상태와 변경 이력을 분리하고 원문으로 돌아갈 수 있게 함 | 상태 chip, 발표/시행/변경/종료 timeline, 영향 대상, 이전 버전 diff, 공식 원문 link | 기사 발행일을 시행일처럼 보이게 하는 단일 날짜 |
| Data Story / Infographic | [Redfin Data Center](https://www.redfin.com/news/data-center/), [Rightmove House Price Index](https://www.rightmove.co.uk/news/house-price-index/), [OECD Housing](https://www.oecd.org/en/topics/housing.html) | headline insight→chart→methodology→download의 읽기 순서 | 본문 680–720px, chart는 최대 1120px breakout, title·period·sample·unit·source·data table·SVG/PNG download를 한 spec에서 생성 | tooltip만으로 수치를 숨기기, 정적 이미지와 본문 수치 불일치 |

실화면 점검에서 Rightmove의 가격 조회 첫 화면은 약 50px의 얇은 header 아래 중앙 검색 모듈 하나에 집중하고, 40px headline·16px 본문·48px 입력/버튼을 사용했다. PropertyGuru Insights는 글로벌 nav와 guide topic nav, breadcrumb/search, 중앙 intro, 16:9 대표 콘텐츠, 최신 목록 순으로 위계를 만든다. SignedPrice는 이 두 장점을 취하되 이중 고정 nav와 광고성 대표 콘텐츠는 줄인다.

### 공통 상호작용 계약

- 첫 viewport의 primary CTA는 화면당 하나다. 같은 위계의 CTA를 두 개 이상 배치하지 않는다.
- loading은 사용자가 클릭한 100ms 안에 skeleton·pending label·선택 highlight 중 하나로 반응한다. 이전 정상 데이터는 흐리게 유지하고 전체 화면을 비우지 않는다.
- empty, stale, partial, error를 서로 다른 상태로 표현하고 모든 상태에 다음 행동을 하나 제공한다.
- filter, map viewport, selected entity, result sort는 URL 또는 history state로 복원 가능해야 한다.
- desktop 화면을 mobile에 축소하지 않는다. Explore mobile은 list/map 전환, News mobile은 lead 1개+행 목록, infographic mobile은 chart+접근 가능한 data table로 재구성한다.
- 색상은 현행 white/navy/cobalt를 유지하고, 정보 위계는 색 추가보다 공간·크기·굵기로 만든다.

## 3. 출시 지도

| Release | 사용자에게 생기는 변화 | 내부 핵심 | 종료 gate |
| --- | --- | --- | --- |
| 0. 통합 기준선 | 현재 기능 손실 없음 | 최신 `origin/main` 통합, baseline 기록 | test/type/lint/build 결과와 live route inventory 기록 |
| 1. 공개 데이터 기반 | 장애 시에도 마지막 정상 근거 표시 | entity/evidence/capability/location/media projection | 서울 대표 district·building 경로 dual-read 일치 |
| 2. 화면 일관성 | 모든 페이지에서 같은 헤더·글자·정렬 | IA, token contract, Overview 6:6, 상태 UI | 1440/1024/390에서 전 화면군 계약 통과 |
| 3. 탐색 여정 | 목록↔지도↔Detail↔Check 왕복 | URL state, verified location, Singapore direct index | 뒤로가기·키보드·cold/warm 성능 gate 통과 |
| 4. Newsroom | 외부 피드 대신 검수된 News·Policy·Market·Data Stories | public content/source/policy/revision schema | 검수 전 item의 공개 route 0건 |
| 5. Infographic | 정책·가격 변화를 근거와 원값으로 이해 | 5개 HTML/SVG template, render hash | data table·모바일·evidence 일치 통과 |
| 6. 콘텐츠·성장 | 29개 첫 포트폴리오와 도구 연결 | EN 21, zh-CN 8, SEO/analytics | 색인·완독·Explore/Check 진입 측정 가능 |

---

### Task 1: Integrate the Approved Planning Branch with the Current Main Baseline

**Files:**

- Verify: `docs/superpowers/specs/2026-09-04-signedprice-three-market-experience-data-model-design.md`
- Verify: `docs/superpowers/specs/2026-09-04-signedprice-production-coherence-data-readiness-design.md`
- Verify: `docs/superpowers/specs/2026-09-04-signedprice-data-newsroom-content-system-design.md`
- Create: `docs/operations/2026-09-04-sitewide-baseline.md`

**Interfaces:**

- Consumes: latest `origin/main` plus the three approved spec files.
- Produces: a clean implementation branch and a baseline containing route inventory, command results, known failures, and active environment gates.

- [ ] **Step 1: Refresh refs and verify branch divergence**

```bash
git fetch origin --prune
git status --short
git log --left-right --oneline HEAD...origin/main
```

Expected: only known ignored/generated files may be outside Git; no user-authored tracked change is overwritten.

- [ ] **Step 2: Merge current main into the planning branch**

```bash
git merge --no-ff origin/main
```

Resolve only overlapping planning or route changes. Preserve the production versions of already merged photo, building-fact, and server-rendered-news fixes.

- [ ] **Step 3: Record the baseline**

`docs/operations/2026-09-04-sitewide-baseline.md` must contain:

```markdown
# SignedPrice Sitewide Baseline

- Git base: record the full output of `git rev-parse HEAD`
- Public routes: `/`, `/markets/`, `/prices/`, `/news/`, `/guides/`, `/kr/seoul/`, `/kr/seoul/explore/`, `/sg/singapore/`
- Required environments: local test, production-like build, Playwright fixture server
- Deferred: Dubai data ingestion, AdSense delivery, brokerage, investment advice
- Known release blockers: IA mismatch, public external-news desk, sub-12px UI, missing public entity projections, Singapore snapshot scan
```

- [ ] **Step 4: Run the existing baseline suite**

```bash
cd v2
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Record the exact pass/fail count and any environment-dependent skip. Do not convert a missing credential into a product pass.

- [ ] **Step 5: Commit the baseline**

```bash
git add docs/operations/2026-09-04-sitewide-baseline.md
git commit -m "docs: record sitewide renewal baseline"
```

### Task 2: Add the Compatible Public Entity and Evidence Core

**Files:**

- Create: `v2/apps/web/db/migrations/0003_public_evidence_core.sql`
- Create: `v2/apps/web/lib/public-data/public-evidence-types.ts`
- Create: `v2/apps/web/lib/public-data/public-evidence-repository.server.ts`
- Create: `v2/apps/web/test/public-evidence-migration.test.ts`
- Create: `v2/apps/web/test/public-evidence-repository.test.ts`
- Modify: `v2/apps/web/scripts/apply-content-database.mjs`

**Interfaces:**

- Consumes: existing `markets`, `districts`, `buildings`, `building_photos`, `transactions` and installed immutable artifacts.
- Produces:

```ts
export type PublicEvidenceRelease = Readonly<{
  id: string;
  marketId: 'kr-seoul' | 'sg-singapore';
  datasetId: string;
  periodStart: string;
  periodEnd: string;
  recordCount: number;
  rightsPolicyId: string;
  displayState: 'published' | 'stale' | 'withdrawn';
  sha256: string;
}>;

export type PublicEntityLocation = Readonly<{
  entityId: string;
  latitude: number;
  longitude: number;
  precision: 'rooftop' | 'parcel' | 'street' | 'district-centroid';
  verificationStatus: 'verified' | 'provisional' | 'rejected';
  rightsPolicyId: string;
}>;
```

- [ ] **Step 1: Write migration contract tests**

```ts
it('adds a non-destructive public evidence core', () => {
  const sql = migration('0003_public_evidence_core.sql');
  for (const table of [
    'geographies', 'property_entities', 'external_identifiers', 'datasets',
    'evidence_releases', 'market_capabilities', 'media_assets',
    'public_entity_locations', 'public_entity_media',
    'metric_definitions', 'metric_observations',
  ]) expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
  expect(sql).not.toMatch(/DROP TABLE|DROP COLUMN|TRUNCATE/i);
});
```

- [ ] **Step 2: Verify the tests fail**

```bash
cd v2
pnpm vitest run apps/web/test/public-evidence-migration.test.ts
```

Expected: FAIL because migration `0003_public_evidence_core.sql` does not exist.

- [ ] **Step 3: Add schema and backfill rules**

The migration must enforce these keys and checks:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS external_identifiers_source_value
  ON external_identifiers (source_id, external_type, external_value);

CREATE UNIQUE INDEX IF NOT EXISTS public_entity_locations_one_published_location
  ON public_entity_locations (entity_id)
  WHERE verification_status = 'verified';

ALTER TABLE evidence_releases
  ADD CONSTRAINT evidence_release_publication_check
  CHECK (display_state <> 'published' OR (record_count >= 0 AND sha256 ~ '^[a-f0-9]{64}$'));
```

Backfill `property_entities` from existing `buildings`, `geographies` from `districts`, and `media_assets` from `building_photos` with stable legacy IDs. Existing tables remain readable throughout the release.

- [ ] **Step 4: Implement the repository failover contract**

```ts
export type PublicEvidenceRepository = Readonly<{
  getRelease(datasetId: string): Promise<PublicEvidenceRelease | null>;
  getLocation(entityId: string): Promise<PublicEntityLocation | null>;
  listCapabilities(marketId: string): Promise<readonly MarketCapability[]>;
}>;
```

The DB reader returns `null` on a bounded connection failure and lets the caller use the installed release artifact. It logs market, route family, result state, duration, and cache state; it never logs full addresses or contract amounts.

- [ ] **Step 5: Run migration and repository tests**

```bash
cd v2
pnpm vitest run apps/web/test/public-evidence-migration.test.ts apps/web/test/public-evidence-repository.test.ts
pnpm typecheck
```

- [ ] **Step 6: Commit**

```bash
git add v2/apps/web/db/migrations/0003_public_evidence_core.sql v2/apps/web/lib/public-data v2/apps/web/test/public-evidence-migration.test.ts v2/apps/web/test/public-evidence-repository.test.ts v2/apps/web/scripts/apply-content-database.mjs
git commit -m "feat: add compatible public evidence projections"
```

### Task 3: Publish Verified Seoul Locations and Media without Request-Time Enrichment

**Files:**

- Create: `v2/apps/web/lib/public-data/entity-location-projection.server.ts`
- Create: `v2/apps/web/lib/public-data/entity-media-projection.server.ts`
- Create: `v2/apps/web/app/api/internal/public-entity-projection/route.ts`
- Modify: `v2/apps/web/lib/public-market/area-route-model.server.ts`
- Modify: `v2/apps/web/lib/public-market/building-route-model.server.ts`
- Modify: `v2/apps/web/lib/photos/building-photo-store.server.ts`
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/building-visual.tsx`
- Create: `v2/apps/web/test/public-entity-projection.test.ts`
- Modify: `v2/tests/e2e/area-explore.spec.ts`

**Interfaces:**

- Consumes: verified canonical entity, approved media, rights policy, current evidence release.
- Produces:

```ts
export type PublicEntityProjection = Readonly<{
  entityId: string;
  location: PublicEntityLocation | null;
  media: readonly PublicEntityMedia[];
  evidenceReleaseId: string | null;
  state: 'ready' | 'location-unverified' | 'rights-blocked' | 'unavailable';
}>;
```

- [ ] **Step 1: Write failing projection and E2E tests**

The unit test must reject provisional coordinates as building pins and keep `district-centroid` for district display only. The E2E test must select a building row, observe the matching selected pin and detail panel, navigate to Detail, then return with the same district, contract filter, and entity selection.

- [ ] **Step 2: Verify failures**

```bash
cd v2
pnpm vitest run apps/web/test/public-entity-projection.test.ts
pnpm playwright test tests/e2e/area-explore.spec.ts --grep "restores verified building selection"
```

- [ ] **Step 3: Implement background projection**

The internal route accepts only the existing `CRON_SECRET` bearer. It reads stored enrichment candidates, publishes only `verified` locations and approved rights-compatible media, and returns counts by `published`, `provisional`, `rejected`, and `rights-blocked`.

- [ ] **Step 4: Remove browser enrichment from the default path**

`area-route-model.server.ts` must join public locations before rendering. `area-explorer.tsx` renders pins only for ready locations. Unverified rows remain in one `Awaiting verification` group with a concrete reason and no simulated map movement.

- [ ] **Step 5: Verify fallback states**

```bash
cd v2
pnpm vitest run apps/web/test/public-entity-projection.test.ts apps/web/test/verified-building-photo-registry.test.ts apps/web/test/public-building-visual.test.tsx
pnpm playwright test tests/e2e/area-explore.spec.ts
```

- [ ] **Step 6: Commit**

```bash
git add v2/apps/web/lib/public-data v2/apps/web/app/api/internal/public-entity-projection/route.ts v2/apps/web/lib/public-market v2/apps/web/lib/photos v2/apps/web/components/public-market v2/apps/web/test/public-entity-projection.test.ts v2/tests/e2e/area-explore.spec.ts
git commit -m "feat: connect verified Seoul locations and media"
```

### Task 4: Build Direct Singapore Public Indices and Loading Boundaries

**Files:**

- Create: `v2/packages/singapore-property/src/public-index.ts`
- Export: `v2/packages/singapore-property/src/index.ts`
- Create: `v2/packages/singapore-property/test/public-index.test.ts`
- Modify: `v2/scripts/build-singapore-check-snapshots.mts`
- Modify: `v2/apps/web/lib/singapore/snapshot-repository.server.ts`
- Create: `v2/apps/web/app/(en)/sg/singapore/explore/[area]/loading.tsx`
- Create: `v2/apps/web/app/(en)/sg/singapore/explore/[area]/project/[projectId]/loading.tsx`
- Modify: `v2/apps/web/components/singapore/singapore-explorer.tsx`
- Modify: `v2/apps/web/components/singapore/singapore.module.css`
- Modify: `v2/tests/e2e/singapore.spec.ts`

**Interfaces:**

- Produces one versioned artifact with these exact maps:

```ts
export type SingaporePublicIndex = Readonly<{
  version: 'signedprice-singapore-public-index-v1';
  regionSummaryByCode: Readonly<Record<'CCR' | 'RCR' | 'OCR', SingaporeSegmentSummary>>;
  projectSummaryById: Readonly<Record<string, SingaporeProjectSummary>>;
  projectTransactionsByIdPeriod: Readonly<Record<string, readonly SingaporeSnapshotRecord[]>>;
  evidenceReleaseByScope: Readonly<Record<string, PublicEvidenceReleaseRef>>;
}>;
```

- [ ] **Step 1: Test deterministic index generation**

Assert that records with the same project and period map to one sorted immutable array, duplicate project IDs fail generation, and the index digest changes when any public record changes.

- [ ] **Step 2: Verify failure**

```bash
cd v2
pnpm vitest run packages/singapore-property/test/public-index.test.ts
```

- [ ] **Step 3: Generate and consume direct indices**

Replace request-time `snapshot.projects.find`, `snapshot.projects.filter`, and `snapshot.records.filter` calls with direct map access. Preserve the raw snapshot and its digest as the reproducibility layer.

- [ ] **Step 4: Add immediate pending feedback**

Both route segments receive fixed-size `loading.tsx` shells. Evidence links set `aria-busy` or selected pending state on activation. Unsupported evidence renders disabled text with the release limitation instead of a link to a 404.

- [ ] **Step 5: Measure the internal budgets**

```bash
cd v2
pnpm vitest run packages/singapore-property/test/public-index.test.ts apps/web/test/singapore-snapshot-repository.test.ts apps/web/test/singapore-routes.test.tsx
pnpm playwright test tests/e2e/singapore.spec.ts
```

Record cold route 3 runs and warm route 5 runs. Median pending feedback must be at most 100ms; warm heading at most 1.0s; cold heading at most 2.0s.

- [ ] **Step 6: Commit**

```bash
git add v2/packages/singapore-property v2/scripts/build-singapore-check-snapshots.mts v2/apps/web/lib/singapore v2/apps/web/app/'(en)'/sg/singapore/explore v2/apps/web/components/singapore v2/tests/e2e/singapore.spec.ts
git commit -m "perf: index Singapore public evidence routes"
```

### Task 5: Unify Global Header, Market Navigation, Typography, and Status UI

**Files:**

- Create: `docs/design/signedprice-screen-reference-dossier.md`
- Modify: `v2/apps/web/lib/site-copy.ts`
- Modify: `v2/apps/web/components/site-header.tsx`
- Modify: `v2/apps/web/components/site-header.module.css`
- Modify: `v2/apps/web/app/globals.css`
- Create: `v2/apps/web/components/market-ui/market-local-nav.tsx`
- Create: `v2/apps/web/components/market-ui/data-state.tsx`
- Modify: all public `.module.css` files named by `v2/apps/web/test/design-tokens.test.ts`
- Modify: `v2/apps/web/test/site-header-contract.test.tsx`
- Modify: `v2/apps/web/test/design-tokens.test.ts`
- Modify: `v2/apps/web/test/visual-system-contract.test.ts`
- Modify: `v2/tests/e2e/visible-foundation.spec.ts`

**Interfaces:**

```ts
export type GlobalNavigationItem = 'Markets' | 'Prices' | 'News' | 'Guides';
export type DataState = 'loading' | 'empty' | 'insufficient' | 'stale' | 'rights-blocked' | 'error';
export type MarketLocalNavItem = Readonly<{
  label: 'Overview' | 'Explore' | 'Check' | 'Rankings' | 'Corrections';
  href: string;
  state: 'available' | 'limited';
}>;
```

- [ ] **Step 1: Record the screen-reference decisions**

For Home, Overview, Explore, Detail/Check, News, Policy, and Data Story, record three current reference links, the observed desktop/mobile behavior, one principle to adopt, and one pattern to reject. Do not add third-party captures to public assets or copy a competitor component verbatim. The dossier is a decision log, not a mood board.

- [ ] **Step 2: Strengthen the contract tests**

Add assertions that every global page renders the same four labels in the same order, every market page has one global header plus one 48px local nav, no public CSS contains computed font sizes below 12px, and controls have a 44px minimum block size.

- [ ] **Step 3: Verify existing UI fails the new contract**

```bash
cd v2
pnpm vitest run apps/web/test/site-header-contract.test.tsx apps/web/test/design-tokens.test.ts apps/web/test/visual-system-contract.test.ts
```

- [ ] **Step 4: Implement one navigation model**

Remove public navigation entries for `Properties`, `Community`, `Invest`, and the separate `Insights` top-level item. Keep legacy routes reachable only through redirects or contextual links until their migration task completes. Derive local navigation from `market_capabilities` rather than hard-coded per-page arrays.

- [ ] **Step 5: Enforce typography and surface tokens**

Define `--text-meta: 0.75rem`, `--text-control: 0.875rem`, `--text-ui: 1rem`, `--control-min: 44px`, and the approved content/workspace frames. Replace 8–11px and 0.54–0.68rem public declarations with the closest semantic token. Limit radii to 0, 8px, 12px and functional pills.

- [ ] **Step 6: Replace duplicated data states**

Use `DataState` for map, media, DB, evidence, and content states. Each state renders one cause sentence and one available next action, without provider exception text.

- [ ] **Step 7: Verify three viewports**

```bash
cd v2
pnpm vitest run apps/web/test/site-header-contract.test.tsx apps/web/test/design-tokens.test.ts apps/web/test/visual-system-contract.test.ts
pnpm playwright test tests/e2e/visible-foundation.spec.ts
```

- [ ] **Step 8: Commit**

```bash
git add docs/design/signedprice-screen-reference-dossier.md v2/apps/web/lib/site-copy.ts v2/apps/web/components/site-header.tsx v2/apps/web/components/site-header.module.css v2/apps/web/components/market-ui v2/apps/web/app/globals.css v2/apps/web/components v2/apps/web/test v2/tests/e2e/visible-foundation.spec.ts
git commit -m "refactor: unify public navigation and readability"
```

### Task 6: Complete Homepage, Overview, Explore, Detail, and Check Coherence

**Files:**

- Modify: `v2/apps/web/components/home-editorial-sections.tsx`
- Modify: `v2/apps/web/components/home-editorial.module.css`
- Modify: `v2/apps/web/components/market-representative-photo.tsx`
- Modify: `v2/apps/web/components/market-representative-photo.module.css`
- Modify: `v2/apps/web/components/market-ui/market-shell.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/building-detail-page.tsx`
- Modify: `v2/apps/web/components/contract-check/contract-check-workspace.tsx`
- Modify: `v2/apps/web/lib/explorer-state.ts`
- Modify: `v2/apps/web/lib/navigation/explorer-selection.ts`
- Modify: `v2/apps/web/test/home-layout.test.ts`
- Modify: `v2/apps/web/test/market-shell-contract.test.tsx`
- Modify: `v2/apps/web/test/explorer-state-contract.test.ts`
- Modify: `v2/tests/e2e/area-explore.spec.ts`
- Modify: `v2/tests/e2e/contract-check.spec.ts`

**Interfaces:**

```ts
export type ExplorerJourneyState = Readonly<{
  level: 'city' | 'district';
  district: string | null;
  contract: 'sale' | 'jeonse' | 'monthly-rent';
  propertyType: string | null;
  selectedEntity: string | null;
}>;
```

- [ ] **Step 1: Add route-journey tests**

Test the full path `Home → market Overview → Explore → building Detail → Check → browser back`. The same market, district, contract, property type, and selected entity must survive in URL-backed state.

- [ ] **Step 2: Verify the journey currently fails**

```bash
cd v2
pnpm vitest run apps/web/test/explorer-state-contract.test.ts apps/web/test/home-layout.test.ts
pnpm playwright test tests/e2e/area-explore.spec.ts tests/e2e/contract-check.spec.ts --grep "journey"
```

- [ ] **Step 3: Simplify the homepage to five editorial regions**

Keep the three-city hero, three contextual actions, two `What changed` items, one lead Data Story, and 3–5 Guides. Remove the detached feature-card bundle. Dubai remains visible with research-only actions and no invented transaction figure.

- [ ] **Step 4: Normalize Overview media and evidence**

Use a 12-column 6:6 split, one 16:9 media frame, stored focal point, consistent caption, and a single aligned evidence band. A missing photo uses the same-sized neutral market-context panel.

- [ ] **Step 5: Connect Explore selection and Detail**

City level shows district evidence; district level shows verified building pins. Row and pin selection update one URL state and one detail panel. Detail uses the fixed order: media, identity, current evidence, history, comparable range, facts, proximity, sources, related actions.

- [ ] **Step 6: Pass entity context into Check and back**

`Check this building` carries `market`, `entity`, and `returnTo`. Comparable results link back to the same Detail or Explore selection. Invalid or unsupported entity context fails closed to a normal manual Check form.

- [ ] **Step 7: Verify and commit**

```bash
cd v2
pnpm vitest run apps/web/test/home-layout.test.ts apps/web/test/market-shell-contract.test.tsx apps/web/test/explorer-state-contract.test.ts apps/web/test/public-building-detail.test.tsx apps/web/test/contract-check-workspace.test.tsx
pnpm playwright test tests/e2e/area-explore.spec.ts tests/e2e/contract-check.spec.ts
git add v2/apps/web/components v2/apps/web/lib v2/apps/web/test v2/tests/e2e/area-explore.spec.ts v2/tests/e2e/contract-check.spec.ts
git commit -m "feat: connect the market decision journey"
```

### Task 7: Separate External Discovery from Published Editorial Content

**Files:**

- Create: `v2/apps/web/db/migrations/0004_newsroom_content_system.sql`
- Create: `v2/apps/web/lib/content/content-types.ts`
- Create: `v2/apps/web/lib/content/content-repository.server.ts`
- Create: `v2/apps/web/lib/content/source-repository.server.ts`
- Modify: `v2/apps/web/lib/news/news-persistence.server.ts`
- Modify: `v2/apps/web/lib/insights/content-article-store.server.ts`
- Modify: `v2/apps/web/app/api/internal/news-ingest/route.ts`
- Create: `v2/apps/web/test/newsroom-content-migration.test.ts`
- Create: `v2/apps/web/test/published-content-boundary.test.ts`

**Interfaces:**

```ts
export type ContentType = 'news-brief' | 'policy-update' | 'market-brief' | 'data-story' | 'guide';
export type EditorialStatus = 'draft' | 'fact-check' | 'review' | 'scheduled' | 'published' | 'archived';
export type EvidenceState = 'verified' | 'partial' | 'not-applicable' | 'withdrawn';

export type PublishedContentQuery = Readonly<{
  locale: 'en' | 'ko' | 'zh-CN';
  marketId?: 'kr-seoul' | 'sg-singapore';
  type?: ContentType;
  limit: number;
}>;
```

- [ ] **Step 1: Test the publication boundary**

The test must prove that an external item with `review_state = 'new'` has no canonical public route; a published article requires `reviewed_at`, `reviewed_by`, at least one primary source or `not-applicable` evidence, and an allowed locale.

- [ ] **Step 2: Verify failure**

```bash
cd v2
pnpm vitest run apps/web/test/newsroom-content-migration.test.ts apps/web/test/published-content-boundary.test.ts
```

- [ ] **Step 3: Add the compatibility migration**

The migration adds `external_news_items`, expands `content_articles`, and creates `content_sources`, `content_source_links`, `content_entity_links`, and `content_revisions`. Existing `news_articles` is preserved behind an ingestion compatibility repository until stored rows are migrated.

- [ ] **Step 4: Route all public reads through `content-repository.server.ts`**

`news-persistence.server.ts` becomes internal discovery only. `content-article-store.server.ts` delegates published reads to the new repository and keeps existing starter articles as a versioned deployment fallback.

- [ ] **Step 5: Verify and commit**

```bash
cd v2
pnpm vitest run apps/web/test/newsroom-content-migration.test.ts apps/web/test/published-content-boundary.test.ts apps/web/test/news-repository.test.ts apps/web/test/persistent-content-routes.test.ts
pnpm typecheck
git add v2/apps/web/db/migrations/0004_newsroom_content_system.sql v2/apps/web/lib/content v2/apps/web/lib/news/news-persistence.server.ts v2/apps/web/lib/insights/content-article-store.server.ts v2/apps/web/app/api/internal/news-ingest/route.ts v2/apps/web/test/newsroom-content-migration.test.ts v2/apps/web/test/published-content-boundary.test.ts
git commit -m "feat: separate news discovery from publication"
```

### Task 8: Build the Public Newsroom and Policy Tracker

**Files:**

- Create: `v2/apps/web/app/(en)/news/[slug]/page.tsx`
- Create: `v2/apps/web/app/(en)/news/policy/page.tsx`
- Create: `v2/apps/web/app/(en)/news/policy/[slug]/page.tsx`
- Create: `v2/apps/web/app/(en)/news/loading.tsx`
- Modify: `v2/apps/web/app/(en)/news/page.tsx`
- Create: `v2/apps/web/components/newsroom/newsroom-index.tsx`
- Create: `v2/apps/web/components/newsroom/newsroom-article.tsx`
- Create: `v2/apps/web/components/newsroom/policy-tracker.tsx`
- Create: `v2/apps/web/components/newsroom/policy-before-after.tsx`
- Create: `v2/apps/web/components/newsroom/policy-timeline.tsx`
- Create: `v2/apps/web/components/newsroom/newsroom.module.css`
- Create: `v2/apps/web/lib/policy/policy-types.ts`
- Create: `v2/apps/web/lib/policy/policy-repository.server.ts`
- Create: `v2/apps/web/test/newsroom-routes.test.tsx`
- Create: `v2/apps/web/test/policy-lifecycle.test.ts`
- Modify: `v2/apps/web/app/sitemap.ts`
- Modify: `v2/tests/e2e/seo-foundation.spec.ts`

**Interfaces:**

```ts
export type PolicyStatus = 'announced' | 'consultation' | 'enacted' | 'effective' | 'amended' | 'expired';
export type PolicyEventType = 'announcement' | 'consultation-open' | 'consultation-close' | 'enacted' | 'effective' | 'amended' | 'suspended' | 'expired';
```

- [ ] **Step 1: Write lifecycle and route tests**

Reject impossible state/date combinations, such as `effective` without an effective date or `expired` earlier than announced. Test `Latest / Policy / Market / Data Stories`, `All / Seoul / Singapore`, canonical query URLs, noindex internal desk, and legacy `/insights/{slug}/` redirects.

- [ ] **Step 2: Verify failure**

```bash
cd v2
pnpm vitest run apps/web/test/newsroom-routes.test.tsx apps/web/test/policy-lifecycle.test.ts
```

- [ ] **Step 3: Implement the public index**

The first viewport contains the News promise, four type tabs, three market filters, one lead article, and a row-based latest list. Remove provider credentials, connection status, ingestion count, and unchecked external summaries from all public components.

- [ ] **Step 4: Implement the tracker**

Group policy rows into `Effective soon` (next 90 days), `Recently changed` (past 90 days), `Active policies`, and `Archive`. Display announced, effective, expiry, and last-checked dates separately. Unknown effective dates render `Date not confirmed`.

- [ ] **Step 5: Implement article routes and redirects**

The article first viewport shows content type, market, headline, deck, author/reviewer, published/updated dates, lead evidence block, and at most three takeaways. Legacy valid Insights URLs permanently redirect to the matching Data Story canonical path.

- [ ] **Step 6: Verify and commit**

```bash
cd v2
pnpm vitest run apps/web/test/newsroom-routes.test.tsx apps/web/test/policy-lifecycle.test.ts apps/web/test/seo-platform-files.test.ts
pnpm playwright test tests/e2e/seo-foundation.spec.ts
git add v2/apps/web/app/'(en)'/news v2/apps/web/components/newsroom v2/apps/web/lib/policy v2/apps/web/test/newsroom-routes.test.tsx v2/apps/web/test/policy-lifecycle.test.ts v2/apps/web/app/sitemap.ts v2/tests/e2e/seo-foundation.spec.ts
git commit -m "feat: publish the SignedPrice policy newsroom"
```

### Task 9: Add Five Evidence-Linked Infographic Templates

**Files:**

- Create: `v2/apps/web/lib/infographics/infographic-types.ts`
- Create: `v2/apps/web/lib/infographics/infographic-validator.ts`
- Create: `v2/apps/web/lib/infographics/infographic-repository.server.ts`
- Create: `v2/apps/web/components/infographics/policy-change.tsx`
- Create: `v2/apps/web/components/infographics/policy-timeline.tsx`
- Create: `v2/apps/web/components/infographics/district-comparison.tsx`
- Create: `v2/apps/web/components/infographics/market-trend.tsx`
- Create: `v2/apps/web/components/infographics/cost-structure.tsx`
- Create: `v2/apps/web/components/infographics/infographic-frame.tsx`
- Create: `v2/apps/web/components/infographics/infographic.module.css`
- Create: `v2/apps/web/test/infographic-validator.test.ts`
- Create: `v2/apps/web/test/infographic-renderer.test.tsx`

**Interfaces:**

```ts
export type InfographicTemplate = 'policy-before-after' | 'policy-timeline' | 'district-comparison' | 'market-trend' | 'cost-structure';
export type InfographicSpec = Readonly<{
  id: string;
  template: InfographicTemplate;
  locale: 'en' | 'ko' | 'zh-CN';
  title: string;
  accessibleSummary: string;
  evidenceReleaseIds: readonly string[];
  unit: string;
  period: Readonly<{ start: string; end: string }>;
  series: readonly InfographicSeries[];
  relatedHref: string | null;
}>;
```

- [ ] **Step 1: Test validation and accessible rendering**

Reject missing evidence IDs, more than five series, mixed currencies without conversion provenance, empty labels, and values outside the linked release. Rendered output must include a visible title, summary, source/period/sample footer, SVG labels, and an expandable HTML data table.

- [ ] **Step 2: Verify failure**

```bash
cd v2
pnpm vitest run apps/web/test/infographic-validator.test.ts apps/web/test/infographic-renderer.test.tsx
```

- [ ] **Step 3: Implement shared frame and templates**

Use semantic HTML for policy and cost structures; SVG only for district comparison and market trend plot geometry. Never place a required value only in a tooltip. At 390px, reduce visible series or use small multiples rather than shrinking labels below 12px.

- [ ] **Step 4: Add reproducible render records**

Persist renderer version, spec hash, evidence release IDs, dimensions, format, generated date, and owned-object URL for publish-time PNG. The HTML/SVG spec remains the canonical web representation.

- [ ] **Step 5: Verify and commit**

```bash
cd v2
pnpm vitest run apps/web/test/infographic-validator.test.ts apps/web/test/infographic-renderer.test.tsx
pnpm typecheck
git add v2/apps/web/lib/infographics v2/apps/web/components/infographics v2/apps/web/test/infographic-validator.test.ts v2/apps/web/test/infographic-renderer.test.tsx
git commit -m "feat: add evidence-linked infographic templates"
```

### Task 10: Migrate Existing Content and Publish the First Editorial Portfolio

**Files:**

- Create: `v2/apps/web/content/portfolio-manifest.ts`
- Create: `v2/apps/web/content/en/`
- Create: `v2/apps/web/content/zh-CN/`
- Create: `v2/apps/web/scripts/audit-editorial-portfolio.mjs`
- Modify: `v2/apps/web/lib/guide/guide-content.ts`
- Modify: `v2/apps/web/lib/insights/editorial-content.ts`
- Modify: `v2/apps/web/components/home-editorial-sections.tsx`
- Create: `v2/apps/web/test/editorial-portfolio.test.ts`
- Modify: `v2/apps/web/test/guide-routes.test.tsx`
- Modify: `v2/apps/web/test/editorial-insights.test.tsx`

**Interfaces:**

- Produces exactly 29 reviewed launch records: EN 21 and zh-CN 8; Policy Update 8, Market Brief 5, Data Story 6, Guide 10.
- Every record includes locale, content type, market, source/evidence IDs, reviewed by/at, revision note, and related tool or explicit `null`.

- [ ] **Step 1: Inventory and classify existing public content**

The audit script outputs each existing route as `migrate`, `merge`, `archive`, or `redirect`. It fails if two published pages have the same reader question, source set, and conclusion.

- [ ] **Step 2: Write portfolio contract tests**

Assert the 29-item mix, source rules, six Data Story infographics, policy official-source coverage, locale-independent review, and valid internal links. Assert that a missing source, review, or evidence release blocks publication.

- [ ] **Step 3: Publish in three editorial batches**

Batch 1 contains Seoul renting/buying essentials and two policy updates. Batch 2 contains Seoul market briefs/data stories and related Explore links. Batch 3 contains Singapore policy/market pilots plus all eight zh-CN records. Each batch passes the portfolio audit independently before the next begins.

- [ ] **Step 4: Recompose the homepage**

Select two dated `What changed` items, one evidence-linked Data Story, and 3–5 task-based Guides from the manifest. Do not display empty categories, artificial popularity, or Dubai editorial promises.

- [ ] **Step 5: Verify and commit each batch**

```bash
cd v2
node apps/web/scripts/audit-editorial-portfolio.mjs
pnpm vitest run apps/web/test/editorial-portfolio.test.ts apps/web/test/guide-routes.test.tsx apps/web/test/editorial-insights.test.tsx apps/web/test/home-content.test.ts
git add v2/apps/web/content v2/apps/web/scripts/audit-editorial-portfolio.mjs v2/apps/web/lib/guide v2/apps/web/lib/insights v2/apps/web/components/home-editorial-sections.tsx v2/apps/web/test
git commit -m "content: publish reviewed newsroom portfolio batch one"
```

Use `batch two` and `batch three` in the second and third commit messages.

#### Initial 29-item portfolio manifest

The portfolio starts with these reader questions. Titles may be edited for clarity during human review, but locale, type, market, slug, and question remain stable so route and coverage tests are deterministic.

| # | Locale | Type | Market | Slug | Reader question |
| ---: | --- | --- | --- | --- | --- |
| 1 | en | policy-update | Seoul | `korea-rental-deposit-protection-status` | Which deposit-protection rules apply now, and when did they take effect? |
| 2 | en | policy-update | Seoul | `korea-foreign-property-reporting-status` | What must a foreign buyer report before and after a Korean purchase? |
| 3 | en | policy-update | Seoul | `seoul-land-transaction-permit-status` | Which Seoul purchases are currently affected by land-transaction permission rules? |
| 4 | en | policy-update | Seoul | `korea-housing-finance-rules-status` | Which current lending limits materially change a home budget? |
| 5 | en | policy-update | Singapore | `singapore-absd-policy-status` | Which Additional Buyer’s Stamp Duty rules apply by buyer profile? |
| 6 | en | policy-update | Singapore | `singapore-hdb-private-owner-waitout-status` | What changed in the HDB wait-out rule for private-home owners? |
| 7 | zh-CN | policy-update | Seoul | `kr-rental-deposit-protection-zh` | 当前韩国租房押金保护规则如何适用？ |
| 8 | zh-CN | policy-update | Singapore | `sg-absd-policy-zh` | 新加坡额外买方印花税目前如何适用？ |
| 9 | en | market-brief | Seoul | `seoul-sale-market-monthly-brief` | What changed in Seoul apartment sale evidence this month? |
| 10 | en | market-brief | Seoul | `seoul-jeonse-market-monthly-brief` | What changed in Seoul jeonse evidence this month? |
| 11 | en | market-brief | Seoul | `seoul-monthly-rent-market-brief` | How did deposit and monthly rent combinations move this month? |
| 12 | en | market-brief | Singapore | `singapore-private-market-quarterly-brief` | What changed across CCR, RCR, and OCR in the latest released quarter? |
| 13 | zh-CN | market-brief | Seoul | `seoul-rent-market-brief-zh` | 首尔全租与月租市场的最新公开数据发生了什么变化？ |
| 14 | en | data-story | Seoul | `seoul-district-price-distribution` | Why can two Seoul districts with similar medians still feel very different? |
| 15 | en | data-story | Seoul | `seoul-new-renewal-rent-gap` | How different are new and renewal rental contracts by district? |
| 16 | en | data-story | Seoul | `korea-deposit-monthly-rent-cost-structure` | How does changing the deposit alter the comparable monthly cost? |
| 17 | en | data-story | Singapore | `singapore-ccr-rcr-ocr-comparison` | What do CCR, RCR, and OCR transaction distributions actually show? |
| 18 | zh-CN | data-story | Seoul | `seoul-district-price-distribution-zh` | 首尔各区中位价相近时，价格分布为何仍会不同？ |
| 19 | zh-CN | data-story | Singapore | `singapore-region-comparison-zh` | CCR、RCR与OCR的成交分布有何差异？ |
| 20 | en | guide | Seoul | `rent-an-apartment-in-korea` | How does a foreign resident rent a home in Korea from search to move-in? |
| 21 | en | guide | Seoul | `wolse-vs-jeonse` | How should a renter compare wolse and jeonse on one basis? |
| 22 | en | guide | Seoul | `korea-rental-contract-checklist` | What should be checked before transferring a material rental deposit? |
| 23 | en | guide | Seoul | `read-seoul-sale-transactions` | How should reported Seoul sale transactions be read without overpricing one sale? |
| 24 | en | guide | Seoul | `compare-seoul-district-prices` | How can districts be compared without mixing period, type, and area? |
| 25 | en | guide | Seoul | `buy-property-in-korea-as-foreigner` | What is the verified sequence for a foreign buyer purchasing in Korea? |
| 26 | en | guide | Singapore | `read-singapore-private-transactions` | How should a buyer read project and regional transaction evidence in Singapore? |
| 27 | zh-CN | guide | Seoul | `rent-in-korea-zh` | 外国人在韩国租房应按什么步骤核验并签约？ |
| 28 | zh-CN | guide | Seoul | `wolse-vs-jeonse-zh` | 如何在同一成本口径下比较月租与全租？ |
| 29 | zh-CN | guide | Seoul | `buy-property-in-korea-zh` | 外国人在韩国买房应依次核验哪些事项？ |

### Task 11: Complete SEO, Performance, Analytics, and Pre-AdSense Release Gates

**Files:**

- Modify: `v2/apps/web/app/sitemap.ts`
- Modify: `v2/apps/web/lib/seo/public-route-registry.server.ts`
- Modify: `v2/apps/web/lib/public-metadata.ts`
- Modify: `v2/apps/web/components/public-json-ld.tsx`
- Create: `v2/apps/web/lib/analytics/editorial-events.ts`
- Create: `v2/apps/web/test/newsroom-seo.test.tsx`
- Create: `v2/apps/web/test/editorial-analytics.test.ts`
- Modify: `v2/tests/e2e/seo-foundation.spec.ts`
- Modify: `v2/tests/e2e/visible-foundation.spec.ts`
- Create: `docs/operations/2026-09-04-sitewide-release-gate.md`

**Interfaces:**

```ts
export type EditorialEvent =
  | 'article_complete'
  | 'article_to_explore'
  | 'article_to_check'
  | 'policy_source_open'
  | 'infographic_data_open';
```

- [ ] **Step 1: Test canonical, hreflang, structured data, and noindex boundaries**

Assert that every published locale has its own canonical, valid translation-group hreflang, visible and JSON-LD-matching `datePublished`/`dateModified`, reviewer/source metadata, and sitemap entry. Drafts, internal desk, external discovery items, and withdrawn content must be absent from sitemap and `noindex` where routable.

- [ ] **Step 2: Add privacy-safe journey events**

Events contain content ID, content type, locale, market, and destination family only. They never include address, quoted price, contract amount, search text, or user identity.

- [ ] **Step 3: Run the complete release suite**

```bash
cd v2
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm playwright test
pnpm check:rent-client-boundary
pnpm check:singapore-client-boundary
pnpm check:korea-proximity-client-boundary
```

- [ ] **Step 4: Verify production-like performance and visual routes**

At 1440px, 1024px, and 390px, inspect `/`, Seoul Overview/Explore/Detail/Check, Singapore Overview/Explore/project evidence, `/news/`, one Policy Update, one Data Story, and one Guide in EN and zh-CN where published. Record clipping, layout shift, interaction delay, source visibility, and empty/stale/error behavior.

- [ ] **Step 5: Complete the release gate document**

The release gate records exact commit, environment, command results, browser routes, cold/warm Singapore measurements, DB fallback result, last verified evidence dates, known limitations, and rollback commit.

- [ ] **Step 6: Commit**

```bash
git add v2/apps/web/app/sitemap.ts v2/apps/web/lib/seo v2/apps/web/lib/public-metadata.ts v2/apps/web/components/public-json-ld.tsx v2/apps/web/lib/analytics v2/apps/web/test/newsroom-seo.test.tsx v2/apps/web/test/editorial-analytics.test.ts v2/tests/e2e docs/operations/2026-09-04-sitewide-release-gate.md
git commit -m "test: complete sitewide newsroom release gate"
```

## 4. 운영 우선순위와 중단 기준

1. Release 0–2가 끝나기 전에는 신규 콘텐츠 대량 제작을 시작하지 않는다. 구조가 다시 바뀌면 콘텐츠 이관 비용이 두 번 든다.
2. Release 3은 Seoul 한 district의 완성 경로를 먼저 통과시킨 뒤 전 구와 Singapore에 확장한다.
3. 외부 뉴스 공개 제거는 Newsroom 전체 완성을 기다리지 않는다. 검수 전 외부 feed는 Release 4의 첫 배포에서 즉시 내부 desk로 이동한다.
4. 정책 사실은 한국의 경우 국토교통부·국가법령정보센터·관계기관 원문, 싱가포르는 MND·HDB·URA·MAS 원문을 우선한다.
5. DB 장애가 마지막 정상 공개 근거까지 지우면 출시를 중단한다.
6. infographic 수치가 본문 또는 evidence release와 다르면 해당 article 전체를 공개하지 않는다.
7. AdSense는 콘텐츠 수량만으로 신청하지 않는다. IA 일관성, 정책/데이터 출처, Core Web Vitals, 개인정보·동의, 29개 포트폴리오 gate가 모두 통과해야 한다.

## 5. 권장 실행 묶음

- **Wave 1 — 제품 정상화:** Task 1–5
- **Wave 2 — 핵심 여정 완성:** Task 6
- **Wave 3 — 편집 시스템 전환:** Task 7–9
- **Wave 4 — 콘텐츠와 성장:** Task 10–11

Wave별로 별도 PR을 만들고, 각 Task는 자체 테스트와 커밋을 가진다. Wave 1이 운영에 반영된 뒤 Wave 2를 시작하며, Wave 3의 schema 작업은 Wave 2 UI 작업과 코드 충돌이 없는 범위에서만 병행한다.
