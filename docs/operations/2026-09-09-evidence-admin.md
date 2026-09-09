# SignedPrice 자료 관리 화면

## 전용 비밀번호 분리 변경

관리화면 인증을 `EVIDENCE_ADMIN_SECRET`으로 분리한다. 기존 `CONTENT_ADMIN_SECRET`과 해당 키를 쓰는 운영 도구는 변경하지 않는다. 이 변경은 코드 배포와 아래 환경변수 설정을 모두 완료해야 활성화된다.

1. Vercel `signedprice` 프로젝트 → Settings → Environment Variables → Add Environment Variable.
2. Key: `EVIDENCE_ADMIN_SECRET`, Type: `Secret`, Environment: `Production`.
3. Value: 비밀번호 관리자로 생성한 32자 이상 무작위 값. 저장 전 비밀번호 관리자에 보관한다. 채팅·소스·로그에 노출하지 않는다.
4. 저장 후 이 변경 코드로 운영 배포한다. 이미 배포했다면 재배포한다.
5. `/admin/evidence/`의 **관리화면 비밀번호** 칸에 보관한 값을 입력한다. 기존 키는 사용할 수 없다.

새 값이 없거나 짧으면 로그인을 차단하며 기존 키로 대체하지 않는다. 기존 키로 발급한 세션도 사용할 수 없다. 전용 비밀번호를 변경하면 관리화면 세션만 무효화된다. 아래 `CONTENT_ADMIN_SECRET` 재사용 설명은 최초 배포 당시 기록이며 이 변경 배포 후에는 위 안내를 따른다.

## 사용 순서

배포 후 `/admin/evidence/`에서 사용한다. 현재 작업은 기능 구현이며 운영 DB 초기화·GitHub main 병합·Vercel 운영 배포는 별도다.

1. 서버에 설정된 관리자 키로 로그인한다.
2. **출처 관리**에서 기관·서비스 이름, HTTPS URL, 출처 유형을 등록한다.
3. 출처를 선택하고 검토 사유를 작성한 다음 **승인 → 확인**한다.
4. **자료 등록**에서 시장·항목·금액 성격·단위·지역·관측일·유효 종료일과 근거 URL을 입력한다. 건물·면적은 선택 입력이지만 없으면 활용 준비 점검에 표시된다.
5. **자료 검토**에서 지역·건물·출처를 검색하거나 시장·상태를 선택한다. 행의 건물/지역 이름을 누르면 근거 링크, 준비 점검, 검토 결정, 변경 이력이 열린다.
6. 값이 잘못되었으면 **등록값 정정**을 펼쳐 수정한다. 정정 사유와 당시 값이 이력에 남으며 상태는 검토 대기로 바뀐다.
7. 잘못된 자료는 제외하고, 더 이상 유지·활용하면 안 되는 자료는 철회한다. **철회는 복원할 수 없다.** 삭제 대신 최소 정형 값과 검토 이력을 보관하는 운영 모델이다. 물리적 삭제·법적 보존기간 정책은 이번 기능에 포함하지 않는다.

## 운영 활성화 체크리스트

- 기존 Vercel 프로젝트 `signedprice` / Next 앱 `v2/apps/web`를 그대로 사용한다. 별도 사이트를 생성하지 않는다.
- 서버 전용 `DATABASE_URL`은 기존 Neon 연결을 사용한다.
- 기존 `CONTENT_ADMIN_SECRET`은 최소 32자의 무작위 값이어야 한다. 값을 채팅·코드·NEXT_PUBLIC 환경변수에 노출하지 않는다. 키를 바꾸면 기존 내부 운영 도구에도 반영해야 하므로 자동 변경하지 않는다.
- 새 마이그레이션은 `0020_property_evidence_pool.sql`. `pnpm --filter @signedprice/web db:migrate`는 연결된 DB에 모든 미적용 마이그레이션을 실행하므로, 먼저 미적용 목록과 연결 대상이 맞는지 확인한다. 운영 적용 전 테스트 브랜치에서 검증한다.
- 기존 앱의 production prebuild가 마이그레이션을 자동 실행한다. 따라서 승인되지 않은 운영 연결로 빌드하거나 main에 병합하지 않는다. Preview prebuild는 마이그레이션을 건너뛴다.
- 승인된 운영 반영 후 `/admin/evidence/`를 열어 로그인 → 출처 등록·승인 → 자료 등록·검토·정정·철회를 작은 실제 허용 자료로 확인한다.

