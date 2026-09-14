# 서울 단지 패널용 공개 커뮤니티 조사

확인일: 2026-09-14. 결과 파일: `v2/apps/web/content/property-reviews/community-seoul.json`.

공개 게시판의 본문·댓글, 공개 실거주 후기 페이지, 개인의 현장 방문기를 실제 열어 확인했다. 검색 요약만 확인된 글은 근거로 채택하지 않았다. 로그인하거나 글을 게시하지 않았고, 비공개 접근을 우회하지 않았다. 기존 단지 소개문을 다시 쓰는 작업과 별도로 수행한 조사다.

채택한 고유 원문 URL은 **21개**, 패널용 체크는 **21개**다. 한국어·영어·간체 중국어로 작성했으며 서울 **25개 프로필 모두**에 연결했다. 한 프로필에 연결된 체크는 최대 **2개**다. 이 숫자는 직접 입주민 검증률이나 주민 대표성을 뜻하지 않는다.

확정 작성일이 2024–2026년인 원문은 **6개**다. 포레온 후기 1개는 최근 상대 날짜만 표시돼 정확한 작성일을 `null`로 남겼다. 나머지 14개는 2009–2023년 자료다. 오래된 글에서는 지금의 상태를 단정하지 않고 현장 질문만 추렸다. 확인일과 글 작성일을 분리했으며, 방문기의 발행일을 실제 방문일로 바꾸지 않았다.

## 화면 문구와 근거의 관계

- 단지·지역에서 무엇을 직접 확인할지 제안한다. 특정 소음 수준, 현재 운영시간, 학교 배정, 주차 여유, 가격 우열, 수익률을 이 자료로 확정하지 않는다.
- 서로 다른 경험은 그 차이를 확인할 질문으로 바꿨다. 한 사람의 경험을 주민 전체의 평가로 쓰거나 댓글 수로 보편성을 주장하지 않았다.
- 포럼 이름과 인용 표시는 화면 문장에서 반복하지 않는다. 정확한 URL, 날짜, 경험의 범위는 JSON의 `sources`에 보관한다.
- 삭제 표시가 있는 댓글, 동일 댓글의 중복, 확인되지 않은 결함·범죄 전언, 거주민의 계층·국적에 관한 평가는 배제했다.
- 세대별 학교 배정, 공용부 운영과 출입, 승강기 사용 가능 여부는 별도 최신 확인이 필요하다. 과거의 편의·불편을 현재 사실로 재서술하지 않았다.

## 연결 범위 감사

`mappingScope`는 근거와 대상의 지리적 관계다. `sources.scope`의 개인 경험/공개 토론 분류와 다른 축이다. `named-property`도 거주 인증을 뜻하지 않는다.

| mappingScope | 체크 수 | 해당 signal ID |
|---|---:|---|
| `named-property` | 18 | `seoul-helio-daily-facilities`, `seoul-parkrio-open-window`, `seoul-ricenz-school-move`, `seoul-jamsil-academy-door`, `seoul-mapo-raemian-lift-route`, `seoul-mapo-prestige-everyday-gates`, `seoul-oksu-outside-grounds`, `seoul-centras-retail-lift`, `seoul-godeok-quiet-commute`, `seoul-foreon-facility-loop`, `seoul-gyeonghuigung-grocery-return`, `seoul-heukseok-return-slope`, `seoul-banpo-terminal-commute`, `seoul-one-bailey-view-quiet`, `seoul-eunma-beyond-refurbished-interior`, `seoul-daechi-actual-academy`, `seoul-rexle-play-deliveries`, `seoul-la-classy-school-walk` |
| `area-context` | 3 | `seoul-tenz-hill-size-refurbishment`, `seoul-forest-weekday-errands`, `seoul-banpo-riche-real-walk` |
| `comparable-setting` | 0 | 없음 |

`named-property` 항목에 연결된 고유 프로필은 **21개**다. 넓은 지역 범위의 항목에만 연결된 프로필은 `kr-acro-river-park`, `kr-acro-seoul-forest`, `kr-banpo-riche`, `kr-tenz-hill-1`의 **4개**다. 리체 자체는 원문에서 직접 거론되지만 퍼스티지·아크로리버파크 비교를 함께 연결한 항목이라 전체 항목을 보수적으로 `area-context`로 분류했다.

