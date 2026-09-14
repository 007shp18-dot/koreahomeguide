import type { EditorialRevision } from '../editorial-revision';

const transactionReading: EditorialRevision = {
  ko: ['집값 중앙값이 두 배가 돼도, 같은 집은 오르지 않을 수 있다', '5억 원과 10억 원짜리 집 다섯 채로 보는 거래 구성의 함정.', `## 집은 그대로, 팔린 비중만 바뀌었다

가상의 동네에서 지난달 다섯 채가 5억·5억·5억·10억·10억 원에 팔렸다고 하자. 평균은 7억 원, 중앙값은 5억 원이다. 이번 달에는 5억·5억·10억·10억·10억 원이었다. 평균은 8억 원, 중앙값은 10억 원이 된다.

5억 원짜리와 10억 원짜리의 가격은 하나도 바뀌지 않았다. 비싼 집이 한 채 더 팔렸을 뿐인데 평균은 14.3% 오르고 중앙값은 두 배가 됐다. 극단적인 사례지만, 거래 중앙값의 상승을 개별 집의 수익률로 읽을 때 생기는 문제를 드러낸다.

## 최고가 한 건을 협상 기준으로 삼기 전에

서울에서 같은 단지 이름을 찾았어도 면적과 시점이 다르면 비교가 끝난 것이 아니다. 59㎡를 사려는 사람이 84㎡의 최고가를 기억하고 있다면 우선 넓이를 맞춰야 한다. 단위면적 가격으로 나눈다고 크기에 따른 가격 차이가 모두 사라지지는 않는다.

비슷한 크기에서 거래가 반복됐는지가 다음이다. 한 후보의 최근 석 달과 다른 후보의 최근 3년을 나란히 놓으면 시점 차이가 숨어든다. 표본을 늘리려고 기간을 넓혔다면 그 사실과 실제 건수를 함께 남겨야 한다.

## 도시를 바꾸면 거래의 뜻도 달라진다

싱가포르의 신규 분양과 재판매, 두바이의 오프플랜과 완공 주택은 계약이 시작하는 조건부터 다르다. 같은 가격이어도 지급 일정과 임대 수입이 생기는 시점이 다를 수 있다. 도시별 총액이나 상승률만으로 어느 쪽의 투자가 낫다고 정할 수 없는 이유다.

도쿄 공개 거래 자료는 익명 지역 관측이다. 지도에 보이는 맨션 이름과 주변 거래를 연결해 해당 건물의 계약 이력으로 만들 수 없다. 자료가 없는 칸도 0% 상승으로 채워서는 안 된다.

두 집을 비교할 때는 가격보다 먼저 주택 유형, 면적 기준, 계약 기간과 거래 종류를 적어 보자. 그 조건을 맞춘 뒤에도 남는 차이가 내가 제안할 금액의 근거다. 다섯 채의 중앙값이 두 배로 뛴 가상 동네에서도, 5억 원짜리 집의 가격은 여전히 5억 원이었다.

## 자료와 제작

다섯 건의 금액과 변화율은 거래 구성 효과를 설명하는 가정이며 실제 시장 관측이 아니다. 국토교통부·URA·DLD·MLIT의 자료 범위와 원래 원고의 출처를 유지했다. 개별 감정가나 투자 수익률을 제시하지 않는다.`],
  en: ['A median can double without either kind of home getting dearer', 'Five hypothetical sales show why a transaction summary is not an owner’s return.', `## The prices stayed put

Imagine five homes selling last month for ₩500 million, ₩500 million, ₩500 million, ₩1 billion and ₩1 billion. The mean is ₩700 million; the median, ₩500 million. This month's five are ₩500 million, ₩500 million, ₩1 billion, ₩1 billion and ₩1 billion. The mean becomes ₩800 million and the median ₩1 billion.

Neither price band moved. One additional expensive home changed hands. Yet the average rose 14.3% and the median doubled. The simplified example exposes the problem with applying a transaction-median increase directly to a particular home's return.

## Before negotiating from a record sale

Finding the same Seoul complex name is not enough. A buyer seeking 59 sq m must not budget from an 84 sq m record. Dividing by area does not remove every size-related price difference.

Next ask whether comparable sales repeated. One candidate's last three months and another's last three years contain a hidden time mismatch. If the window is expanded to find evidence, keep that expansion and the actual counts visible.

## A different city can mean a different transaction

Singapore new launches and resales, or Dubai off-plan and ready property, begin under different conditions. The same headline price can involve different payment dates and a different wait for rental income. City totals or growth rates cannot resolve that comparison.

Tokyo's public observations are anonymised area records. A nearby mansion's name does not turn them into that building's verified history. An absent observation is not 0% growth either.

Describe the homes before entering their prices: type, area basis, period and contract category. The difference remaining after alignment is closer to evidence for an offer. Even in the imaginary neighbourhood where the median doubled, the ₩500 million homes still cost ₩500 million.

## Sources and production

The five-sale amounts and changes are hypothetical, not market observations. Original MOLIT, URA, DLD and MLIT source references are retained. No individual valuation or investment return is estimated.`],
};
const absd: EditorialRevision = {
  ko: ['S$150만 콘도를 사는 데 S$244만이 필요한 경우', '같은 집도 구매자의 세금 조건에 따라 임대 수익 계산이 달라진다.', `## 집값보다 먼저 확인할 신분 조건

싱가포르 콘도 가격표에 S$150만이라고 적혀 있어도 모든 구매자가 같은 돈으로 취득하는 것은 아니다. 외국인 개인에게 ABSD 60%가 적용되고 감면이 없는 경우라면, 취득 시 추가 세금만 S$90만이다.

이 글은 그 조건의 가상 구매자 한 명을 계산한다. 국적과 영주권, 공동 매수인, 적용 가능한 감면에 따라 실제 취급은 달라진다. 해외에 산다는 이유나 글을 읽는 언어만으로 60% 적용 여부를 정할 수는 없다.

## 가격과 세금을 합치면

매매가와 시장가치가 모두 S$150만이고 대출을 쓰지 않는다고 가정하자. 누진 방식의 BSD는 S$44,600이다. ABSD S$900,000을 더하면 취득세 합계는 S$944,600, 가격과 두 세금의 합계는 S$2,444,600이다.

법무비와 가구, 수선, 이후 보유 비용은 아직 없다. 검색창의 상한 S$150만과 실제 지출할 수 있는 총액 S$150만은 이 구매자에게 전혀 다른 예산이다. 실제 과세표준은 매매 대가와 시장가치 중 높은 금액이므로 계약서의 가격만으로 확정되지도 않는다.

## 임대료가 같아도 수익률이 바뀐다

연간 임대료를 S$60,000으로 가정하면 집값 대비 총수익률은 4%다. 가격과 취득세를 함께 넣은 S$2,444,600 대비로는 약 2.45%다. 집도 임대료도 그대로지만, 그 수입을 얻는 데 쓴 돈을 더 반영했다.

한 달 공실로 S$55,000을 받으면 약 2.25%가 된다. 두 값 모두 관리비·수선·보험·재산세와 개인별 세금을 빼기 전이어서 순수익률은 아니다. 실제 임대차와 청구서로 가정을 바꿔야 투자 비교가 시작된다.

## 오르면 만회된다는 말의 크기

가격과 취득세만 매각 대금으로 되찾는다고 단순화하면 S$2,444,600이 필요하다. 원래 집값보다 약 62.97% 높다. 임대 수입과 매각 비용, 보유 기간을 제외한 비교이므로 실제 손익분기 상승률은 아니다. 다만 취득세를 작은 부대비용으로 미뤄 둘 수 없다는 크기는 보여 준다.

실제 투자는 보유 중 순임대수입, 대출, 수선과 매각 비용을 연결해야 한다. 조기 매각에는 취득일과 보유 기간에 따른 추가 세금도 검토해야 한다. 먼저 구매자별 세금 조건을 확정하고 그 뒤에 후보를 고르는 순서가 중요한 이유다. 다른 사람에게 수익이 났던 집도 내 취득 원가에서는 같은 투자가 아니다.

## 자료와 제작

IRAS의 BSD·ABSD 안내에 따른 설명용 계산이다. S$150만 동일 매매가·시장가치, 감면 없는 외국인 개인 ABSD 60%, 무대출을 가정했다. BSD는 첫 S$180,000의 1%, 다음 S$180,000의 2%, 다음 S$640,000의 3%, 나머지 S$500,000의 4%다. 임대료와 공실은 가정이다. 개인별 취득·보유·매각 세금은 실제 거래 조건에 대한 전문 확인이 필요하다.`],
  en: ['When a S$1.5 million condo needs S$2.44 million', 'The same apartment can produce a very different rental calculation under the buyer’s own tax treatment.', `## The buyer changes the budget

A S$1.5 million Singapore condo does not cost every buyer the same amount to acquire. For a foreign individual subject to 60% ABSD with no remission, that additional duty alone is S$900,000.

This article models that specific buyer. Nationality, permanent residence, co-buyers and applicable remissions can change the treatment. Living overseas or reading in English does not establish the rate.

## Price plus the two duties

Assume price and market value both equal S$1.5 million, with no borrowing. Progressive BSD is S$44,600. Add S$900,000 ABSD and the duties total S$944,600. Price plus those taxes reaches S$2,444,600.

Legal fees, furnishing, repairs and ongoing ownership costs are still outside the number. A S$1.5 million search ceiling and S$1.5 million available for the whole purchase are profoundly different budgets here. The actual duty base is the higher of consideration and market value, not automatically the contract price.

## The rent stays the same

Assume S$60,000 annual rent. Against the property price, gross yield is 4%. Against price plus duties, it is about 2.45%. Nothing about the apartment or rent changed; more of the money needed to obtain that income entered the denominator.

One vacant month reduces assumed receipts to S$55,000 and the latter ratio to about 2.25%. Neither result is net yield: management, repairs, insurance, property tax and investor-specific taxes remain. Replace assumptions with the lease and bills before comparing investments.

## How much appreciation would that argument need?

Recovering only price and acquisition duties through sale proceeds would require S$2,444,600, about 62.97% above the original price. This excludes rental receipts, selling expenses and time, so it is not the investment's actual break-even appreciation rate. It does show why the duties cannot be treated as a minor detail to resolve later.

An actual investment connects net rent, financing, repairs and exit costs over the holding period. Early disposal also requires checking the tax rules for the acquisition date and length of ownership. Establish the buyer's treatment before choosing the homes. Someone else's profitable apartment may be a different investment at your acquisition cost.

## Sources and production

Illustration using IRAS BSD/ABSD guidance: equal S$1.5 million price and market value, a foreign individual at 60% ABSD without remission, no loan. BSD applies 1% to the first S$180,000, 2% to the next S$180,000, 3% to the next S$640,000 and 4% to the remaining S$500,000. Rent and vacancy are assumed. Actual acquisition, ownership and disposal taxes require transaction-specific professional confirmation.`],
};