## 보안·데이터 경계

- 화면은 별도 한국어 루트 레이아웃을 사용하며 공개 페이지의 광고·방문자 분석 코드를 불러오지 않는다. 메타데이터는 noindex/nofollow다.
- 익명 방문자에게는 로그인 폼만 표시한다. 자료 API의 모든 읽기·쓰기는 서버에서 세션을 검증한다. API 응답은 private/no-store다.
- 로그인 세션은 HMAC 서명, HttpOnly, SameSite=Strict, HTTPS 환경에서 Secure, 최대 8시간이다. 변경 요청은 same-origin 검증을 거친다. 로그인 키를 localStorage/sessionStorage에 저장하지 않는다.
- 공유 운영 키 방식이다. 이력의 `operator-*`는 서버가 발급한 작업 세션 식별자이며 실제 개인 신원을 증명하지 않는다. 개별 직원 계정/RBAC는 미포함이다.
- 원문·댓글·작성자 필드를 허용하지 않는다. 지역·건물·출처 이름과 검토 사유에도 개인정보를 넣지 않는다. URL은 HTTPS이며 사용자정보·query·fragment를 허용하지 않는다. 서버에서 URL을 가져오지 않는다.
- Reddit은 자동 등록·수집하지 않는다. 운영자가 `https://www.reddit.com/r/dubairealestate/`를 커뮤니티 출처로 등록할 수 있다. 커뮤니티 자료와 미검증 제보는 승인해도 정성 참고 전용이다.
- 출처·자료 승인, 유효기간, 관측 시점, 건물·면적이 기본 점검 대상이다. 기초 요건 충족은 동일 조건의 비교 가능성·수익률·가격 정확성을 보장하지 않는다.
- 정정·검토는 버전이 일치해야 하며, 기록 변경과 감사 이력을 원자적으로 저장한다. 중복 관측은 충돌로 응답한다. 유효기간 연장이나 분류 변경만으로 중복을 우회하지 못한다.
- 만료는 UTC 종료일 다음 날부터 읽기 시점에 계산한다. 자동 수집·공개 인사이트·수익률 계산·물리적 삭제·사이트 자동 게시 기능은 없다.
- 자료는 25건, 출처는 100건씩 서버 페이지 처리하고 변경 이력은 최근 100건을 보여준다. 출처가 많으면 화면 상단의 이전/다음 출처 버튼으로 선택할 출처 페이지를 바꾼다.

## 검증 방법

`v2`에서 `pnpm test apps/web/test/evidence-admin-render.test.tsx apps/web/test/evidence-pool-contract.test.ts apps/web/test/evidence-pool-auth.test.ts apps/web/test/evidence-pool-routes.test.ts apps/web/test/evidence-pool-postgres.test.ts` 실행.

PostgreSQL 통합 테스트는 `EVIDENCE_TEST_PGLITE_MODULE`에 설치된 PGlite CommonJS 진입점 절대 경로를 지정한다. 모듈이 없으면 통합 테스트는 명시적으로 건너뛴다. 테스트 DB는 메모리 내 임시 DB이며 운영 Neon에는 쓰지 않는다.

프로젝트 의존성을 바꾸지 않는 재현 방법 (별도 임시 테스트 도구 디렉터리):

```bash
evidence_test_dir=$(mktemp -d)
npm install --prefix "$evidence_test_dir" --no-save --ignore-scripts @electric-sql/pglite@0.5.8
EVIDENCE_TEST_PGLITE_MODULE="$evidence_test_dir/node_modules/@electric-sql/pglite/dist/index.cjs" pnpm test apps/web/test/evidence-pool-postgres.test.ts
```

