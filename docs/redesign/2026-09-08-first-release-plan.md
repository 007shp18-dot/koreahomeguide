# SignedPrice First Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 승인된 시안의 화면 구성을 기존 운영 기능에 적용하고 일본을 포함한 첫 개편을 단계적으로 출시한다.

**Architecture:** 기존 Next.js 앱과 Vercel/Neon을 유지한다. 공통 메뉴·화면, 탐색·건물 상세, 데이터 공개, 랭킹·콘텐츠를 독립 작업 묶음으로 나눈다. 기존 계산·식별자·URL 계약을 재사용하고 Sites 시안의 고정 데이터·실행 환경은 이식하지 않는다.

**Tech Stack:** 운영 저장소 `v2/apps/web`, Next.js/React/TypeScript, Vercel, Neon Postgres. 확인한 저장소 package manager `pnpm@11.19.0`, 운영 Node `24.x`; 기존 lockfile 유지.

**Spec:** [SignedPrice 개편 실행 기준](../../../SignedPrice-개편실행기준-2026-09-08.md).

## Global Constraints

- 기본 언어는 영어. 기존 한국어·중국어 콘텐츠와 실제 번역 경로를 보존한다.
- Explore는 **작은 썸네일을 붙일 수 있는 촘촘한 목록**이다. 큰 사진 카드 그리드는 채택하지 않는다.
- 큰 사진·갤러리는 **독립 건물 상세**에 집중한다. 건물과 실제 판매 중인 호실을 구분한다.
- 가격 랭킹은 **높은 가격부터** 표시한다. 대표 가격, 단일 최고 거래, 면적당 가격을 분리한다.
- 기존 Tools의 기능을 유지하고 정식 메뉴에 포함한다. Check an offer는 가격 검토로 가는 단축 동선이다.
- 기존 운영 Next.js/Vercel/Neon 구조를 유지한다. Sites 시안은 디자인 참고 자료이며 그 실행 환경과 고정 예제 데이터를 운영으로 통째로 옮기지 않는다.
- `sources/`는 읽기 전용 참고 자료다. 운영 수정은 실제 저장소의 분리된 작업 체크아웃에서 한다.
- 이미 키 별칭이 구현되어 있다. 서울 키 명칭 수정 코드를 반복해서 만들지 않는다.
- 일본 PR242는 아직 draft/open/unmerged다. 호출 성공과 저장·정기 수집 완료를 구분한다.
- 아래 명령은 실제 운영 저장소 작업 체크아웃의 `v2/`에서 실행한다. 이 계획 작성 시 테스트를 실행했다는 뜻은 아니다.

## 범위와 의존성

작업 0 이후 화면 트랙(1–3)과 데이터 트랙(4)은 병행할 수 있다. 작업 5는 각 데이터 공개 모델과 화면을 연결하고, 작업 6은 첫 운영 전환이다. 대규모 신규 스키마와 매입 지원 사업은 별도 변경 묶음으로 진행하며 UI 변경 PR에 숨겨 넣지 않는다.

### Task 0: 운영 기준과 검증 환경 고정

**Files:**
- Read: 저장소 및 하위 `AGENTS.md`, `v2/package.json`, `v2/apps/web/package.json`, `v2/apps/web/vercel.json`.
- Create: 작업 체크아웃의 `docs/redesign/2026-09-08-baseline.md`.

**Interfaces:** 운영 기준은 production SHA `6f85c351121967eec4c2d301ecc41b2ff43d62d6`. 이후 변경이 있으면 최신 운영 SHA와 차이를 기록한다. 다른 진행 중 작업과 수정 파일을 조율하고, 별도 체크아웃을 사용한다.

- [ ] 운영 도메인 배포와 main을 대조하고 이미 들어간 변경을 기록한다.
- [ ] 작업 체크아웃에 기존 도구 주소 7개, 도시별 Explore/Check/Shortlist, 기사·건물 상세·언어 전환 경로를 보존 목록으로 기록한다.
- [ ] 미리보기 DB를 운영 DB와 분리한다. 앱 prebuild는 설정에 따라 DB migration·identity index·production nearby seed를 실행하므로 운영 연결값으로 검증하지 않는다.
- [ ] 기존 검증 기준을 실행하고 실패가 있으면 개편 전 실패로 구분한다.

