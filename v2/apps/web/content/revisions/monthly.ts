import type { EditorialRevision } from '../editorial-revision';

export const MONTHLY_REVISIONS: Readonly<Record<string, EditorialRevision>> = {
  'seoul-monthly-2026-09': {
    ko: ['서울 7월 거래, 서초는 줄고 구로는 늘었다', '전체 증가분 225건보다 구별 차이가 컸다. 계약이 늘어난 곳과 같은 크기 집의 가격이 오른 곳도 달랐다.', `## 회복이라는 말에 가려진 차이

7월 서울의 분석 대상 매매는 6월보다 225건 늘었다. 그렇다고 모든 구에서 매수세가 돌아온 것은 아니다. 서초구는 176건에서 105건으로 줄었고 강남구도 202건에서 150건으로 감소했다. 반면 구로구는 287건에서 354건으로 늘었다.

서초의 감소율은 40.3%다. 구로는 67건 증가해 절대 증가분이 가장 컸다. 종로는 10건 증가로 34.5%를 기록했다. 비율만 보면 종로의 움직임이 크게 보이지만, 추가로 계약된 집의 수는 구로가 더 많았다.

{{table:0}}

7월의 전체 건수는 여전히 5월 8,293건보다 적었다. 한 달의 반등을 앞선 수준의 회복과 같은 말로 쓸 수는 없다.

## 어디서 계약이 늘었는가

{{table:1}}

강남·서초·송파를 합치면 645건에서 558건으로 13.5% 감소했다. 구로·관악·금천은 543건에서 667건으로 22.8% 늘었다. 이 표본에서는 남서권의 거래 증가와 강남 3구의 감소가 동시에 나타났다.

그렇다고 강남 매수자가 남서권으로 옮겼다고 말할 수는 없다. 자료는 계약된 집을 보여 줄 뿐 같은 사람의 이동을 추적하지 않는다. 예산대나 대출 조건이 원인이었는지도 이 집계만으로는 확인되지 않는다.

## 거래량과 별개로 본 84㎡ 가격

가격 비교는 다른 표본을 썼다. 같은 단지, 같은 반올림 면적의 84㎡ 이상 85㎡ 미만 거래를 묶어 2~4월과 5~7월을 비교했다. 두 기간 각각 세 건 이상인 묶음이 구별로 열 개 이상 있어야 결과를 냈다.

{{table:2}}

서대문은 30개 비교 묶음에서 5.5%, 동대문은 25개에서 5.4%, 송파는 18개에서 0.5%의 중앙 변화율을 기록했다. 이것은 구 전체 주택가격 상승률이 아니다. 조건을 통과한 84㎡ 비교군의 변화이며 층과 내부 상태까지 같게 맞춘 것은 아니다.

거래가 늘어난 구를 찾는 사람과 특정 단지의 매수 가격을 판단하는 사람은 다른 표를 봐야 한다. 구로의 추가 67건이 관심 단지의 가격 상승을 입증하지는 않는다. 그 단지의 비슷한 크기 집들이 얼마에 반복해서 계약됐는지까지 확인해야 협상에 쓸 숫자가 된다.

## 자료와 제작

국토교통부 원천 366,779행을 2026년 9월 7일 00:44~01:30 UTC에 수집한 고정본으로 계산했다. 건수는 계약 월 기준이며 취소·직거래를 제외한 중개 거래다. 동일하게 보이는 원천 행은 별도 거래일 수 있어 유지했다. 월별 건수는 전체 면적, 가격 비교는 84㎡ 이상 85㎡ 미만으로 모집단이 다르다. 가격 변화는 비교 묶음별 중앙값 변화의 중앙값이다. 최근 월은 추가 신고로 달라질 수 있으며 수집 시각이 원천의 완전성을 인증하지 않는다.`],
    en: ['Seoul’s July rebound bypassed Seocho and Gangnam', 'The city added 225 qualifying sales. Districts moved in opposite directions—and activity was not a price index.', `## An uneven return of contracts

Seoul's qualifying July sales exceeded June by 225. That increase did not extend to every district. Seocho fell from 176 to 105 contracts and Gangnam from 202 to 150. Guro moved the other way, from 287 to 354.

Seocho's decline was 40.3%. Guro added 67 sales, the largest absolute increase. Jongno added ten, producing a 34.5% rise from a smaller base. The percentage and the number of additional homes tell different parts of the story.

{{table:0}}

July remained below May's 8,293 contracts. A month-on-month rebound was not a return to that earlier activity level.

## Where the additional sales appeared

{{table:1}}

Gangnam, Seocho and Songpa combined fell from 645 to 558 contracts, down 13.5%. Guro, Gwanak and Geumcheon rose from 543 to 667, up 22.8%. In this sample, stronger southwestern activity coexisted with fewer sales in the three Gangnam-area districts.

This does not track buyers moving between them. The records identify transactions, not the same households switching destinations. Budget and lending explanations would require further evidence.

## A separate test for 84 sq m prices

The price comparison uses a narrower sample: the same estate and rounded area within 84 to under 85 sq m, comparing February–April with May–July. Each matched group needs three sales in each window; a district needs at least ten qualifying groups.

{{table:2}}

Seodaemun recorded a 5.5% median group-level change across thirty groups, Dongdaemun 5.4% across twenty-five and Songpa 0.5% across eighteen. These are not whole-district home-price indices. Even this narrower comparison does not equalise floor or interior condition.

Someone studying market activity and someone negotiating a particular apartment need different tables. Guro's additional 67 contracts do not establish appreciation in the shortlisted building. Repeated comparable sales there are the next evidence to examine.

## Sources and production

Fixed MOLIT extract of 366,779 raw rows collected 7 September 2026, 00:44–01:30 UTC. Contract-month counts retain brokered sales and exclude cancellations and direct trades. Identical-looking source rows are retained because they can represent different transactions. Activity covers all sizes; matched pricing uses 84 to under 85 sq m. Reported price change is the median of matched-group median changes. Later reports can revise recent months; extraction time does not certify source completeness.`],
  },
  'singapore-monthly-2026-09': {
    ko: ['싱가포르 재판매, 15구는 늘고 19구는 줄었다', '7월 콘도 재판매 630건. 거래의 지역별 이동은 보이지만 가격 상승 순위를 낼 표본은 부족했다.', `## 전체 건수는 비슷했지만

이번 조건을 통과한 콘도 재판매는 5월 627건, 6월 639건, 7월 630건이었다. 세 달의 전체 건수는 비슷하다. 지역 안으로 들어가면 변화가 훨씬 커진다.

{{table:0}}

15구는 6월 36건에서 7월 55건으로 52.8% 늘었고, 18구는 62건에서 76건으로 22.6% 증가했다. 반대로 19구는 75건에서 46건으로 38.7%, 10구는 54건에서 38건으로 29.6% 줄었다.

{{table:1}}

총량이 안정적이라고 해서 같은 프로젝트에서 같은 수의 집이 계속 팔린 것은 아니었다. 이 수치는 URA의 모든 민간 주택 거래가 아니라, 단일 유닛 콘도 재판매만 남긴 표본이다.

## 중앙값의 서로 다른 방향

전체 거래의 중앙 psf는 S$1,747에서 S$1,693.5로 3.1% 낮아졌다. 그동안 15구에서는 S$1,854.5에서 S$2,179로 17.5% 높아졌다. 어느 쪽도 그대로 소유자의 한 달 수익률이 되지는 않는다. 두 달에 팔린 집이 다르기 때문이다.

작은 고단가 주택의 비중이 달라지거나 특정 프로젝트의 계약이 몰려도 중앙값은 움직인다. 15구의 건수 증가와 단가 상승을 함께 보는 것은 유용하지만, 그 지역 모든 집이 더 비싸졌다는 결론과는 거리가 있다.

## 이번에는 가격 순위를 내지 않았다

같은 프로젝트·보유권·정확한 면적을 맞춰 2~4월과 5~7월을 비교했다. 두 기간 각각 세 건 이상이라는 조건을 충족한 비교 묶음은 도시 전체에 19개뿐이었다. 구별 열 개 이상이라는 공개 기준을 통과한 곳은 없었다.

그래서 지역별 가격 상승 순위를 만들지 않았다. 가격이 움직이지 않았다는 뜻이 아니라, 같은 조건끼리 비교할 자료가 부족하다는 뜻이다. 한 구의 큰 중앙값 변화에 투자 결론을 싣기보다 관심 프로젝트의 실제 면적과 최근 계약을 확인하는 편이 이 표본에 맞다.

## 자료와 제작

2026년 9월 2일 생성한 URA 기반 133,942행 고정본. 양의 가격·면적, 단일 유닛, strata, condominium resale만 포함한다. HDB·EC·별도 apartment 분류·landed·신규 분양·subsale·일괄 거래를 제외했다. 8월은 이번 월별 비교에서 제외했다. 원천의 완전성을 인증한 공식 총량이 아니다.`],
    en: ['Singapore resale activity shifted even as the total held steady', 'District 15 gained contracts and District 19 lost them. The matched sample was too thin for a price-growth ranking.', `## Similar totals, different districts

The selected condominium-resale sample contained 627 May sales, 639 in June and 630 in July. Those relatively steady totals concealed much larger local changes.

{{table:0}}

District 15 rose from 36 to 55 contracts, up 52.8%; District 18 rose from 62 to 76, up 22.6%. District 19 fell from 75 to 46, down 38.7%, and District 10 from 54 to 38, down 29.6%.

{{table:1}}

A stable total did not mean the same projects kept trading at the same rate. These are single-unit condominium resales under the stated filters, not all URA private residential transactions.

## Two median-price directions

The overall transaction median declined from S$1,747 to S$1,693.5 psf, down 3.1%. District 15 moved from S$1,854.5 to S$2,179, up 17.5%. Neither change is an owner's monthly return. Different homes sold in the two months.

A shift toward smaller high-psf units or a concentration of sales in one project can move the median. District 15's activity and unit-price increases are worth investigating together, but do not establish appreciation across every home there.

## Why there is no growth league table

Matching project, tenure and exact area for February–April versus May–July left only nineteen groups citywide with three observations in each window. No district met the publication threshold of ten qualifying groups.

The ranking is therefore withheld. That means insufficient comparable evidence, not unchanged prices. Investigating a shortlisted project's actual areas and contracts is a more defensible next step than investing on a large change in an unmatched regional median.

## Sources and production

URA-derived fixed extract of 133,942 rows generated 2 September 2026. Positive price and area, single-unit strata condominium resales only. HDB, EC, separately classified apartments, landed property, new sales, subsales and bulk deals excluded. August is outside this monthly comparison. These filtered counts do not certify the source's complete official total.`],
  },
  'dubai-monthly-2026-09': {
    ko: ['두바이 8월 거래 감소, 아르잔 완공 주택은 반대로 갔다', '오프플랜과 완공 주택을 합치면 지역 안의 다른 움직임이 사라진다.', `## 줄어든 시장 안에서 늘어난 계약

아르잔의 분석 대상 거래는 7월 256건에서 8월 191건으로 25.4% 줄었다. 여기까지만 읽으면 모든 주택 유형의 매수세가 약해졌다고 생각하기 쉽다. 하지만 완공 주택은 72건에서 87건으로 늘었다. 줄어든 것은 184건에서 104건이 된 오프플랜 쪽이었다.

같은 지역의 두 상품이 다른 방향으로 움직였다. 거주나 즉시 임대가 가능한 집을 찾는 사람과 인도까지 기다리는 집을 사는 사람에게 이 차이는 작지 않다.

## 도시 전체의 감소 폭

{{table:0}}

전체 표본에서는 완공 주택이 2,417건에서 2,079건으로 14.0%, 오프플랜이 8,629건에서 7,142건으로 17.2% 감소했다. 8월에도 오프플랜이 77.5%를 차지했다. 합계만 읽으면 시장의 큰 부분을 차지하는 오프플랜 흐름이 완공 주택의 사정을 덮을 수 있다.

{{table:1}}

JVC 완공 주택은 436건에서 306건으로 29.8% 줄었고, 두바이힐스는 69건으로 같았다. 아르잔의 증가는 도시 전체 완공 주택의 방향과도 달랐다. 건수의 변화가 해당 지역 모든 주택의 가격을 알려 주지는 않는다.

## 비교 가능한 가격은 어디에 남았나

3~5월과 6~8월의 프로젝트·지역·침실 수·정확한 면적·등록 상태를 맞춰 비교했다. 두 기간 각각 세 건 이상인 묶음이 지역별 열 개 이상 있어야 가격 변화를 공개했다.

{{table:2}}

조건을 통과한 지역별 가격 결과는 모두 오프플랜이었다. 완공 주택은 프로젝트 이름이 없는 행이 25.4%여서 같은 건물을 안정적으로 묶는 데 제약이 있었다. 오프플랜의 결과를 완공 주택의 수익률로 대신 쓸 수는 없다. 같은 프로젝트의 오프플랜도 지급 일정이나 인도 조건까지 같게 맞춘 비교는 아니다.

아르잔 사례에서 먼저 확인할 것은 반등한 완공 주택의 실제 계약이다. 감소한 지역 합계만으로 가격 양보를 기대하거나, 늘어난 건수만으로 앞으로의 상승을 기대할 근거는 아직 없다.

## 자료와 제작

DLD 2026년 1월 1일~9월 6일 원천 151,921행 중 주거용 Unit·Flat·Sales의 일반 Sale(Ready), Sell Pre Registration(Off-plan) 85,110행을 사용했다. 토지·빌라·지연 매매·증여·저당 등은 제외했다. INSTANCE_DATE 기준이며 원천 지역·등록 상태를 따른다. 건수는 고유 계약 수가 아닌 물건 행 수다. 14개 거래 ID가 반복되지만 완전 동일 행은 없어 유지했다. 가격 변화는 조건 통과 묶음별 중앙값 변화의 중앙값이며 인도·지급 조건을 통제하지 않는다.`],
    en: ['Dubai sales fell in August. Arjan’s ready homes moved the other way.', 'Combining off-plan and completed property can hide the direction relevant to the buyer.', `## Growth inside a declining total

Arjan's selected entries fell from 256 in July to 191 in August, down 25.4%. The combined number suggests a uniformly quieter market. Ready-property entries actually increased from 72 to 87. Off-plan entries fell from 184 to 104.

Two products in the same area moved in opposite directions. That matters to someone seeking occupation or rental income now, rather than a home awaiting delivery.

## The citywide decline

{{table:0}}

Across the sample, ready entries fell from 2,417 to 2,079, down 14.0%, and off-plan from 8,629 to 7,142, down 17.2%. Off-plan still represented 77.5% of August activity. Its weight can dominate a combined headline and obscure completed-property conditions.

{{table:1}}

JVC ready entries fell from 436 to 306, down 29.8%, while Dubai Hills held at 69. Arjan differed from the wider ready market as well as from its own off-plan segment. Those activity changes do not establish a price movement for every home in the area.

## Where a matched price comparison survived

The price test aligns project, area, bedrooms, exact floor area and registration status between March–May and June–August. Each group needs three observations in both windows and each area ten qualifying groups.

{{table:2}}

Every area-level result meeting that threshold was off-plan. Project names were missing from 25.4% of ready rows, limiting reliable building matching. Off-plan changes cannot stand in for ready-property returns. Even within an off-plan project, payment schedules and delivery terms have not been equalised.

Arjan's next useful evidence is the actual ready-property contracts behind its increase. A declining combined total does not automatically promise a discount, just as more completed sales do not promise future appreciation.

## Sources and production

DLD raw extract: 151,921 rows, 1 January–6 September 2026. Selected 85,110 residential Unit/Flat/Sales rows classified ordinary Sale (Ready) or Sell Pre Registration (Off-plan). Land, villas, delayed sales, gifts, mortgages and other categories excluded. Uses INSTANCE_DATE and source areas/statuses. Counts are property entries, not unique contracts: fourteen transaction IDs repeat, but no complete rows duplicate, so they are retained. Price changes are medians of qualifying group-level median changes; delivery and payment terms are not controlled.`],
  },
  'tokyo-older-apartments-shinagawa-renewal-2026': {
    ko: ['새로 꾸민 도쿄 구축, 건물도 새로워졌을까', '초자마루의 임대 건물 재생은 실내 공사와 건물 전체의 갱신이 얼마나 다른 일인지 보여 준다.', `## 벽지 너머에서 끝나지 않은 일

도쿄 구축 매물에서 새 주방과 밝은 바닥은 눈에 잘 들어온다. 배관을 어디까지 바꿨는지, 다음 외벽 공사에 쓸 돈은 충분한지는 사진에 잘 나오지 않는다. 내부가 새롭다는 이유만으로 오래된 건물의 부담까지 사라진 것은 아니다.

미쓰이부동산이 2026년 9월 발표한 리하이츠 초자마루는 약 50년 된 임대 건물의 골조를 활용한 재생 사례다. 사업자는 건물 조사와 보강을 포함한 갱신 과정을 설명했다. 개별 맨션 한 호수의 인테리어 교체와는 공사의 범위도 의사결정 구조도 다르다.

## 매수자가 이어서 볼 서류

{{table:0}}

구분 소유 주택을 산다면 전용 부분의 공사 내역과 공용 부분의 수선 계획을 나눠 봐야 한다. 관리조합의 장기 계획, 적립금과 예정된 추가 부담이 집값 바깥의 비용을 만든다. 실내 공사에 포함되지 않은 설비가 어디까지인지도 계약 전에 확인할 내용이다.

사업자의 건물 재생 사례는 오래된 건물을 계속 쓸 수 있다는 가능성을 보여 준다. 그 사업의 비용과 수익이 공개되지 않은 상태에서 다른 구축 매물의 투자 수익률까지 추정할 수는 없다.

잘 고친 집을 피하자는 이야기가 아니다. 무엇을 고쳤고 무엇은 남았는지를 가격과 함께 사야 한다. 방문 때 본 새 주방보다 관리 서류 한 장이 향후 지출을 더 크게 바꿀 수 있다.

## 자료와 제작

미쓰이부동산 2026년 9월 7일 리하이츠 초자마루 발표에 근거한 사례 해설이다. 공사·안전 관련 설명은 사업자의 해당 건물 발표 범위이며 다른 건물의 상태를 보증하지 않는다. 투자 수익률과 매각 가치 상승은 계산하지 않았다.`],
    en: ['A renovated Tokyo interior is not a renewed building', 'The Chojamaru rental-building project shows why the scope of the work matters as much as the finish.', `## Beyond the new kitchen

New flooring and a bright kitchen are easy to see in an older Tokyo listing. The extent of pipe replacement and the money available for the next facade repair are not. A fresh interior does not erase the obligations of an ageing building.

Mitsui Fudosan's September 2026 announcement described Reheights Chojamaru, reusing the structure of an approximately fifty-year-old rental building. The developer set out investigation and strengthening work as part of the renewal. Its scope and decision-making structure differ from refurbishing one individually owned apartment.

## The documents after the viewing

{{table:0}}

For a condominium purchase, separate work inside the unit from plans for common property. The owners' association's long-term programme, reserves and possible additional contributions create costs outside the purchase price. Establish which services the interior refurbishment did not replace.

The developer's project illustrates a way to keep an older building in use. Without its costs and financial outcome, it cannot establish a return available on another old apartment.

There is no reason to dismiss a well-renovated home. Buy with a clear account of what was fixed and what remains. The management documents may change future spending more than the kitchen seen during the viewing.

## Sources and production

Case interpretation of Mitsui Fudosan's 7 September 2026 Reheights Chojamaru announcement. Construction and safety descriptions remain the developer's claims about that building, not guarantees for others. No investment return or resale uplift is calculated.`],
  },
};