성공 결과에 PostgreSQL 테스트 5건이 **통과**로 표시되어야 한다. `skipped`는 DB 검증 통과가 아니다.

`pnpm --filter @signedprice/web typecheck` 실행. 빌드 검증은 운영 환경변수가 없는 상태에서 `v2/apps/web`의 `pnpm exec next build`로 실행하며, 운영 prebuild 마이그레이션을 호출하지 않는다.

실제 브라우저 클릭·화면 크기 검증과 배포 후 운영 검증은 이번 턴에서 실행하지 않았다.

## 이번 구현의 확인 결과

- 최종 전체 테스트: `EVIDENCE_TEST_PGLITE_MODULE=<PGlite 경로> pnpm test --maxWorkers=2` → 358개 파일 통과, 3개 파일 건너뜀 / 테스트 2,914건 통과, 기존 53건 건너뜀. 신규 관리 기능 32건은 PostgreSQL 5건을 포함해 모두 통과.
- 최종 `pnpm --filter @signedprice/web typecheck`: 통과.
- 전체 Next 빌드 2회 통과(2,980개 정적 페이지). 마지막 글자 크기 보정 후 코드 컴파일 모드도 통과. 생성물 정리 중 환경의 ENOTEMPTY 오류가 있어 최종 컴파일 때만 `cleanDistDir:false`를 임시 적용했고, 검증 후 원래 설정으로 되돌렸다. 이 임시 설정은 커밋에 포함하지 않는다. 배포 시에는 새 전체 빌드를 실행해야 한다.
- 첫 전체 테스트 실행에서는 빌드와의 동시 실행으로 시간 초과가 발생했고, 작은 글자 크기와 마이그레이션 목록 기대값도 보정했다. 제한된 병렬 실행으로 최종 전체 통과를 확인했다.
- 독립 코드 리뷰의 중요 지적 두 건(철회 출처의 자동 대체 선택, 출처 1,001건 이후 읽기 중단)을 회귀 테스트와 함께 수정했고 재검토에서 추가 차단 문제는 없었다.
- 위 구현 검증 시점에는 운영 변경과 원격 반영을 실행하지 않았다. 이후 배포 진행 상황은 아래 기록을 따른다.

## 2026-09-09 배포 진행 기록

- GitHub PR: https://github.com/007shp18-dot/koreahomeguide/pull/257 . 최신 main `c431a186` 위에 반영하여 탐색 성능 개선을 보존했다.
- 사용자 최종 승인 후 Neon migration `f09ce2c8-6ec5-41ff-973a-03e9e1359f90`을 운영 `signedprice-production` / `neondb` / `br-super-butterfly-b31hhh93`에 적용했다. 세 테이블과 마이그레이션 기록을 조회하여 확인했다.
- 테스트 브랜치에서 등록·감사 이력·버전 갱신·중복·외래키 검증에 성공했고 테스트 레코드는 롤백했다. 마이그레이션 완료 도구가 임시 브랜치 `br-gentle-math-b337ivhh`를 삭제했다. 기존 운영 자료는 삭제하지 않았다.
- 첫 원격 CI는 lint 단계에서 내부 링크와 effect의 동기 상태 갱신 규칙으로 실패했다. 내부 링크를 Next Link로 전환하고 로딩 시작은 사용자 이벤트에서, 로딩 종료와 결과 반영은 네트워크 응답 콜백에서 처리하도록 보정했다.
- 로그인: 운영 배포 완료 후 `https://www.signedprice.com/admin/evidence/` 접속 → Vercel signedprice 프로젝트의 Settings / Environment Variables에 설정된 `CONTENT_ADMIN_SECRET`을 관리자 키로 입력. 별도 아이디 없음, 8시간 세션. 운영 키의 존재·길이와 실제 인증 성공은 아직 확인하지 않았으며 키를 자동 변경하지 않았다.
- 이 기록 시점에서 수정 후 원격 CI와 운영 배포 완료 확인은 대기 중이다. 실제 완료 여부는 PR 및 Vercel 배포 상태로 확인한다.