```sh
pnpm exec vitest run apps/web/test/site-navigation.test.tsx apps/web/test/tools-routes.test.tsx apps/web/test/property-scenario-context.test.ts
pnpm typecheck
```

**완료:** 기존 기능·배포·검증 실패의 기준점이 남고, 개발 환경이 운영 데이터를 변경하지 않는다.

### Task 1: 공통 메뉴와 시안 스타일

**Files:**
- Modify: `v2/apps/web/lib/navigation/site-navigation.ts`.
- Modify: `v2/apps/web/components/site-header.tsx`, `site-header.module.css`.
- Modify: `v2/apps/web/components/editorial-growth/editorial-growth-public-shell.tsx` 및 실제 사용 중인 화면 스타일.
- Verify: `v2/apps/web/test/site-navigation.test.tsx`, `site-header-contract.test.tsx`.

**Interfaces:** `globalNavigation(locale: SiteLocale)`와 `languageDestinations(pathname, search)`의 호출 계약을 유지한다. `SiteLocale` 값은 `'en' | 'ko' | 'zh-CN'`; 실제 중국어 URL prefix는 `/zh-cn/`다.

- [ ] 영문 주 메뉴를 아래 다섯 목적지로 정리한다. 기존 `/prices/`를 Explore 입구로 재사용하고, 첫 Rankings 링크는 유효한 기존 서울 경로를 사용한다. 시장별 랭킹 진입 확대는 Task 5에서 추가한다.

```ts
[
  { label: 'Explore', href: '/prices/' },
  { label: 'Rankings', href: '/kr/seoul/rankings/' },
  { label: 'Tools', href: '/tools/' },
  { label: 'News & Insights', href: '/news/' },
  { label: 'Guides', href: '/guides/' },
]
```

- [ ] Saved·현재 언어·Check an offer 동선을 유지한다. 한국어 목적지는 실제 기존 경로를 사용하고, 중국어 미지원 도구는 명시적인 영어 연결을 유지한다.
- [ ] 시안의 영문 산세리프·흰 바탕·짙은 글자·절제된 강조색·여백을 공통 헤더와 실제 운영 화면에 적용한다. 시안 `concept.css` 전체를 전역으로 붙이지 않는다.
- [ ] 메뉴·언어 전환·쿼리 보존의 기존 검증을 갱신한다. 색상·여백 값을 복사한 구현 반복 테스트는 새로 만들지 않는다.

```sh
pnpm exec vitest run apps/web/test/site-navigation.test.tsx apps/web/test/site-header-contract.test.tsx
```

**완료:** 기존 기능 주소에 접근 가능하고 실제 번역만 언어 선택에 나타난다. 모바일에서도 다섯 메뉴와 핵심 도구를 찾을 수 있다.

### Task 2: 네 도시 Home과 기존 Tools 재배치

**Files:**
- Modify: `v2/apps/web/components/design-review/editorial-growth-home.tsx`, `editorial-growth-home.module.css`.
- Modify: `v2/apps/web/lib/home/three-market-home-model.ts`.
- Modify: `v2/apps/web/components/tools/tools-hub.tsx`, `tools.module.css`.
- Read/Preserve: `v2/apps/web/components/passport/passport-entry.tsx`, `components/tools/property-scenario-workspace.tsx`, `components/tools/tool-analytics.tsx`.
- Verify: `v2/apps/web/test/editorial-growth-public-home.test.tsx`, `three-market-home-model.test.ts`, `tools-routes.test.tsx`, `property-scenario-context.test.ts`.

**Interfaces:** 운영 Home은 `EditorialGrowthPublicShell({surface, model})` → `EditorialGrowthHome({model, hrefs})`를 사용한다. `ToolsHub({locale})`, `TrackedToolLink`, `ToolEventOnMount`와 기존 tool 식별자를 유지한다.

