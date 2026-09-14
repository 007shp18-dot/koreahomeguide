import type { EditorialRevision } from '../editorial-revision';

export const MARKET_BRIEF_REVISIONS: Readonly<Record<string, EditorialRevision>> = {
  'singapore-condo-prices-2026-by-project': {
    ko: ['싱가포르 콘도 예산, 평균 가격보다 먼저 정할 것', '같은 예산으로 더 넓은 집을 살지, 더 중심에 살지. 프로젝트별 거래를 읽는 출발점은 그 선택이다.', `## S$150만이라는 검색 조건

S$150만을 입력하면 하나의 시장이 나올 것 같지만, 검색 결과에는 남은 임대 기간과 면적이 다른 집들이 섞인다. 매매가가 비슷하다는 이유만으로 같은 조건의 대안은 아니다. 작은 중심부 주택과 큰 외곽 주택 사이에서 무엇을 포기할 수 있는지부터 정해야 한다.

상반기 거래를 따로 추린 80~100㎡ 콘도 재판매 분석에서는 18개 프로젝트가 S$150만 이하의 중앙값 조건을 충족했다. 138건 가운데 135건이 예산 안에 들었다. 그 목록은 이 가격대에 반복된 거래가 있다는 근거다. 지금도 같은 가격에 같은 집이 나와 있다는 보장은 아니다.

## 단가가 낮아지는 두 가지 이유

면적이 커지면 총액은 오르면서 제곱피트당 가격은 내려갈 수 있다. 단가가 낮은 집을 고른 결과 예산을 넘는 일이 생기는 이유다. 같은 프로젝트에서도 넓이와 층, 거래 시점을 먼저 맞춰야 단가 차이가 협상에 쓸 만해진다.

보유권도 별개의 조건이다. 오래된 99년 임대권 주택이 프리홀드나 새 분양보다 저렴할 수 있지만, 그 차이를 전부 ‘저평가’로 부를 수는 없다. 남은 기간과 수선 상태, 대출 가능 조건을 함께 비교해야 한다. 거래 자료의 면적만으로 침실 수나 실제 배치를 확정해서도 안 된다.

## 도시 지수와 프로젝트 가격표

2026년 2분기 민간 주택 가격지수는 전분기보다 0.5% 올랐다. 비유주택만 보면 CCR은 1.8% 상승했지만 RCR은 1.2%, OCR은 0.1% 하락했다. 도시의 한 숫자 안에서도 방향은 갈렸다.

그렇다고 CCR의 특정 집에 1.8%를 더해 현재 가격을 계산할 수는 없다. 프로젝트 탐색에 담긴 여러 해의 계약은 그 단지에서 어떤 가격과 면적이 거래됐는지를 보여 준다. 분기 지수와 기간도 집계 방식도 다르다.

두세 곳으로 후보를 줄였다면 최근 유사 계약의 총액으로 돌아가자. 취득세와 자금 조달을 뺀 검색 예산이 아니라, 계약을 마칠 수 있는 전체 예산 안에서 비교할 차례다.

## 자료와 제작

프로젝트 탐색은 설치된 URA 기반 공개 자료, 가격지수는 URA 2026년 2분기 발표를 사용한다. 장기 프로젝트 요약과 분기 지수는 동일 표본이 아니다. S$150만 사례의 상세 필터와 표는 연결된 예산별 재판매 분석에 있다.`],
    en: ['Before comparing Singapore condo prices, choose the compromise', 'A larger home, a more central address or a different tenure: similar totals can buy very different things.', `## What S$1.5 million actually filters

Enter S$1.5 million and the results appear to define a market. In practice they mix sizes, locations and remaining leases. Two similar prices do not yet make two homes substitutes. A buyer needs to decide whether extra space or a more central address matters more.

Our separate H1 screen of 80–100 sq m condominium resales found eighteen projects meeting a median ceiling of S$1.5 million. Of their 138 qualifying sales, 135 were within the budget. This establishes repeated transactions in the band, not the availability of an equivalent apartment today.

## A lower unit price can cost more

A larger apartment can have a lower price per square foot and a higher purchase price. Sorting by psf can therefore move a buyer beyond the total budget. Align size, floor and contract date before treating the unit-price gap as negotiating evidence.

Tenure adds another distinction. An older 99-year leasehold home and a new launch or freehold apartment need not command the same price. Remaining lease, condition and financing constraints belong in the comparison. Recorded area alone cannot establish the number of bedrooms or the usefulness of a layout.

## An index is not a project price list

Singapore's private residential price index rose 0.5% in Q2 2026. Within non-landed homes, CCR rose 1.8%, while RCR fell 1.2% and OCR fell 0.1%. Even the broad regional directions differed.

None of those movements prices an individual apartment. The explorer's multi-year project records show what traded, at which sizes and totals. They do not have the same period or construction as a quarterly index.

After narrowing the search to two or three projects, return to recent comparable contracts and the full acquisition budget. A workable shortlist is worth more than a citywide average applied to a home it never described.

## Sources and production

Project exploration uses the installed URA-derived publication; index movements use URA's Q2 2026 release. The multi-year summaries and quarterly indices are different samples. The linked resale-budget analysis supplies the S$1.5 million screen's full filters and tables.`],
  },
  'tokyo-asking-price-vs-contracted-price-2026': {
    ko: ['도쿄 매물 가격에서 바로 할인율을 계산할 수 없는 이유', '높은 호가와 낮은 성약가는 같은 집을 따라간 결과일 때만 협상 차이를 설명한다.', `## 팔고 싶은 가격과 팔린 집의 가격

매물 사이트에는 집주인이 받고 싶은 가격이 올라온다. 성약 자료에는 거래를 마친 집이 남는다. 두 숫자가 다르다고 해서 그 차이만큼 깎을 수 있다는 결론이 나오지는 않는다. 애초에 다른 집들이 두 집계에 들어갈 수 있기 때문이다.

큰 신축 매물이 많이 남아 있고 작은 구축이 주로 팔렸다면, 집주인이 한 번도 가격을 내리지 않았어도 호가와 성약가의 간격은 벌어진다. 비싼 집이 오래 남는 기간에는 매물 재고와 새 계약의 성격도 더 달라질 수 있다.

## 협상 근거가 되는 비교

한 매물의 가격 변화를 보려면 먼저 같은 집인지 확인해야 한다. 주소와 호수, 면적, 최초 등록일이 이어지고 실제 성약가까지 연결돼야 개별 할인 폭을 계산할 수 있다. 지역 평균 두 개를 빼는 것으로 대신할 수 없다.

해당 집의 성약을 알 수 없다면 최근 비슷한 면적·연식·역 접근성의 거래로 범위를 좁힐 수 있다. 관리비와 수선적립금, 큰 수선 예정도 별도로 비교해야 한다. 내부를 새로 꾸민 집과 건물 전체의 수선 자금이 충분한 집은 다른 조건이다.

## 이 사이트에서 확인할 수 없는 것

도쿄 공개 거래 자료는 익명 지역 단위다. 이름이 있는 특정 맨션의 거래로 임의 연결하지 않는다. 따라서 주변에 표시된 가격을 그 건물의 실거래라고 읽어서는 안 된다.

관심 매물을 찾았다면 중개사에게 비교 계약의 시점과 면적, 같은 건물인지 여부를 물을 수 있다. 도시 전체의 높은 호가가 그 집의 적정가를 입증하지 않는 것처럼, 낮은 지역 성약가도 저절로 할인 청구서가 되지는 않는다.

## 자료와 제작

매물·성약의 구분은 REINS의 시장 자료와 공개 거래 자료의 집계 범위를 따른다. 이 개정판은 서로 다른 모집단의 평균 차이를 개별 할인율로 계산하지 않으며, 검증되지 않은 최신 월 수치를 인용하지 않는다.`],
    en: ['Tokyo’s asking-price gap is not your discount', 'A listing average and a completed-sale average can describe different homes, not a negotiation.', `## The seller's price and the homes that sold

Listings record prices owners ask. Completed-sale data records homes that found buyers. Subtracting one average from the other does not establish how far those owners negotiated.

Suppose large newer homes remain listed while smaller older apartments sell. The gap can widen without a single seller cutting a price. A stock of lingering listings and a month's completed transactions are especially unlikely to describe identical properties.

## Evidence worth taking to a negotiation

To measure a discount, follow the same home. Address, unit, area and listing history need to connect to the eventual contract. Two regional averages cannot substitute for that chain.

Without the specific contract, a buyer can narrow the comparison to recent sales with similar size, age and station access. Recurring management charges, repair reserves and planned major works require a separate comparison. A renovated interior and a well-funded building are not the same benefit.

## The boundary of the explorer

Tokyo's public transaction observations are anonymised area records. SignedPrice does not assign them to a named mansion simply because it stands nearby. An area's price display is not that building's verified sale history.

For a shortlisted home, ask when the comparable transactions occurred, how large the units were and whether they came from the same building. A high citywide asking price does not validate the seller's number. A lower regional contract average does not create an automatic discount either.

## Sources and production

The distinction follows REINS market reporting and the scope of the public transaction data. This edition does not calculate individual discounts from different populations or repeat unverified latest-month figures.`],
  },
  'seoul-sale-market-monthly-brief': {
    ko: ['서울 거래가 늘었다면, 어느 집이 더 팔렸는가', '계약 수의 회복과 가격의 상승은 따로 확인해야 한다.', `## 거래량 뒤에 있는 주택 구성

서울에서 지난달보다 계약이 더 많이 잡혔다는 소식은 매수자가 돌아왔는지 궁금하게 만든다. 그러나 늘어난 거래가 어느 가격대, 어느 면적에 몰렸는지 알기 전에는 시장 전체의 방향을 정하기 어렵다.

작은 외곽 주택의 계약이 늘면 거래량은 오르면서 전체 거래금액 중앙값은 내려갈 수 있다. 반대로 비싼 집 몇 곳의 거래 비중이 커지면 중앙값은 올라가도 대부분 단지의 가격은 그대로일 수 있다.

## 두 장의 표가 필요한 이유

첫 번째는 계약 월별 건수다. 매수자가 실제로 계약한 시점을 보되, 최근 달에는 신고가 계속 들어올 수 있다는 점을 남겨 둔다. 수집 월별 건수는 신고가 들어온 속도를 보여 줄 뿐 같은 질문에 답하지 않는다.

두 번째는 같은 단지·비슷한 면적에서 반복된 가격이다. 계약 수를 함께 적고, 비교할 표본이 부족하면 상승률을 만들지 않는다. 구 전체 평균보다 범위는 좁지만 관심 있는 집의 협상에 더 가까운 자료다.

이번 공개 자료를 볼 때도 관심 구의 건수와 해당 단지의 유사 계약을 나란히 보자. 서울의 거래 회복 여부와 내가 살 집의 가격은 이어질 수 있지만, 같은 숫자로 확인할 수는 없다.

## 자료와 제작

설치된 국토교통부 기반 공개 자료의 계약일·취소 처리·시장 구분을 따른다. 최신 계약 월은 추가 신고로 바뀔 수 있으며, 사이트의 필터 통과 건수를 공식 전체 거래량으로 부르지 않는다.`],
    en: ['More Seoul sales—but which homes changed hands?', 'A recovery in contract counts and an increase in comparable prices need separate evidence.', `## Look inside the count

More Seoul contracts than last month can suggest returning buyers. Before calling it a broad recovery, ask which sizes, districts and price bands contributed the increase.

More small outer-district sales can lift activity while lowering the median purchase price. A greater share of expensive homes can raise the median without a typical apartment becoming more valuable. Neither outcome requires a contradiction in the data.

## Two comparisons, not one headline

First compare counts by contract month. Recent months remain open to later reports. Grouping by the date a record arrived instead answers a question about reporting, not when buyers agreed to purchase.

Then compare repeated sales within the same building and similar size. Keep the observations beside the price change. Where the sample is insufficient, withhold the estimate instead of filling the gap with the district average.

For a buyer, the useful pairing is the district's activity and the shortlisted property's comparable contracts. A citywide recovery and the price of a particular home may be related. They cannot be established with the same number.

## Sources and production

Uses contract dates, cancellation handling and market categories in the installed MOLIT-derived publication. Recent contract months can change. Counts surviving the site's filters are not labelled the official total.`],
  },
  'seoul-jeonse-market-monthly-brief': {
    ko: ['전세금이 싼 집, 돌려받을 조건도 같은가', '주변 계약은 가격을 비교하는 자료다. 보증금의 안전성을 대신 증명하지는 않는다.', `## 먼저 같은 계약끼리

같은 면적의 집인데 보증금이 크게 낮아 보이면 월세가 붙었는지부터 확인해야 한다. 전세와 보증부 월세를 한 목록에서 읽으면 계약 구조의 차이가 가격 차이처럼 보인다.

전세끼리도 신규와 갱신을 나눌 필요가 있다. 같은 집에서 이어진 계약과 지금 새로 들어갈 사람이 맺는 계약은 협상 조건이 다를 수 있다. 갱신 거래가 많아진 달의 중앙값을 새 세입자의 예산으로 바로 사용할 수 없는 이유다.

## 싼 가격 다음의 확인

유사 계약은 보증금이 주변에서 어느 위치인지 알려 준다. 임대인이 계약 종료 때 돌려줄 수 있는지까지 알려 주지는 않는다. 소유권과 선순위 권리, 실제 계약의 보장 조건은 해당 집의 최신 서류와 적용 기준으로 별도 확인해야 한다.

보증금 반환 보증도 모든 집에 자동으로 붙는 상품은 아니다. 가입 가능 여부를 가격표에서 추측하지 말고 해당 기관의 심사와 계약 조건으로 확인해야 한다. 시세보다 낮다는 설명이 이 절차를 생략할 이유가 되지는 않는다.

비슷한 면적의 신규 전세 몇 건으로 가격 범위를 잡은 뒤, 마음에 든 집의 권리와 보장 조건을 확인하자. 계약금이 낮은 집과 안심하고 맡길 수 있는 집은 같은 목록에서 골라지지 않을 수 있다.

## 자료와 제작

국토교통부 기반 공개 임대차 자료를 사용한다. 전세·월세, 신규·갱신의 표본을 구분하며 신고 자료만으로 개별 보증금의 회수 가능성을 판정하지 않는다. 실제 권리·보증 심사는 계약 시점의 문서와 담당 기관 확인이 필요하다.`],
    en: ['A cheaper jeonse deposit is not a safety rating', 'Nearby contracts help compare the price. They do not establish whether the deposit will come back.', `## Compare the contract structure first

A much lower deposit on a similarly sized Seoul home may come with monthly rent. Mixing jeonse and deposit-plus-rent contracts turns a difference in payment structure into an apparent price bargain.

New and renewed jeonse contracts also deserve separate views. A sitting tenant and a new applicant can negotiate under different conditions. More renewals in a month's sample can change its median without changing the amount a new tenant needs.

## What the price cannot answer

Comparable contracts locate a deposit within the local market. They do not establish the landlord's ability to repay it. Ownership, prior-ranking claims and the applicable protections require the specific home's current documents and qualified checks.

Deposit-return cover is not automatically available on every property. Eligibility must be confirmed with the responsible provider under the actual terms. A below-market price is no reason to skip that step.

Use similar new jeonse contracts to establish a working price range. Then examine the shortlisted home's rights and protection separately. The least expensive deposit and the most acceptable repayment risk may point to different homes.

## Sources and production

Uses the installed MOLIT-derived tenancy publication, separating jeonse from monthly rent and new contracts from renewals. Reported contracts do not establish recovery of an individual deposit. Rights and cover require current documents and provider confirmation.`],
  },
  'seoul-monthly-rent-market-brief': {
    ko: ['월세 80만 원과 100만 원, 어느 집이 더 싼가', '보증금과 관리비가 빠진 월세 비교는 같은 비용을 비교하지 않는다.', `## 광고에서 가장 큰 글씨

월세 80만 원인 집이 100만 원인 집보다 싸다는 판단은 쉽다. 보증금과 관리비가 같다면 그렇다. 하지만 보증금을 더 맡기는 대신 월세를 낮춘 집이라면, 그 돈을 마련하는 비용이 월세 밖에 남아 있다.

생활비를 비교할 때는 월세에 정기 관리비를 더하고, 별도 공과금의 범위를 확인해야 한다. 관리비에 난방이나 수도가 들어가는 집과 그렇지 않은 집의 숫자를 그대로 나란히 놓을 수 없다.

## 보증금에는 내 자금의 비용을

보증금을 빌린다면 실제 대출 이자와 관련 비용이 중요하다. 자기 돈이라면 그 돈을 다른 곳에 두었을 때의 수익을 가정할 수 있지만, 그 가정은 현금으로 매달 빠져나가는 월세와 구분해서 적어야 한다.

같은 보증금에 대출 이자와 전체 금액의 기회비용을 함께 더하면 비용이 겹칠 수 있다. 자금 출처를 나눠 계산하고, 금리가 달라졌을 때 후보의 순서가 바뀌는지 보는 편이 낫다.

최근 비슷한 면적의 신규 계약으로 월세 범위를 잡은 다음, 관심 매물의 보증금·관리비·자금 비용을 한 장에 적어 보자. 그때도 80만 원짜리가 싼지 확인하는 것이 이 비교의 목적이다.

## 자료와 제작

금액은 특정 매물이 아닌 설명용 예시다. 공개 임대차 자료의 보증금과 월세 외에, 관리비·공과금·개인별 금융 조건은 실제 계약과 청구 자료로 보완해야 한다.`],
    en: ['Is ₩800,000 rent cheaper than ₩1 million?', 'Only after the deposits, recurring charges and cost of funding are put on the same basis.', `## The largest number in the advertisement

A home advertised at ₩800,000 a month looks cheaper than one at ₩1 million. With identical deposits and charges, it is. But a larger deposit may be buying the lower rent, leaving its funding cost outside the headline.

Start with rent and regular management charges, then check which utilities are included. Heating inside one charge and billed separately at the other home can change a supposedly straightforward comparison.

## Whose money funds the deposit?

Borrowed deposit money brings actual interest and financing costs. Savings bring a possible opportunity cost, which should be labelled as an assumption rather than a monthly bill.

Do not count loan interest and an opportunity cost on the same entire deposit without separating the funding sources. Test whether a different rate would change the ranking of the homes.

Recent new contracts for similar sizes provide a starting rental range. For the actual shortlist, put deposit, rent, charges and funding on one page. The question is whether the ₩800,000 home remains cheaper when its other costs are visible.

## Sources and production

The amounts illustrate a comparison, not available listings. Management charges, utilities and personal financing terms are outside the published tenancy fields and require the actual contract and bills.`],
  },
  'singapore-private-market-quarterly-brief': {
    ko: ['싱가포르 2분기, 가격은 소폭 상승했지만 지역은 갈렸다', '민간 주택 가격 0.5% 상승. 중심부와 외곽, 가격과 임대 운영을 하나의 호황으로 묶기 어렵다.', `## 상승률이 작아진 분기

2026년 2분기 싱가포르 민간 주택 가격지수는 0.5% 올랐다. 1분기의 0.9%보다 상승 폭이 줄었다. 가격 수준은 높아졌지만 오르는 속도는 느려졌다는 발표다. 하락했다고 읽어서도, 이전 분기의 속도가 이어졌다고 읽어서도 안 된다.

비유주택의 지역별 움직임은 더 달랐다. CCR은 1.8% 올랐고 RCR은 1.2%, OCR은 0.1% 내렸다. 중심부의 방향을 외곽 후보에 그대로 적용할 근거는 없다.

## 임대료가 올라도 빈집은 남는다

민간 주택 임대료지수는 0.7% 올랐지만 공실률도 6.2%에서 6.4%로 높아졌다. 두 지표는 서로를 취소하지 않는다. 계약된 집의 임대료가 높아지는 동안 세입자를 기다리는 집이 늘 수 있다.

임대용 주택을 검토한다면 예상 임대료와 입주까지의 시간을 따로 계산해야 한다. 월 임대료를 조금 더 받으려고 한 달을 비웠을 때, 실제 보유 기간에 그 손실을 만회할 수 있는지가 중요하다.

이번 발표는 싱가포르 전체를 사거나 팔라는 신호가 아니다. 중심부를 볼지 외곽을 볼지 정한 뒤, 그 지역의 최근 유사 거래와 새 임대계약으로 예산을 다시 확인할 이유다. 도시 평균을 읽고도 후보 목록은 서로 다르게 바뀔 수 있다.

## 자료와 제작

URA 2026년 2분기 민간 주택 통계. 가격·임대료는 전분기 대비 지수 변화, 공실률은 각 분기 수준이다. CCR·RCR·OCR 가격 변화는 비유주택에 해당한다.`],
    en: ['Singapore’s Q2 rise concealed a regional split', 'Private home prices rose 0.5%, while central and outer non-landed markets moved in different directions.', `## Slower growth is still growth

Singapore's private residential price index rose 0.5% in Q2 2026, after 0.9% in Q1. Prices increased at a slower pace. That is neither a fall in the index nor a continuation of the previous quarter's speed.

Non-landed regions diverged. CCR rose 1.8%; RCR fell 1.2% and OCR fell 0.1%. A central-market increase cannot simply be applied to an outer-region shortlist.

## Higher rents can coexist with more empty homes

The private residential rent index rose 0.7%, while vacancy increased from 6.2% to 6.4%. These measures do not cancel each other out. Homes securing tenants can obtain higher rents while other homes remain unoccupied.

An investor therefore needs separate assumptions for achievable rent and time to occupation. Holding out for a little more each month can lose money if the vacancy takes too long to recover over the intended holding period.

The release does not instruct a reader to buy or sell Singapore. It gives a reason to revisit the chosen region's comparable sales and new leases. Buyers reading the same national average may reasonably change their shortlists in different ways.

## Sources and production

URA Q2 2026 private residential statistics. Price and rental changes are quarter-on-quarter index changes; vacancy figures are quarterly levels. The regional price figures refer to non-landed homes.`],
  },
  'seoul-district-price-distribution': {
    ko: ['용산이 강남보다 높게 나온 표, 무엇을 평균냈나', '선택한 다섯 구의 건물별 중앙값을 다시 묶은 결과다. 서울 아파트의 가격 순위와는 다르다.', `## 1,000만 원 차이보다 중요한 분모

이 표에서 용산구는 5억4,750만 원, 강남구는 5억3,750만 원이다. 용산이 1,000만 원 높다. 그렇다고 같은 넓이의 아파트가 용산에서 더 비싸다는 결과는 아니다.

2026년 1~7월 자료에서 각 건물의 거래 중앙값을 먼저 구하고, 그 건물별 값의 중앙값을 다시 계산했다. 선택한 다섯 구만 비교하며 면적과 주택 구성을 같게 맞춘 가격지수가 아니다. 노원구의 2억6,000만 원도 같은 집계 방식의 값이다.

## 건물마다 한 표씩 주면

거래가 많은 건물과 적은 건물이 건물별 요약에서는 각각 하나의 값으로 들어간다. 모든 거래를 한꺼번에 모아 중앙값을 구하는 방식과 결과가 달라질 수 있다. 어느 방식이든 무엇을 단위로 셌는지 알아야 숫자를 사용할 수 있다.

이 그림은 후보 구를 더 살펴볼 계기가 된다. 하지만 집을 고를 때는 같은 면적과 주택 유형, 비슷한 연식의 계약으로 내려가야 한다. 용산과 강남의 1,000만 원 차이는 그 비교가 끝난 뒤에도 남는지 아직 모른다.

## 자료와 제작

설치된 서울 공개 자료의 2026년 1~7월, 선택한 다섯 구. 표시값은 건물별 거래금액 중앙값의 중앙값이며 거래량 가중 평균이나 동일 면적 가격지수가 아니다.`],
    en: ['Why this table puts Yongsan above Gangnam', 'The chart summarises building medians in five selected districts. It is not a like-for-like apartment ranking.', `## Before interpreting the ₩10 million gap

Yongsan shows ₩547.5 million; Gangnam, ₩537.5 million. The former is ₩10 million higher. This does not establish that an equivalent apartment costs more in Yongsan.

For January–July 2026, the calculation first takes each building's median transaction price, then the median of those building figures. It covers five selected districts without equalising size or housing composition. Nowon's ₩260 million follows the same method.

## Giving each building one observation

A building with many sales and one with few each contribute a single summary value. Pooling all their transactions could produce a different result. The unit of observation matters before either statistic can answer a buyer's question.

Use the chart to decide where to investigate, then narrow the contracts by area, housing type and age. Whether the ₩10 million gap survives that comparison remains unanswered.

## Sources and production

January–July 2026 in the installed Seoul publication, five selected districts. Values are medians of building-level transaction-price medians, not transaction-weighted means or constant-size indices.`],
  },
  'seoul-new-renewal-rent-gap': {
    ko: ['같은 도봉구 건물, 신규 보증금이 2,500만 원 높았다', '신규 18건과 갱신 13건의 차이. 새 세입자에게는 중요한 예산 차이지만 개별 인상률은 아니다.', `## 신규 계약 쪽에서 더 필요했던 돈

도봉구 한 건물의 45~55㎡ 계약을 비교하니 신규 보증금 중앙값은 2억2,500만 원, 갱신은 2억 원이었다. 차이는 2,500만 원, 갱신 중앙값 대비 12.5%다. 지금 새로 들어갈 집을 찾는 사람이라면 갱신 금액만으로 예산을 짜기 어려웠던 표본이다.

기간은 2026년 1~7월이다. 신규 18건과 갱신 13건을 각각 묶었다. 같은 건물과 면적 구간으로 좁혔지만 동일한 호수의 전후 계약을 이어 붙인 결과는 아니다.

## 12.5%를 인상률로 부를 수 없는 이유

층과 내부 상태, 정확한 면적, 계약 월이 남아 있다. 갱신한 세입자의 개별 계약 조건도 전부 같다고 볼 수 없다. 따라서 이 차이만으로 특정 계약의 인상률이나 제도의 효과를 계산할 수는 없다.

다만 신규와 갱신을 섞은 중앙값이 새 세입자가 준비할 돈과 어긋날 수 있다는 점은 분명하다. 전세 후보를 찾을 때는 전체 중앙값 옆에 신규 계약만 따로 놓아 보자. 이 건물에서는 그 구분이 2,500만 원의 예산 차이를 드러냈다.

## 자료와 제작

설치된 공개 임대차 자료의 도봉구 단일 건물, 45~55㎡, 2026년 1~7월. 표본 간 중앙값 차이이며 동일 호수 반복 계약이나 법정 인상률을 측정한 것이 아니다.`],
    en: ['New tenants needed ₩25 million more in this Dobong sample', 'Eighteen new contracts and thirteen renewals reveal a budgeting gap, not an individual rent increase.', `## The amount facing a new arrival

Within one Dobong building's 45–55 sq m contracts, the median new deposit was ₩225 million and the renewal median ₩200 million. That is a ₩25 million gap, or 12.5% of the renewal figure. Budgeting from renewals alone would have understated this sample's new-contract level.

The January–July 2026 comparison contains eighteen new contracts and thirteen renewals. It narrows the building and size band, but does not follow the same units from one contract to the next.

## Why 12.5% is not a tenant's increase

Floor, condition, exact area and contract month can still differ. Individual renewal circumstances are not equalised. The gap cannot establish a particular tenant's increase or isolate the effect of a legal rule.

It does show why a combined median can mislead a newcomer. Put new contracts beside the whole sample when planning a deposit. In this building, making that distinction exposed a material ₩25 million difference.

## Sources and production

One Dobong building, 45–55 sq m, January–July 2026 in the installed tenancy publication. This compares sample medians, not matched-unit renewals or statutory increases.`],
  },
  'korea-deposit-monthly-rent-cost-structure': {
    ko: ['85만 원 월세가 122만 원의 비교 비용이 될 때', '관리비와 보증금에 묶이는 자금까지 넣은 가상 계산. 매달 내는 돈과 기회비용은 구분해야 한다.', `## 월세 옆의 두 항목

월세 85만 원, 관리비 12만 원인 집을 가정하자. 매달 계약에 따라 내는 두 항목은 합계 97만 원이다. 보증금 7,500만 원을 자기 돈으로 맡기고 그 돈의 연간 기회비용을 4%로 잡으면, 비교용 비용이 월 25만 원 더해진다.

그렇게 만든 합계가 월 122만 원이다. 통장에서 매달 122만 원이 빠져나간다는 말은 아니다. 월세·관리비 97만 원과 가정한 자금 비용 25만 원을 함께 놓은 예산 비교다.

## 4%는 계약서에 적힌 비율이 아니다

이 사례의 4%는 계산을 위한 선택이다. 법정 전월세 전환율이나 은행의 실제 제안으로 사용해서는 안 된다. 보증금을 빌린다면 실제 대출 조건을 적용하고, 같은 돈의 대출 이자와 기회비용이 겹치지 않도록 자금 출처를 나눠야 한다.

또 관리비에 무엇이 들어 있는지 확인해야 한다. 공과금이 별도라면 이 합계에도 추가 지출이 남는다. 보증금을 더 맡겨 월세를 낮추는 제안을 받았을 때는, 월세 절감액이 추가 자금 비용보다 큰지 비교하면 된다. 광고의 월세만으로는 보이지 않던 선택이다.

## 자료와 제작

설명용 가정: 월세 850,000원, 관리비 120,000원, 자기자금 보증금 75,000,000원 × 연 4% ÷ 12 = 월 250,000원. 합계 1,220,000원은 비교용 비용이며 실제 매물·대출 견적·법정 전환율이 아니다.`],
    en: ['How ₩850,000 rent becomes a ₩1.22 million comparison', 'The extra amount includes management charges and an assumed deposit cost—not all of it is a monthly payment.', `## Two items beside the rent

Assume monthly rent of ₩850,000 and management charges of ₩120,000. Those two payments total ₩970,000. If a ₩75 million deposit comes from savings and its assumed annual opportunity cost is 4%, another ₩250,000 enters the monthly comparison.

The combined figure is ₩1.22 million. It is not a claim that this amount leaves the bank account each month. It combines ₩970,000 of payments with an assumed capital cost.

## Four per cent is an input

The 4% is a chosen scenario, not a statutory deposit-to-rent conversion rate or a bank offer. For borrowed money, use the actual loan terms and separate funding sources to avoid double-counting interest and opportunity cost on the same funds.

Check what management charges include; separately billed utilities still need room in the budget. When offered lower rent in exchange for a larger deposit, compare the saving with the extra funding cost. That decision is invisible in a rent-only search.

## Sources and production

Illustration: ₩850,000 rent + ₩120,000 charges + ₩75,000,000 savings-funded deposit × 4% ÷ 12 = ₩1,220,000 monthly comparison cost. This is not an available listing, lending quote or legal conversion rate.`],
  },
  'singapore-ccr-rcr-ocr-comparison': {
    ko: ['CCR·RCR·OCR, 싱가포르 집값을 세 칸으로 나눌 때', '지역별 단가는 검색의 시작일 뿐이다. 오래된 계약과 다른 면적이 섞인 표로 오늘의 집을 평가할 수는 없다.', `## 지도에서는 간단한 세 구역

CCR은 핵심 중심부, RCR은 그 밖의 중심 지역, OCR은 외곽 지역을 구분한다. 지도를 읽기에는 유용하지만 각 구역 안의 집들이 같은 상품은 아니다. 역과의 거리, 보유권, 연식이 서로 다르다.

여기의 프로젝트 단가 그림도 여러 해의 계약을 요약한 것이다. 신규 분양가나 오늘 올라온 매물의 중앙값이 아니다. 서로 다른 집들이 각 지역에 얼마나 들어갔는지에 따라 지역별 요약값이 달라질 수 있다.

## 단가 차이를 예산으로 바꾸기 전에

CCR의 작은 집과 OCR의 큰 집은 단가 순서와 총액 순서가 다를 수 있다. 같은 면적대와 재판매 여부, 보유권으로 후보를 좁힌 다음 총액을 비교해야 한다. 광역 구분만 같다는 이유로 거래를 하나의 비교군에 넣으면 이런 차이가 가려진다.

가령 출근 시간을 위해 면적을 줄일지, 방 하나를 더 얻기 위해 이동 시간을 늘릴지는 지역 평균이 결정해 주지 않는다. 두 지역에서 실제 예산에 들어온 프로젝트 몇 곳을 골라 최근 유사 계약과 일상의 이동을 함께 확인해야 한다.

세 구역의 이름은 검색 범위를 줄여 준다. 마지막 선택은 그 안에서 고른 집 두 채의 비교로 돌아온다.

## 자료와 제작

그림은 명시된 공개본의 다년간 프로젝트 요약이며 분기 가격지수와 다르다. 지역별 표본 수를 다른 시점의 프로젝트 총수와 합산하거나, 단가를 현재 매물 가격으로 적용하지 않는다.`],
    en: ['What Singapore’s three market regions leave out', 'CCR, RCR and OCR organise the search. They do not make the homes inside each region interchangeable.', `## Three convenient areas on a map

CCR identifies the core central region, RCR the rest of the central region and OCR the area outside it. Useful geography, but not three uniform products. Station access, tenure and building age still vary within each boundary.

The project-price graphic here summarises multiple years of contracts. It is neither a new-launch price list nor a median of today's listings. Regional results can change with the mix of homes represented.

## From unit prices to a real budget

A small CCR apartment and a large OCR apartment can reverse their ranking when moving from psf to total price. Narrow the comparison by area, resale status and tenure before using the totals. A shared broad-region label does not equalise those conditions.

The average cannot decide whether a shorter commute is worth less space. Select a few projects that actually fit the budget, then compare recent similar contracts and the journeys the household would make.

Three regional names help reduce the search area. The final decision returns to two actual homes.

## Sources and production

The graphic uses the identified publication's multi-year project summaries, not a quarterly price index. Its sample counts must not be combined with a different publication's project total, and its unit prices are not current listing valuations.`],
  },
};