| 지역 묶음 | 연결 프로필 | 근거 범위의 한계 |
|---|---|---|
| 반포 | `kr-banpo-riche`, `kr-banpo-xi`, `kr-raemian-firstige`, `kr-raemian-one-bailey`, `kr-acro-river-park` | 리체·자이·퍼스티지·원베일리 직접 논의. 아크로리버파크는 지역 비교 질문만 연결. |
| 대치·도곡·삼성 | `kr-dogok-rexle`, `kr-raemian-daechi-palace`, `kr-eunma`, `kr-raemian-la-classy` | 대치·도곡은 주로 과거 자료. 라클래시는 2025년 후기의 공개 문단만 확인. |
| 잠실·가락 | `kr-helio-city`, `kr-parkrio`, `kr-jamsil-ricenz`, `kr-jamsil-els`, `kr-jamsil-trizium` | 엘스·트리지움 학원 질문은 개인 방문기의 명시적 지역 관찰. 트리지움 내부 거주 후기가 아님. |
| 고덕·둔촌 | `kr-godeok-gracium`, `kr-godeok-arteon`, `kr-olympic-park-foreon` | 고덕은 두 단지를 명시한 주변 생활 토론. 포레온은 개별 공개 후기. |
| 마포·아현 | `kr-mapo-raemian-prugio`, `kr-mapo-prestige-xi` | 출발 동과 이용 목적에 따른 경험 차이. 승강기와 출입 조건은 최신 확인 대상. |
| 왕십리 | `kr-centras`, `kr-tenz-hill-1` | 센트라스는 103동을 밝힌 후기. 텐즈힐은 기수 미상이라 1단지의 평면·도로 배치 근거로 쓰지 않음. |
| 옥수 | `kr-oksu-park-hills` | 단지를 명시한 과거 지역 토론. 현재 경사 체감·접근성 측정이 아님. |
| 서울숲·성수 | `kr-acro-seoul-forest` | 준공 전 지역 토론에서 평일 생활 질문만 연결. 아크로서울포레스트 주민 경험을 확보한 것으로 세지 않음. |
| 도심·서대문 | `kr-gyeonghuigung-xi-3` | 2·3단지를 명시한 과거 장보기 토론. 당시 점포가 지금도 영업한다고 추정하지 않음. |
| 흑석 | `kr-heukseok-xi` | 개인의 과거 현장 방문기. 주민 증언·현재 승강기 출입 검증과 구분. |

## 실제 열람 후 채택한 원문

아래 21개 URL은 원문 내용을 확인하고 채택한 고유 URL 수다. 검색 결과 노출 수나 실패한 재접속 횟수를 포함하지 않는다. 관련 후기 목록을 읽기 위해 열었던 보조 페이지는 채택 원문 수에 중복 집계하지 않았다. 출처별 상세 범위는 JSON의 `sources.context`에 보관한다.