- [ ] Home을 검색·네 도시 사진·랭킹·인사이트 진입 순서로 재구성한다. PassportEntry는 하단 또는 연결된 Tools에서 계속 사용할 수 있게 한다.
- [ ] 실제 컨텐츠의 최신 기사 선택·canonicalHref·분석 이벤트 속성을 보존한다. 가짜 기사나 모든 시장이 같은 데이터 깊이를 가진다는 설명을 추가하지 않는다.
- [ ] 도쿄 진입은 PR242의 유효한 `/jp/tokyo/` 화면과 함께 배포한다. 도쿄 선택을 서울 도구로 전환하지 않는다. 일본의 JPY/지역 거래 범위는 별도 capability로 표시한다.
- [ ] ToolsHub의 7개 기존 항목을 `Check a price / Compare / Costs & returns`로 재분류한다. 내부 `tool` ID와 href, 계산 입력·결과는 변경하지 않는다.
- [ ] 시장 변경 때 비용·임대료·면적·건물 맥락을 초기화하는 기존 동작과 근거 화면으로 돌아가는 링크를 확인한다.

```sh
pnpm exec vitest run apps/web/test/editorial-growth-public-home.test.tsx apps/web/test/three-market-home-model.test.ts apps/web/test/tools-routes.test.tsx apps/web/test/property-scenario-context.test.ts
pnpm exec playwright test tests/e2e/stable-home-tools.spec.ts tests/e2e/passport.spec.ts tests/e2e/rent-check.spec.ts
```

**완료:** Home이 승인된 시안 구조로 바뀌고 네 도시 진입이 작동한다. 모든 기존 도구와 기사에 계속 접근할 수 있다.

### Task 3: 작은 썸네일 목록과 독립 건물 상세

