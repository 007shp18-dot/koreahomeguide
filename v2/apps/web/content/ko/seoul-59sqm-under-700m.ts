import type { EditorialPortfolioRecord } from '../portfolio-types';
import { SEOUL_59SQM_UNDER_700M } from '../en/seoul-59sqm-under-700m';

export const KOREAN_SEOUL_59SQM_UNDER_700M: EditorialPortfolioRecord = Object.freeze({
  ...SEOUL_59SQM_UNDER_700M,
  id: 'ko:seoul-59sqm-under-700-million-2026',
  locale: 'ko',
  title: '서울 55~65㎡ 아파트: 거래 중앙값 7억원 이하인 17개 그룹',
  deck: '전용 55~65㎡를 대상으로 한 2026년 7~8월 분석이다. 정확히 59㎡만 고른 자료는 아니다. 17개 그룹의 적격 거래 112건 중 110건이 7억원 이하였다.',
  readerQuestion: '2026년 7~8월 서울에서 전용 55~65㎡ 아파트가 7억원 안팎 또는 이하에 반복 거래된 곳은 어디인가요?',
  bodyMarkdown: `## 7억원으로 검색을 시작할 수 있었던 17곳

최근 서울 실거래에서도 7억원 예산에 들어오는 아파트가 확인됐지만, 대상 지역은 제한적이었습니다. 2026년 7~8월 중개거래 가운데 전용면적 55~65㎡, 3층 이상을 골랐습니다. 적격 거래 5건 이상, 중앙값 7억원 이하, 7억원 이하 거래 3건 이상, 8월 계약 1건 이상이라는 네 조건을 모두 충족한 원자료상 아파트 그룹은 9개 자치구 17개였습니다.

이 그룹들에는 적격 거래 112건이 있었고 110건이 7억원 이했습니다. 현재 매물을 찾기 위한 출발점이지, 해당 주택이 지금 매물로 나왔거나 매도자가 중앙값을 받아들인다는 뜻은 아닙니다.

## 예산 1억원이 늘어날 때 후보가 어떻게 달라졌나

| 그룹 중앙값 | 아파트 그룹 | 해당 그룹 거래 |
|---|---:|---:|
| 5억원 이하 | 5 | 31 |
| 5억원 초과~6억원 이하 | 4 | 28 |
| 6억원 초과~7억원 이하 | 8 | 53 |

중앙값 5억원 이하가 5개, 5억원 초과~6억원 이하가 4개, 6억원 초과~7억원 이하가 8개였습니다. 마지막 1억원 구간에 가장 많은 그룹과 전체 112건 중 53건이 들어갔습니다.

이 구간은 각 그룹의 두 달 중앙값을 기준으로 합니다. 개별 계약은 그룹 구간 밖에 있을 수 있습니다. 취득세, 중개보수, 대출비용과 수리비도 포함하지 않았으므로 총보유 현금이 7억원이라면 주택가격 상한은 더 낮아야 합니다.

## 가장 낮은 중앙값은 4억 2,300만원

구로구 개봉동 거성푸르뫼2는 4억 1,500만~4억 5,000만원 사이에서 5건이 거래돼 중앙값이 4억 2,300만원이었습니다. 도봉구 방학동 신동아아파트1은 5건, 중앙값 4억 3,300만원이었습니다. 같은 면적·거래량 조건을 통과했을 뿐 주택 상태, 교통 접근성이나 건물 품질이 같다는 의미는 아닙니다.

상한에 가까운 성북구 정릉풍림아이원은 10건 모두 7억원 이하였고 중앙값은 6억 6,000만원이었습니다. 관악산휴먼시아2단지는 8건, 중앙값 6억 4,250만원이었습니다.

벽산라이브파크와 상계주공1(고층)은 각각 7건 중 6건만 7억원 이했습니다. 그룹 중앙값은 후보를 거르는 기준이지 모든 세대가 예산 안에 있다는 약속이 아닙니다.

## 노원구에 17개 중 6개가 있었다

노원구는 6개 그룹, 적격 거래 39건으로 가장 많았습니다. 도봉구·구로구·금천구가 각각 2개였고, 나머지 5개 자치구에서 1개씩 확인됐습니다. 이는 선택한 예산, 면적과 거래량 조건의 결과이며 자치구별 저가주택 전체 수를 뜻하지 않습니다.

목록에 없는 자치구도 거래 5건, 8월 관측치 또는 중앙값 조건 중 하나를 충족하지 못했을 수 있습니다. 55~65㎡ 밖의 주택은 총가격이 더 낮더라도 이 분석에 포함되지 않습니다.

## 최근 실거래 17개 그룹

| 자치구 · 동 | 아파트 | 7~8월 중앙값 | 7억원 이하 / 전체 | 관측 범위 | 최근 계약 |
|---|---|---:|---:|---:|---|
| 구로구 · 개봉동 | [거성푸르뫼2](/ko/kr/seoul/explore/guro-gu/guro-gu-1hpnkb4/?transaction=sale&propertyType=apartment) | 4억 2,300만원 | 5 / 5 | 4억 1,500만~4억 5,000만원 | 2026-08-21 |
| 도봉구 · 방학동 | [신동아아파트1](/ko/kr/seoul/explore/dobong-gu/dobong-gu-slltg2/?transaction=sale&propertyType=apartment) | 4억 3,300만원 | 5 / 5 | 4억~4억 4,000만원 | 2026-08-25 |
| 도봉구 · 쌍문동 | [삼익세라믹](/ko/kr/seoul/explore/dobong-gu/dobong-gu-hrz9oz/?transaction=sale&propertyType=apartment) | 4억 5,000만원 | 7 / 7 | 4억 3,800만~4억 7,000만원 | 2026-08-27 |
| 금천구 · 시흥동 | [관악산벽산타운5](/ko/kr/seoul/explore/geumcheon-gu/geumcheon-gu-8fh0se/?transaction=sale&propertyType=apartment) | 4억 7,800만원 | 9 / 9 | 4억 5,000만~4억 9,000만원 | 2026-08-22 |
| 강서구 · 화곡동 | [중앙화곡하이츠](/ko/kr/seoul/explore/gangseo-gu/gangseo-gu-a2209k/?transaction=sale&propertyType=apartment) | 5억원 | 5 / 5 | 4억 4,900만~5억 2,000만원 | 2026-08-08 |
| 노원구 · 상계동 | [상계대림](/ko/kr/seoul/explore/nowon-gu/nowon-gu-k2up3i/?transaction=sale&propertyType=apartment) | 5억 5,000만원 | 6 / 6 | 5억 3,000만~5억 7,000만원 | 2026-08-08 |
| 노원구 · 상계동 | [은빛2단지](/ko/kr/seoul/explore/nowon-gu/nowon-gu-cb1d64/?transaction=sale&propertyType=apartment) | 5억 5,250만원 | 8 / 8 | 5억 2,000만~5억 8,000만원 | 2026-08-10 |
| 노원구 · 상계동 | [은빛1단지](/ko/kr/seoul/explore/nowon-gu/nowon-gu-11jpohh/?transaction=sale&propertyType=apartment) | 5억 5,900만원 | 7 / 7 | 5억 1,000만~5억 7,000만원 | 2026-08-22 |
| 구로구 · 구로동 | [구일우성](/ko/kr/seoul/explore/guro-gu/guro-gu-186e3xt/?transaction=sale&propertyType=apartment) | 6억원 | 7 / 7 | 5억 5,700만~6억 8,000만원 | 2026-08-18 |
| 노원구 · 상계동 | [상계주공16(고층)](/ko/kr/seoul/explore/nowon-gu/nowon-gu-1bxe3sc/?transaction=sale&propertyType=apartment) | 6억 2,250만원 | 6 / 6 | 6억~6억 3,200만원 | 2026-08-12 |
| 중랑구 · 신내동 | [동성1](/ko/kr/seoul/explore/jungnang-gu/jungnang-gu-fbwyfz/?transaction=sale&propertyType=apartment) | 6억 4,000만원 | 5 / 5 | 5억 3,000만~6억 5,000만원 | 2026-08-20 |
| 관악구 · 신림동 | [관악산휴먼시아2단지](/ko/kr/seoul/explore/gwanak-gu/gwanak-gu-19as52v/?transaction=sale&propertyType=apartment) | 6억 4,250만원 | 8 / 8 | 6억 2,000만~6억 9,000만원 | 2026-08-27 |
| 금천구 · 독산동 | [금천현대](/ko/kr/seoul/explore/geumcheon-gu/geumcheon-gu-g7ir4r/?transaction=sale&propertyType=apartment) | 6억 4,400만원 | 5 / 5 | 6억 1,800만~6억 8,000만원 | 2026-08-24 |
| 성북구 · 정릉동 | [정릉풍림아이원](/ko/kr/seoul/explore/seongbuk-gu/seongbuk-gu-ffsuq1/?transaction=sale&propertyType=apartment) | 6억 6,000만원 | 10 / 10 | 6억 1,000만~7억원 | 2026-08-26 |
| 노원구 · 상계동 | [상계주공9(고층)](/ko/kr/seoul/explore/nowon-gu/nowon-gu-9evdp6/?transaction=sale&propertyType=apartment) | 6억 6,700만원 | 5 / 5 | 6억 6,500만~6억 9,700만원 | 2026-08-06 |
| 강북구 · 미아동 | [벽산라이브파크](/ko/kr/seoul/explore/gangbuk-gu/gangbuk-gu-6unu7p/?transaction=sale&propertyType=apartment) | 6억 7,000만원 | 6 / 7 | 5억 9,000만~7억 1,000만원 | 2026-08-08 |
| 노원구 · 상계동 | [상계주공1(고층)](/ko/kr/seoul/explore/nowon-gu/nowon-gu-1fspe5e/?transaction=sale&propertyType=apartment) | 6억 9,000만원 | 6 / 7 | 6억 4,500만~7억 2,000만원 | 2026-08-08 |

관측 범위는 각 그룹에서 조건을 충족한 최저·최고 계약입니다. 층, 내부 상태, 향, 조망과 정확한 평면에 따른 품질 조정은 하지 않았습니다. 하나의 실제 단지가 원자료상 여러 식별자로 나뉠 수도 있으므로 비교 거래로 사용하기 전에 주소와 세대를 대조해야 합니다.

## 지금 이 목록을 활용하는 방법

생활권에 맞는 자치구를 고른 뒤 정확한 단지와 전용면적의 현재 매물을 확인하세요. 호가를 날짜가 표시된 계약의 층과 전체 관측 범위와 비교해야 합니다. 중앙값보다 높은 호가가 자동으로 과도한 것은 아니며, 관측 범위 안이라고 해서 자동으로 좋은 가격도 아닙니다.

7억원은 주택가격 기준입니다. 취득비용과 금융비용은 별도로 두세요. [서울 주택 매수 예산 가이드](/ko/guides/seoul-apartment-buying-budget-guide/)와 [서울 실거래 탐색](/ko/kr/seoul/explore/?transaction=sale&propertyType=apartment)에서 다음 확인을 이어갈 수 있습니다.

## 방법·자료 시점·출처

2026년 9월 7일 수집한 국토교통부 아파트 매매 상세자료를 사용했습니다. 2026년 7월 1일~8월 31일 중개거래, 전용면적 55~65㎡, 3층 이상만 남겼습니다. 해제 표시, 직거래, 토지임대부와 필수값이 없는 행은 제외했습니다. 동일한 공개 행은 보수적으로 하나로 합쳤지만 세대 식별자가 없어 실제 중복이라고 단정할 수는 없습니다.

게재 기준은 원자료상 아파트 식별자별 적격 거래 5건 이상, 중앙값 7억원 이하, 7억원 이하 계약 3건 이상, 8월 계약 1건 이상입니다. 짝수 표본의 중앙값은 가운데 두 가격의 평균입니다. 8월 자료는 이후 신고·해제·정정으로 달라질 수 있으며 수집 당시 미완료였던 9월 계약은 제외했습니다.

출처: 국토교통부 [아파트 매매 실거래 상세자료 API](https://www.data.go.kr/data/15126468/openapi.do). 계산과 해설은 SignedPrice가 작성했으며 국토교통부가 이 분석을 승인한 것은 아닙니다.

[84㎡ 10억원 이하 분석](/ko/news/seoul-84sqm-under-one-billion-2026/)은 84~85㎡와 10억원 상한을 사용합니다. 두 글은 서로 다른 주택 크기의 질문이며 가격지수가 아닙니다.`,
  authorName: 'SignedPrice 데이터팀',
  reviewedBy: 'SignedPrice 출처 및 계산 자동 점검',
  relatedHref: '/ko/news/seoul-84sqm-under-one-billion-2026/',
  revisionNote: '2026년 9월 9일 제목과 소개에 실제 전용 55~65㎡ 범위와 그룹 중앙값 기준을 명시했습니다. 기존 거래 자료와 계산은 유지했습니다.',
  canonicalHref: '/ko/news/seoul-59sqm-under-700-million-2026/',
  translationGroupId: SEOUL_59SQM_UNDER_700M.slug,
  sources: Object.freeze(SEOUL_59SQM_UNDER_700M.sources.map(source => Object.freeze({
    ...source,
    publisher: '국토교통부',
    title: '아파트 매매 실거래 상세자료 API',
  }))),
  infographic: SEOUL_59SQM_UNDER_700M.infographic === null ? null : Object.freeze({
    ...SEOUL_59SQM_UNDER_700M.infographic,
    id: 'ko-affordable-seoul-59sqm-under-700-million-2026',
    locale: 'ko',
    title: '2026년 7~8월 선정 59㎡ 단지 중앙값',
    accessibleSummary: '7억원 이하 최근 실거래 조건을 충족한 서울 아파트 그룹 17개 중 5개의 중앙값입니다.',
    series: Object.freeze(SEOUL_59SQM_UNDER_700M.infographic.series.map(series => Object.freeze({
      ...series,
      label: '7~8월 중앙값',
      values: Object.freeze(series.values.map(value => Object.freeze({ ...value }))),
    }))),
    sourceLabel: '국토교통부 신고 실거래; SignedPrice 계산',
    sampleLabel: '17개 그룹 중 선정 사례; 55~65㎡, 3층 이상, 적격 거래 5건 이상, 8월 계약 1건 이상',
    relatedHref: '/ko/kr/seoul/explore/?transaction=sale&propertyType=apartment',
  }),
});
