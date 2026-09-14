# 관리자 사용성 개선 — 2026-09-14

## 확인 범위

- 운영 `/admin/`은 관리자 비밀번호 로그인 화면까지 확인. 인증된 운영 화면은 미확인.
- `EvidenceAdmin`, 기사 편집실, 관리자 인증, 기존 DB 마이그레이션과 운영 문서를 검토.
- 현재 코드의 관리자 인증은 공유 관리자 비밀번호와 8시간 세션. 개인별 운영자 계정/RBAC가 아니다.
- 브라우저에서 로컬 미리보기를 열려 했으나 `ERR_BLOCKED_BY_CLIENT`로 차단. 실제 클릭·반응형 시각 검수는 남아 있다.

## 참고한 기준

- Carbon Data table: https://carbondesignsystem.com/components/data-table/usage/ — 목록과 검색·필터·작업 도구의 배치, 충분한 작업 폭.
- SEED Side Panel: https://seed-design.io/components/side-panel — 목록 맥락을 유지하는 상세 패널.
- 프로젝트 `docs/design/signedprice-interface-rules.md` — 흰색·회색 바탕, 일관된 선택 상태, 키보드 포커스, 도시 순서.

## 반영한 수정

1. `/admin/` 첫 화면에 관리 홈: 기사 작성·자료 검토·수집 상태로 이동하는 작업 바로가기.
2. 메뉴를 시작 / 콘텐츠 / 자료 / 운영으로 구분하고 밝은 공통 색상으로 통일.
3. 선택 메뉴를 URL hash에 저장하여 새로고침 및 뒤로/앞으로 이동 시 복원. 글 편집 컴포넌트는 유지하여 내부 메뉴 이동으로 미저장 원고가 없어지지 않음.
4. 기사 편집과 조사·수집 화면이 자료 목록 API 성공 여부에 묶이지 않도록 분리. 기사 화면에서 자료 목록만 갱신하던 상단 새로고침 버튼 제거.
5. 글 목록에 도시 필터, 현재 조회 건수. 저장·발행·미리보기를 편집 상단 고정 도구로 이동. 예약 설정은 접어서 분리.
6. 자료 필터 초기화, 넓은 화면의 상세 검토 패널 고정, 좁은 화면의 메뉴 가로 탐색.
7. 자료 통계는 관리 홈과 자료 검토에서만 표시. 전체 사이트 통계처럼 표시하지 않음.

## DB 및 커뮤니티 연결

이번 수정은 DB 마이그레이션과 운영 데이터 변경이 없다. 기존 API 인증·승인·철회 정책을 유지한다.

- `property_pool_sources`, `property_pool_evidence`, `property_pool_events`: 출처·자료·검토 이력.
- `editorial_publication_queue`: 기사 원고와 발행 처리 상태.
- `editorial_uploaded_images`: 기사 이미지.
- `signedprice_evidence_responses`: 가격에 대한 구조화된 반응. 자유 게시글·댓글 저장소가 아님.

커뮤니티 도입은 별도 구현 범위다. 기존 시장/지역/건물 식별자에 게시글·댓글·신고를 연결하고, 공개 사용자 인증과 관리자 권한을 서버에서 분리해야 한다. 관리 홈에는 신고 대기 현황, 메뉴에는 커뮤니티 관리·사용자 관리를 실제 API가 준비된 뒤 연결한다. 미구현 메뉴나 가짜 신고 숫자는 표시하지 않는다. 공유 운영 세션 식별자를 개인 관리자 신원으로 취급하면 안 된다.

## 검증과 남은 범위

관련 렌더링·기사 관리 테스트 및 TypeScript 검사를 실행. 인증된 운영 UI와 모바일 클릭 검수, 운영 배포는 미실행. 실제 원고 저장·발행 또는 운영 DB 수정은 수행하지 않았다.

## Handoff continuation — 2026-09-14

- Restored the attached patch on remote main `91828979` in an isolated checkout; no conflicts and no unrelated feature changes.
- Added dashboard API tests covering real signed sessions (missing/forged/expired), invalid cities, missing database, exact job membership for all four cities, independent query failures, empty results, and distinct aggregation populations.
- Fixed Singapore job matching to `sg-private` (the collection job IDs), rather than the market ID `sg-singapore`.
- Failed dashboard refreshes clear stale values and show unavailable state; obsolete city requests are cancelled and cannot overwrite the active city.
- Added an authenticated, parameterized queue-slug lookup so dashboard articles outside the latest 100 remain reachable, without replacing unsaved editor content.
- Increased dashboard action labels to 14px and touch targets to at least 44px.
- Focused regression suite: 3 files, 28 tests passed. Queries use isolated test doubles, not production DB records.
- Local browser preview remains blocked by `net::ERR_BLOCKED_BY_CLIENT`. Authenticated visual, click and mobile verification is not complete. Temporary synthetic UI fixture and dependency symlinks are excluded from the commit.
- No automatic approval policy, database schema changes, article publication, or scheduler changes are included.
- Final TypeScript check passed. Targeted ESLint check has no errors; existing raw-image warning remains in the editor upload preview.

### CI follow-up

The first full CI run passed lint and types, with 3,468 passing tests and five failures. Two design-token failures came from inherited dashboard CSS declarations (11px text and unsupported radii); these declarations now comply with the existing checks. Three remaining failures were stale expectations from main's already-published contract-price headline and HUG/SGI source changes. Updated those explicit expectations without changing public content or weakening the checks. The seven affected test files now pass all 72 tests locally. The first Vercel preview completed successfully; final-head CI/build checks remain required.