**Files:**
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx` 및 연결된 목록 스타일.
- Preserve: `v2/apps/web/app/(en)/kr/seoul/explore/page.tsx`, `lib/navigation/explorer-selection.ts`.
- Modify: `v2/apps/web/components/public-market/building-detail-page.tsx`, `building-detail-header.tsx`.
- Preserve: `v2/apps/web/app/(en)/kr/seoul/explore/[district]/[buildingId]/page.tsx` 및 다른 시장의 실제 상세 경로.
- Verify: `v2/apps/web/test/public-building-detail.test.tsx`, `public-building-route-model.test.ts`, `v2/tests/e2e/area-explore.spec.ts`.

**Interfaces:** `parseExplorerSelection()` → `buildPublicAreaExploreModel()` → `hydratePublicAreaExploreModelWithProjections()`를 보존한다. `q`, `contract`, `buildingPage`, `buildingId`, `neighborhood`와 기존 선택 필드를 유지한다. 선택 district에 속하는 building만 복원하는 검사도 유지한다.

- [ ] 기본 목록 행에 작은 썸네일·이름·위치·면적·가격·표본·Save를 배치한다. 사진 없는 행의 기능을 동일하게 유지한다.
- [ ] List/Map/Split과 상세 Table 보기의 기존 기능을 보존하고 지도 로딩을 사용 시점으로 늦춘다. 먼저 20개 단위 목록과 필요한 이미지 요청으로 동작을 확인한다.
- [ ] 승인된 사진과 실제 building ID가 맞는 대표 대상을 선정한다. 원본 크기 이미지를 목록에 전송하지 않고 허용된 썸네일을 사용한다.
- [ ] 큰 대표 사진과 확보된 갤러리를 독립 건물 상세에 배치한다. 실제 외관·시설·주변·호실·렌더의 종류를 표시한다.
- [ ] 상세 → 뒤로 가기에서 검색·선택·페이지·스크롤이 복원되고 Check에 동일 건물·조건이 전달되는지 확인한다.

```sh
pnpm exec vitest run apps/web/test/public-building-detail.test.tsx apps/web/test/public-building-route-model.test.ts
pnpm exec playwright test tests/e2e/area-explore.spec.ts
```

**완료:** 사진 유무와 관계없이 후보 비교가 가능하고, 대표 사진은 실제 대상에 연결된다. 기존 지도·표·검색·가격 비교 기능이 사라지지 않는다.

### Task 4: 기존 수집 검증과 일본 저장·공개

**Files:**
- Existing: `v2/apps/web/lib/market-data/refresh-service.server.ts`, `refresh-repository.server.ts`, `refresh-types.ts`, `refresh-window.ts`.
- Existing: `seoul-collector.server.ts`, `singapore-collector.server.ts`, `dld-csv.server.ts`.
- Existing schema: `v2/apps/web/db/migrations/0003_global_property_core.sql`.
- Japan source: PR242의 `app/api/japan/transactions/route.ts`, `app/(en)/jp/tokyo/page.tsx` 및 해당 테스트의 실제 diff를 기준으로 반영.
- Schedule: `v2/apps/web/vercel.json`.
- Verify: `market-data-refresh-repository.test.ts`, `market-data-refresh-service.test.ts`, `market-data-refresh-route.test.ts`, `market-data-refresh-window.test.ts`, `official-market-data-collectors.test.ts` (모두 `v2/apps/web/test/`).

**Interfaces:** 기존 10분 lease, 실행 이력, 2,000건 저장 묶음, inserted/updated/unchanged/unlinked 집계를 재사용한다. 키는 서버에서만 사용한다. 기존 source_records의 object_reference와 공개 evidence release 모델을 확장한다.

- [ ] 운영 allowlist·마지막 성공·실패 이유를 소량의 읽기 전용 조회로 확인한다. 이미 구현된 한국 키 별칭은 그대로 사용한다.
- [ ] 수집기 하나의 제한된 지역·기간부터 검증한다. 수신·저장·공개 수치를 대조한 후 다음 작업을 활성화한다.
- [ ] 허용된 원본 보관, 파서·요청·해시·실행 ID 기록, 미매칭 항목의 보류를 추가한다.
- [ ] 공개 전 검증과 공개 버전 승격을 데이터 저장과 분리한다. 실패한 후보 배치가 이미 공개된 가격을 바꾸지 않게 한다.
- [ ] 일본은 지역 기반 거래 저장 모델을 추가한다. 필수 건물 ID를 만족시키기 위한 가짜 property_entities를 생성하지 않는다. 동일 공개 필드를 가진 실제 복수 거래와 재수집 중복을 구분한다.
- [ ] 분기·통화·면적 정밀도, 정정·취소, 마지막 정상 버전, 분기 재조회 일정을 연결한다.

필수 실패 시나리오는 다음 여섯 가지다. 새 코드의 테스트에는 실제 입력 fixture와 예상 상태를 명시한다.

| 입력/실패 | 기대 상태 |
|---|---|
| 같은 원본을 다시 수집 | 공개 거래 중복 증가 없음 |
| 동일 공개 필드를 가진 복수 원천 거래 | 별개의 실제 거래 수를 임의로 줄이지 않음 |
| 취소·정정된 거래 | 이전 값과 변경 이력 보존, 최신 공개 집계에 올바르게 반영 |
| 1차 저장 묶음 성공 후 2차 묶음 실패 | 기존 공개 버전과 사용자 가격 불변 |
| 만료된 실행 lease | 복구 가능, 동시에 두 실행이 같은 공개 버전을 승격하지 않음 |
| 일본 건물명 없음·분기만 있음 | 지역 거래·quarter로 저장, 가짜 건물·계약일 없음 |

```sh
pnpm exec vitest run apps/web/test/market-data-refresh-repository.test.ts apps/web/test/market-data-refresh-service.test.ts apps/web/test/market-data-refresh-route.test.ts apps/web/test/market-data-refresh-window.test.ts apps/web/test/official-market-data-collectors.test.ts
```

**완료:** 한 번의 실제 제한 수집부터 공개 화면까지 추적 가능하고, 실패·재수집·정정을 처리한다. 새 스키마 변경은 이 데이터 묶음의 별도 검토 대상으로 관리한다.

### Task 5: 높은 가격 랭킹과 콘텐츠 연결

**Files:**
- Modify: `v2/apps/web/components/public-market/district-rankings.tsx`, `lib/public-market/rankings-route-model.server.ts`.
- Modify: 기존 서울·싱가포르 랭킹 route 및 국가별 공개 모델. 신규 공통 랭킹 진입은 공개 가능한 시장별 데이터를 사용해 구성.
- Modify: `v2/apps/web/app/(en)/news/`, `insights/`, `guides/`의 index와 해당 콘텐츠 컴포넌트.
- Preserve: 기사 `[slug]` 경로, Insights 편집 경로, 정책 상세, source/canonical metadata.
- Verify: `v2/apps/web/test/public-area-rankings-model.test.ts`, `public-area-rankings.test.tsx`; `v2/tests/e2e/rankings.spec.ts`, `newsroom.spec.ts`, `buying-guides.spec.ts`.

**Interfaces:** 순위는 같은 공개 버전·필터의 전체 집합을 서버에서 정렬한 후 페이지 처리한다. 뉴스/인사이트의 기존 기사 주소를 유지하며 도시·건물·조건을 Explore/Tools로 전달한다.

- [ ] Median sale price의 기본 방향을 high to low로 바꾸고 결측·최소 표본·취소 규칙을 보존한다. 가격 동률의 안정적인 순서를 정한다.
- [ ] Highest recorded sale과 Price per sqm은 유효한 데이터 단위에서만 제공한다. 단일 거래·지역 집계·건물 집계를 구분한다.
- [ ] 실제 제공 가능한 시장별 랭킹 진입을 연결하고 미준비 지표의 빈 본문·버튼을 기본 화면에서 제거한다.
- [ ] Insights / News / Policy를 같은 편집 화면의 세 탭으로 정리한다. Market Insight/Data Stories는 Insights 내부 유형으로 유지한다.
- [ ] 유효한 기사·가이드·정책 주소를 보존하고 관련 건물·검색 조건·도구 링크를 붙인다. 외부 수집은 중복·관련성·검토·발행 상태를 분리한다.
- [ ] Properties/Invest의 준비중 화면과 Community 확장 메뉴를 정리하되 Corrections/Contact/Trust/Privacy의 유효한 기능은 유지한다.

```sh
pnpm exec vitest run apps/web/test/public-area-rankings-model.test.ts apps/web/test/public-area-rankings.test.tsx
pnpm exec playwright test tests/e2e/rankings.spec.ts tests/e2e/newsroom.spec.ts tests/e2e/buying-guides.spec.ts
```

**완료:** 높은 가격순이 전체 공개 범위에서 일관되고, 콘텐츠를 읽은 뒤 실제 탐색·비교로 이동한다.

### Task 6: 첫 운영 전환

**Files:** 변경된 운영 파일·검증·경로 이전 목록을 묶음별로 검토. UI 소스와 데이터 공개 버전의 복구 지점을 기록한다.

- [ ] 분리된 환경에서 필요한 회귀 검증·타입 검사·운영 빌드를 실행한다.

```sh
pnpm typecheck
pnpm test
pnpm build
```

- [ ] 미리보기에서 Main → 도시 Explore → 건물/지역 상세 → Saved → Check → 비용 계산 흐름을 확인한다. 일본은 익명 거래 단위로 검증한다.
- [ ] 기존 계산 예제의 동일 결과, 모바일·키보드·글자 확대, 사진 없는 목록, 지도 늦은 로드, 필터/언어 URL을 확인한다.
- [ ] 원본 수집 실패와 부분 수집 실패에도 마지막 정상 공개 버전이 유지되는지 확인한다.
- [ ] 기존 URL 이전과 개인정보·약관·출처 링크를 확인한 후 단계적으로 운영 적용한다. 배포와 데이터 공개 성공을 확인하고 해당 버전을 기록한다.

**완료:** 실행 기준 문서의 출시 체크를 충족하고 원래 화면·정상 공개 버전으로 복구할 수 있다.

## 이번 계획의 자체 검토

- Home, 작은 썸네일 Explore, 독립 상세, 고가 랭킹, Tools, 콘텐츠, 언어·URL, 일본·공개 데이터, 출시 확인이 각각 Task 1–6에 연결되어 있다.
- 운영 소스의 실제 함수·경로를 기준으로 했으며 예전 정적 사이트와 시안 실행 환경은 변경 대상으로 사용하지 않는다.
- 실제 구현·검증·배포는 체크박스를 완료할 때 수행한다. 이 문서 작성으로 해당 작업이 완료된 것으로 표시하지 않는다.