| signal ID | 원문 | 작성일 | 내용 유형 |
|---|---|---|---|
| `seoul-helio-daily-facilities` | [원문](https://www.82cook.com/entiz/read.php?bn=15&num=3761102) | 2024-01-06 | 비교 토론·거주 경험 주장 |
| `seoul-parkrio-open-window` | [원문](https://www.82cook.com/entiz/read.php?bn=11&num=197315) | 2011-01-27 | 거주 경험 댓글은 2011-02-01 |
| `seoul-ricenz-school-move` | [원문](https://www.82cook.com/entiz/read.php?bn=15&num=1779713) | 2014-03-27 | 거주자의 이사 고민 |
| `seoul-jamsil-academy-door` | [원문](https://moringcalm.tistory.com/12) | 2023-12-06 | 개인 현장 방문기 |
| `seoul-mapo-raemian-lift-route` | [원문](https://www.82cook.com/entiz/read.php?bn=15&num=3024187) | 2020-06-13 | 단지별 경로 토론 |
| `seoul-mapo-prestige-everyday-gates` | [원문](https://realty.daangn.com/complexes/10890196/reviews/453906) | 2026-07-19 | 같은 페이지의 7월 27·30일 관련 후기 포함 |
| `seoul-oksu-outside-grounds` | [원문](https://www.82cook.com/entiz/read.php?bn=15&num=3102054) | 2020-10-26 | 지역 토론 |
| `seoul-centras-retail-lift` | [원문](https://realty.daangn.com/complexes/11131526/reviews/475405) | 2026-07-26 | 건물 번호를 밝힌 공개 후기 |
| `seoul-tenz-hill-size-refurbishment` | [원문](https://www.82cook.com/entiz/read.php?bn=15&num=2849358) | 2019-09-16 | 기수 미상 소유자의 이사 고민 |
| `seoul-godeok-quiet-commute` | [원문](https://www.82cook.com/entiz/read.php?bn=15&num=3615755) | 2023-03-14 | 주변 생활 토론 |
| `seoul-foreon-facility-loop` | [원문](https://realty.daangn.com/complexes/10650271/reviews/537118) | 정확한 날짜 미상 | 상대 날짜만 표시된 공개 후기 |
| `seoul-gyeonghuigung-grocery-return` | [원문](https://www.82cook.com/entiz/read.php?bn=15&num=2777047) | 2019-05-31 | 단지를 명시한 생활 토론 |
| `seoul-forest-weekday-errands` | [원문](https://www.82cook.com/entiz/read.php?bn=15&num=2367261) | 2017-06-16 | 아크로 준공 전 지역 비교 |
| `seoul-heukseok-return-slope` | [원문](https://moringcalm.tistory.com/11) | 2023-12-06 | 개인 현장 방문기 |
| `seoul-banpo-riche-real-walk` | [원문](https://www.82cook.com/entiz/read.php?bn=15&num=3027777) | 2020-06-19 | 단지와 생활권 비교 |
| `seoul-banpo-terminal-commute` | [원문](https://www.82cook.com/entiz/read.php?bn=15&num=3997305) | 2025-03-31 | 삭제되지 않은 댓글만 사용 |
| `seoul-one-bailey-view-quiet` | [원문](https://www.82cook.com/entiz/read.php?bn=15&num=4087098) | 2025-09-18 | 방문·선호 토론, 거주 미인증 |
| `seoul-eunma-beyond-refurbished-interior` | [원문](https://www.82cook.com/entiz/read.php?bn=15&num=3587349) | 2023-01-21 | 댓글은 1월 28일까지 |
| `seoul-daechi-actual-academy` | [원문](https://www.82cook.com/entiz/read.php?bn=15&num=3033151) | 2020-06-29 | 상반된 학원 도보 경험 |
| `seoul-rexle-play-deliveries` | [원문](https://www.82cook.com/entiz/read.php?bn=35&num=738176) | 2009-06-25 | 과거 입주 경험 주장 |
| `seoul-la-classy-school-walk` | [공개 문단](https://realty.daangn.com/complexes/10691488/topics/noise) | 2025-11-28 | 후기 목록에 표시된 문단만 열람 |

반포·대치·도곡 6개 원문은 병행 조사자가 본문과 댓글 끝까지 열람했다. 원베일리 글은 전체 5개 댓글과 그 뒤 로그인 안내까지 열람한 결과를 확인했다. 이후 다른 세션의 재접속 실패를 최초 열람 성공으로 바꾸어 세거나, 그 반대로 처리하지 않았다. 반포 출근 글에서는 삭제 표시가 없는 댓글 2·6·14만 채택 근거로 사용했다.

라클래시는 추가 조사에서 후기 목록의 공개 문단을 확인해 연결했다. 더보기 뒤의 전체 후기를 읽었다고 세지 않았으며, 개별 후기 URL이 최신 목록으로 표시돼 실제 문단을 확인한 주제별 목록 URL을 근거로 남겼다.

## 확보하지 못한 근거와 제외한 자료

| 대상·접근 시도 | 처리 |
|---|---|
| `kr-raemian-la-classy` | 추가 확인에서 2025-11-28 후기의 공개된 완결 문단을 확보해 연결. 더보기 뒤 전체 후기, 거주 인증, 학교 배정은 미검증. 검색 요약·스크립트 전용 결과는 제외. |
| `kr-acro-river-park` | 지역 비교 외의 직접 거주 후기를 확보하지 못함. 현재 입주민 의견으로 소개하지 않음. |
| `kr-acro-seoul-forest` | [공개 단지 페이지](https://realty.daangn.com/complexes/11122483)와 후기 경로 열람 실패. 과거 지역 질문만 연결. |
| `kr-tenz-hill-1` | 채택 토론에 기수 표기가 없음. 1단지 특정 동·면적의 현황에 일반화하지 않음. |
| 옥수 최신 토론 | [접근 실패 글](https://www.82cook.com/entiz/read.php?bn=15&num=4208471)은 검색 요약만으로 채택하지 않음. |
| 헬리오·둔촌 비교 | [접근 실패 글](https://www.82cook.com/entiz/read.php?bn=15&num=4087411)은 제외. |
| 센트라스 이전 토론 | [접근 실패 글](https://www.82cook.com/entiz/read.php?bn=15&num=2714713)은 제외하고 공개 상세 후기를 사용. |
| 포레온 커뮤니티 페이지 | [접근 실패 글](https://hogangnono.com/community/apts/apts-7408767)은 제외. 재건축 전 둔촌주공 경험이 섞인 별도 결과도 포레온 현황으로 쓰지 않음. |
| 흑석의 일부 후기 서비스 | 로그인 뒤에만 있는 본문은 읽었다고 세지 않음. 개인 방문기의 범위만 사용. |

검증은 JSON 파싱, 필수 필드·3개 언어, 서울 프로필 ID 일치, ID 중복, 프로필당 연결 수, 날짜 형식, 연결 범위 분류를 확인했다. 연구 결과는 서울 25개 단지 각각에 대한 최신 주민 설문이나 전체 100개 프로필의 개별 검증을 의미하지 않는다.