export const DATABASE_REVISIONS: Readonly<Record<string, EditorialRevision>> = {
  'how-to-read-property-transaction-prices-and-medians': transactionReading,
  'how-to-read-property-transaction-prices-and-medians-en': transactionReading,
  'singapore-condo-absd-60-percent-real-acquisition-cost': absd,
  'singapore-condo-absd-60-percent-real-acquisition-cost-en': absd,
  'dubai-flexi-rent-monthly-payments-total-cost': {
    ko: ['두바이 월납 임대료, 처음 덜 낸 돈이 할인은 아니다', 'Flexi Rent가 바꾸는 것은 우선 지급 일정이다. 연간 총액과 중도 해지 조건은 따로 읽어야 한다.', `## 연 12만 디르함을 나누어 내면

임대료 12만 디르함을 한 번에 내는 대신 매달 1만 디르함씩 낸다면 연간 임대료는 같다. 줄어드는 것은 첫날 필요한 돈이다. 이사 직후 가구와 생활비를 마련해야 하는 세입자에게는 그 차이만으로도 의미가 있다.

하지만 월 1만500디르함이라면 연간 총액은 12만6,000디르함이다. 나누어 내는 대가로 연간 임대료가 6,000디르함, 5% 높아진 가상 사례다. 이 5%는 현금흐름의 시점을 반영한 대출 연이율이 아니다.

## 적용되는 집부터 확인

DLD가 2026년 6월 23일 발표한 Flexi Rent는 참여 업체의 해당 공실·적격 주택에 월별·분기별·반기별 선택지를 제공하는 방식이다. 모든 임대인에게 월납을 요구할 수 있는 보편적인 권리로 발표된 것은 아니다. 할인과 부가 혜택도 참여자의 조건에 따라 달라진다.

따라서 같은 집에 대한 연납과 분납 제안을 받아 비교해야 한다. 계약 기간, 전체 납부액, 별도 수수료를 적고 첫 납부 후 남는 돈과 이후 납부 의무를 나눠 보자.

## 통장에 남아 있어도 앞으로 낼 돈

현금 16만 디르함에서 연납 12만을 내면 4만이 남는다. 첫 월납 1만500만 내면 14만9,500이 남는다. 당장 남는 현금 차이는 10만9,500디르함이지만, 뒤의 열한 번 납부가 사라진 것은 아니다.

월납이 계약을 매달 끝낼 수 있다는 뜻도 아니다. 중도 해지 통지와 위약금은 임대계약을, 별도 지급 서비스가 있다면 그 서비스 계약까지 확인해야 한다. 첫날 필요한 현금이 작아지는 혜택과 전체 거주 비용이 낮아지는 혜택을 구분하면 제안서가 훨씬 읽기 쉬워진다.

## 자료와 제작

DLD Flexi Rent 발표·프로그램 안내에 근거한다. 모든 금액은 수수료·보증금 등을 제외한 설명용 가정이다. 실제 적격 여부, 납부·해지 조건과 요금은 해당 임대인·참여 업체의 문서가 우선한다.`],
    en: ['Dubai monthly rent: less upfront is not necessarily less overall', 'Flexi Rent changes the payment schedule. The annual total and exit terms need their own comparison.', `## Splitting AED 120,000

Paying AED 10,000 monthly instead of AED 120,000 upfront leaves the annual rent unchanged. It reduces the cash needed on day one. For a tenant also funding furniture and a move, that can be valuable without being a discount.

At AED 10,500 a month, the annual total becomes AED 126,000. In this hypothetical offer, instalments cost AED 6,000 more, a 5% annual rent premium. That percentage is not a loan APR accounting for payment timing.

## Check which home qualifies

DLD's 23 June 2026 Flexi Rent announcement describes monthly, quarterly and semi-annual options for participating partners' vacant or eligible units. It does not establish a universal right to monthly payments from every landlord. Incentives depend on the participant's conditions.

Compare annual and instalment offers for the same home. Record the term, total payments and separate fees, then distinguish money left after the first payment from obligations still to come.

## Cash retained, not money saved

From AED 160,000 in cash, a full AED 120,000 annual payment leaves AED 40,000. A first AED 10,500 payment leaves AED 149,500. The immediate liquidity difference is AED 109,500; the remaining eleven payments have not disappeared.

Monthly payment also does not necessarily mean a tenancy cancellable each month. Read notice and termination terms in the lease and, where a separate payment provider is involved, that agreement too. Distinguishing a smaller first-day cash requirement from a lower total housing cost makes the offer much easier to judge.

## Sources and production

Based on DLD's Flexi Rent announcement and programme description. All money examples are hypothetical and exclude deposits and fees. Eligibility, payment, termination and charges require the specific landlord's and provider's documents.`],
  },
  'seoul-august-2026-sales-reporting-lag': {
    ko: ['서울 8월 거래가 9월에도 늘어나는 이유', '새로 신고된 계약이 과거 달에 붙는다. 늦게 들어온 숫자를 새 매수세로 읽지 않으려면 계약일을 봐야 한다.', `## 8월의 계약이 9월에 나타난다

8월 28일 계약한 집이 9월 15일 신고됐다고 가정하자. 자료에 새로 나타난 것은 9월이지만 계약 월은 8월이다. 실거래 공개 화면에서 8월 건수가 뒤늦게 늘어날 수 있는 이유다.

주택 매매는 통상 계약일로부터 30일 이내 신고하도록 되어 있고, 공개 자료는 계약일 기준으로 제공된다. 9월 중순에 보는 8월, 특히 월말 계약은 아직 신고가 더 들어올 여지가 있다. 최근 달이 적어 보인다는 사실과 그 달의 거래가 최종적으로 줄었다는 판단은 구분해야 한다.

## 중앙값도 신고를 따라 바뀐다

늦게 들어온 계약이 비싼 집에 몰리면 건수뿐 아니라 중앙값도 높아질 수 있다. 그날 집값이 오른 것이 아니라, 지난달 거래의 구성이 뒤늦게 더 보인 경우다. 취소와 정정도 공개본을 바꿀 수 있다.

비교 자료를 저장할 때 계약 기간과 수집 시각을 함께 남겨 두면 이런 변화의 원인을 찾기 쉽다. 오늘의 미완성 최근 달과 충분히 시간이 지난 과거 달을 같은 확정치처럼 놓지 않는 것이 중요하다.

## 같은 면적부터 남겨 보기

가령 84㎡가 10억6,000만·10억8,000만·11억 원에 거래된 뒤 114㎡의 17억 원 신고가 추가됐다면, 최고가가 높아졌다는 이유로 84㎡ 예산을 바로 올릴 수 없다. 같은 면적의 11억8,000만 원 계약이 추가된 경우라면 더 가까운 비교다. 이 역시 한 건만으로 전체 단지의 새 가격을 확정하지는 않는다.

이번 달에 새로 보인 행을 찾았다면 먼저 계약일로 돌아가자. 그다음 면적과 층, 거래 종류를 맞춰 읽어야 한다. 화면이 바뀐 날과 매수자가 값을 정한 날 사이에 한 달의 간격이 있을 수 있다.

## 자료와 제작

국토교통부 자료제공 안내·FAQ의 계약일 기준 공개와 30일 신고 설명을 따른다. 날짜와 가격 사례는 모두 가정이다. 최근 달의 완결을 특정 날짜로 보장하지 않으며 정정·취소로 이후 값도 달라질 수 있다.`],
    en: ['Why Seoul’s August sale count keeps changing in September', 'A newly reported contract can belong to last month. Its arrival is not necessarily new buying activity.', `## An August agreement, a September appearance

Imagine a home contracted on 28 August and reported on 15 September. It first appears in the data in September, but belongs to the August contract month. That is one reason August's published count can rise later.

Housing sales generally must be reported within thirty days of contract, and the public records are organised by contract date. In mid-September, particularly late-August agreements can still arrive. A recent month looking small is not yet a final finding that its activity declined.

## The median can change too

If the late reports contain expensive homes, both count and median can rise. Prices need not have jumped on the day the screen changed; more of the earlier month's composition became visible. Corrections and cancellations can also alter the publication.

Keep the contract period and extraction time together when saving a comparison. An incomplete recent month and a mature earlier month should not be presented as equally settled observations.

## Start with equivalent sizes

Suppose three 84 sq m homes sold for ₩1.06 billion, ₩1.08 billion and ₩1.10 billion, followed by a late report of a 114 sq m home at ₩1.70 billion. The higher record does not require an immediate increase in the 84 sq m budget. A newly reported 84 sq m sale at ₩1.18 billion would be a closer comparator, though still only one transaction.

When a new row appears, return first to its contract date, then align area, floor and sale category. The day the display changed and the day the buyer agreed the price can be a month apart.

## Sources and production

MOLIT's data-provision guidance and FAQ explain contract-date publication and the thirty-day reporting window. All dates and prices in the examples are hypothetical. No fixed day guarantees a month's finality; later corrections and cancellations remain possible.`],
  },
  'singapore-rents-vacancy-landlord-income-2026': {
    ko: ['월세 S$100 더 받으려다 한 달을 비우면', '임대료 상승과 임대인의 수입 증가는 다르다. 싱가포르 2분기 수치와 가상의 계약 두 개로 보는 차이.', `## 임대료도 공실률도 올랐다

2026년 2분기 싱가포르 민간 주택 임대료지수는 0.7% 올랐다. 공실률은 6.2%에서 6.4%로 높아졌다. 세입자를 구한 집의 임대료가 오르는 동안 다른 집은 비어 있을 수 있다. 두 지표가 함께 오른 것은 모순이 아니다.

비유주택 임대료는 0.4% 상승했고 지역별로 CCR 1.2%, RCR 0%, OCR -0.3%였다. 도시의 상승률만으로 외곽의 특정 콘도에 더 높은 임대료를 적용할 수는 없다.

## S$5,000에 지금 계약할지

월 S$5,000에 바로 입주하는 계약과 한 달을 기다린 뒤 S$5,100에 입주하는 계약을 가정하자. 첫 12개월 수납액은 각각 S$60,000과 S$56,100이다. 월세를 S$100 더 받는 쪽이 그 기간에는 S$3,900 덜 받는다.

같은 12개월 수납액을 내려면 한 달 공실 뒤 월 S$5,455가량, 두 달 공실 뒤에는 S$6,000이 필요하다. 원래 월세보다 각각 약 9.1%, 20% 높다. 공실은 매달 조금씩 받는 인상분보다 한 번에 큰 손실을 만들 수 있다.

## 계약 기간을 늘려도 남는 차이

24개월 동안 같은 월세가 유지된다고 가정하면 즉시 입주 S$5,000은 S$120,000, 한 달 뒤 S$5,100은 23개월간 S$117,300이다. 부족액은 S$2,700으로 줄지만 아직 역전되지 않는다. 이 계산은 인상이나 갱신을 미리 확정한 예측이 아니다.

기다릴 만한 제안도 있을 수 있다. 다만 그 판단에는 실제 후보 세입자, 입주일, 계약 기간과 집이 비는 동안의 청구서가 필요하다. 시장 임대료가 올랐다는 뉴스만으로 한 달의 빈집을 지불해 주지는 않는다.

## 자료와 제작

URA 2026년 2분기 임대·공실 지표를 사용했다. 나머지는 즉시 입주와 한두 달 공실의 가상 수납 비교이며 운영비·중개비·세금·수선·미수금은 제외했다. 아래 원래 계산표의 수치는 같은 가정을 따른다.`],
    en: ['The empty month behind an extra S$100 in rent', 'Singapore’s rental index can rise without a landlord collecting more. Timing changes the result.', `## Rents and vacancy both increased

Singapore's private residential rent index rose 0.7% in Q2 2026, while vacancy increased from 6.2% to 6.4%. Homes finding tenants can secure higher rents while others remain empty. The two increases are not contradictory.

Non-landed rents rose 0.4%, with CCR up 1.2%, RCR unchanged and OCR down 0.3%. The national rise cannot automatically price an outer-region condominium.

## S$5,000 now or S$5,100 later?

Assume one tenant moves in immediately at S$5,000 a month and another after a one-month wait at S$5,100. Over the first twelve months, receipts are S$60,000 and S$56,100. The higher monthly price collects S$3,900 less.

Matching the first offer requires about S$5,455 a month after one empty month, or S$6,000 after two. Those are increases of roughly 9.1% and 20%. Vacancy loses a whole month's income faster than a modest monthly premium earns it back.

## A longer view does not erase the first gap

Hold the same hypothetical rents for twenty-four months. Immediate occupation at S$5,000 collects S$120,000; twenty-three occupied months at S$5,100 collect S$117,300. The shortfall narrows to S$2,700 but has not reversed. This assumes unchanged rents, not a forecast of future renewals.

Waiting may still be justified by a particular offer. It needs evidence about the prospective tenant, move-in date, term and bills during vacancy. A rising rental-index headline does not pay for the empty month.

## Sources and production

URA Q2 2026 rental and vacancy indicators. All cash examples are hypothetical and exclude management, agency, taxes, repairs and unpaid rent. The retained original calculation table uses the same assumptions.`],
  },
  'tokyo-august-2026-asking-prices-inquiry-gap': {
    ko: ['도쿄 매물은 1억2,018만 엔, 문의한 집은 7,481만 엔', '4,537만 엔의 간격은 할인 폭이 아니다. 시장에 나온 집과 사람들이 알아본 집의 차이다.', `## 가격표와 관심이 향한 곳

LIFULL HOME’S의 2026년 8월 자료에서 도쿄 23구 가족형 중고 맨션의 평균 매물 가격은 1억2,018만 엔이었다. 문의가 발생한 매물의 평균은 7,481만 엔이다. 차이는 4,537만 엔이다.

이 숫자는 1억2,018만 엔짜리 집이 7,481만 엔에 팔렸다는 뜻이 아니다. 문의도 계약이 아니다. 시장에 올라온 매물과 이용자가 중개업체에 연락한 매물을 따로 집계한 결과다. 예산과 조건에 따라 관심이 더 낮은 가격대에 모일 수 있다는 자료로 읽어야 한다.

## 같은 가족형 안에서도 다른 집

가족형은 2DK·2LDK·3K·3DK·3LDK 이상이라는 방 구성 분류다. 고정된 면적이나 연식을 뜻하지 않는다. 크고 새 집의 매물과 작고 오래된 집의 문의가 섞이면 가격의 간격에는 상품 차이가 들어간다.

8,000만 엔의 전체 예산에서 비용 여유로 500만 엔을 따로 둔다면 검색할 매매가 상한은 7,500만 엔이다. 이는 설명용 가정이지 도쿄의 표준 취득비나 대출 승인액은 아니다. 문의 평균과 비슷하다는 사실보다 내 비용을 빼고 남긴 한도가 더 직접적인 검색 조건이다.

## 임대 검색에도 같은 간격이 있다

같은 달 가족형 임대 매물의 평균 월세는 263,148엔, 문의 매물은 184,381엔이었다. 여기서도 문의 금액을 체결된 임대료로 바꿔 읽어서는 안 된다. 광고의 높은 평균이 모든 임대인의 수납액을 뜻하지도 않는다.

매수든 임대든 전체 매물 평균에서 얼마를 빼라는 결론은 나오지 않는다. 예산에 들어오는 집을 고른 뒤 넓이와 연식, 실제 역 출입구까지의 길을 맞춰 비교해야 한다. 4,537만 엔의 간격은 협상에서 얻을 돈이 아니라, 서로 다른 집을 한 숫자로 부르고 있다는 경고에 가깝다.

## 자료와 제작

LIFULL HOME’S 2026년 8월 매매·임대 보고서, 9월 8일 발표. 매물·문의 매물의 평균을 구분했으며 둘 다 성약 자료가 아니다. 예산 예시는 가정이다. 도쿄 공개 익명 거래를 특정 맨션에 연결하지 않는다.`],
    en: ['Tokyo listed at ¥120.18 million; enquiries centred on ¥74.81 million', 'The ¥45.37 million gap describes different groups of homes—not a negotiated discount.', `## Where the price tags and enquiries diverged

LIFULL HOME’S August 2026 report put the average listed family-type resale apartment in Tokyo's twenty-three wards at ¥120.18 million. Homes receiving enquiries averaged ¥74.81 million. The difference was ¥45.37 million.

That does not mean a ¥120.18 million apartment sold for ¥74.81 million. An enquiry is not a contract. The platform separately aggregates listed homes and homes users contacted agents about. Budgets and preferences can direct attention toward a different price band.

## “Family type” does not hold size constant

The category includes 2DK, 2LDK, 3K, 3DK and 3LDK or larger layouts. It does not fix floor area or age. Differences between the homes represented can enter the price gap.

For an illustrative ¥80 million total budget, setting aside ¥5 million for costs leaves a ¥75 million price ceiling. This is neither a standard Tokyo fee allowance nor a lending approval. The limit left after the buyer's actual costs is a more direct search condition than proximity to an enquiry average.

## The rental search has the same distinction

Family-type rental listings averaged ¥263,148 a month; homes receiving enquiries, ¥184,381. Again, enquiry prices are not executed leases, and a high listing average is not income collected by every owner.

Neither comparison produces an amount to subtract from an individual seller's price. Select homes within the budget, then align size, age and the route to the useful station entrance. The ¥45.37 million gap is not money waiting to be won in negotiation. It is a warning about calling different homes one market.

## Sources and production

LIFULL HOME’S August 2026 sale and rental reports, published 8 September. Listing and enquiry-property averages are distinct; neither is completed-contract data. The budget example is hypothetical. Anonymised Tokyo public sales are not assigned to named mansions.`],
  },
};
