/** Reader-facing headlines; claims and evidence remain in the original articles. */
export const DISCOVERY_UPDATED_AT = '2026-09-14T23:25:00Z';
type Copy = readonly [ko: string, en: string, keywordKo: string, keywordEn: string];
export const DISCOVERY_COPY: Readonly<Record<string, Copy>> = {
  'seoul-same-complex-price-gap': ['같은 서울 아파트인데 1억 넘게 차이? 싼 거래부터 누르면 놓치는 것', 'Same Seoul Complex. A ₩113 Million Gap. Which Price Is Yours?', '서울 아파트 같은 단지 실거래가 차이', 'Seoul apartment price gap within one complex'],
  'tokyo-cheaper-rent-longer-commute': ['도쿄 월세 2만 엔 아꼈다. 대신 출근길에서 뭘 냈을까?', 'You Saved ¥20,000 on Tokyo Rent. What Did the Commute Take?', '도쿄 월세와 출퇴근 시간 비교', 'Tokyo rent versus commute time comparison'],
  'seoul-buam-dong-afternoon-walk': ['서울에 이런 데가 있었어? 카페만 찍고 오기 아까운 부암동', 'This Is Still Seoul? Go Beyond the Café in Buam-dong.', '서울 부암동 산책 코스 백사실계곡', 'Buam-dong Seoul walk and Baeksasil Valley'],
  'tokyo-koenji-vintage-evening-walk': ['도쿄까지 가서 시부야만 보고 올 거야? 이번엔 고엔지', 'You Didn’t Fly to Tokyo Just to See Shibuya. Try Koenji.', '도쿄 고엔지 여행 빈티지 상점가 산책', 'Koenji Tokyo vintage shopping and evening walk'],
  'seoul-84sqm-under-one-billion-2026': ['서울 아파트 10억이면 못 산다고? 이 거래들은 달랐다', 'Priced Out of Seoul? These 84㎡ Sales Tell Another Story.', '서울 84㎡ 아파트 10억 이하 실거래', 'Seoul 84 sqm apartments under ₩1 billion'],
  'seoul-59sqm-under-700-million-2026': ['서울에서 7억으로 집 찾기, 아직 끝난 게임은 아니다', 'Think ₩700 Million Buys Nothing in Seoul? Look Again.', '서울 55~65㎡ 아파트 7억 이하', 'Seoul 55–65 sqm apartments under ₩700 million'],
  'singapore-condos-under-1-5-million-2026': ['싱가포르 콘도 150만 달러, 집값만 준비하면 될까?', 'Found a Singapore Condo for S$1.5M? You’re Not Done Budgeting.', '싱가포르 콘도 150만 달러 매매', 'Singapore condos under S$1.5 million'],
  'dubai-rental-yield-after-costs': ['두바이 수익률 7%, 내 통장에도 그렇게 찍힐까?', 'A 7% Dubai Rental Yield. How Much Do You Actually Keep?', '두바이 부동산 임대 수익률 비용', 'Dubai rental yield after costs'],
  'korea-foreon-neighbour-price-gap': ['포레온 옆집 사면 나도 따라 오를까?', 'Buy Next to Foreon, Ride the Same Price Rise?', '올림픽파크포레온 주변 아파트 가격 비교', 'Foreon neighbouring apartment price gap'],
  'singapore-lentor-launch-resale-divergence': ['새 콘도 옆에 샀는데, 왜 저 집이 더 올랐지?', 'Both Near Lentor’s New Launches. Why Did One Rise More?', '싱가포르 렌토르 콘도 재판매 가격', 'Lentor condo resale price comparison'],
  'seoul-monthly-2026-09': ['서울 거래 살아났다는데, 강남·서초는 왜 반대였을까?', 'Seoul Sales Rebounded. Why Didn’t Gangnam and Seocho?', '서울 2026년 7월 아파트 거래량', 'Seoul apartment sales July 2026'],
  'singapore-monthly-2026-09': ['조용한 싱가포르 시장? 동네를 바꾸면 얘기가 달라진다', 'Singapore Resales Looked Flat. The Districts Tell Another Story.', '싱가포르 2026년 7월 콘도 재판매', 'Singapore condo resales July 2026'],
  'dubai-monthly-2026-09': ['두바이 거래 줄었다는데, 이 동네 완공 주택은 더 팔렸다', 'Dubai Sales Fell. Arjan’s Ready Homes Didn’t Get the Memo.', '두바이 2026년 8월 완공 주택 거래', 'Dubai Ready apartment sales August 2026'],
  'tokyo-older-apartments-shinagawa-renewal-2026': ['도쿄 구축, 인테리어에 반했다면 잠깐만', 'That Tokyo Apartment Looks Brand New. What About the Building?', '도쿄 구축 맨션 리노베이션 수선', 'Tokyo older apartments renovation and repairs'],
  'singapore-lower-psf-higher-total-budget': ['더 싼 싱가포르 콘도인데, 왜 돈은 더 필요하지?', 'The Singapore Condo Is Cheaper. So Why Do You Need More Money?', '싱가포르 콘도 PSF 평당가 총매입금액', 'Singapore condo psf versus purchase price'],
  'dubai-new-renewal-rent-mix': ['두바이 집주인이 월세를 깎고도 더 번 이유', 'The Dubai Landlord Who Cuts the Rent—and Collects More.', '두바이 임대료 공실 갱신 비교', 'Dubai rent renewal and vacancy costs'],
  'seoul-footfall-shop-rent-capacity': ['사람은 이렇게 많은데, 이 가게는 월세를 버틸까?', 'This Seoul Street Is Packed. Can Its Shops Afford the Rent?', '서울 상가 임대료 유동인구 매출', 'Seoul retail rent footfall and sales'],
  'dubai-valuation-purchase-cash-gap': ['두바이 집값은 합의했는데, 현금을 더 가져오라고?', 'Agreed on a Dubai Home Price? The Bank May Have Other Ideas.', '두바이 주택대출 감정가 자기자금', 'Dubai mortgage valuation cash gap'],
  'seoul-singapore-dubai-buyer-pulse-september-2026': ['해외 집값 뉴스만 보고 샀다간, 정작 내 계산이 빠진다', 'Three Property Headlines. Which One Changes Your Budget?', '서울 싱가포르 두바이 부동산 2026년 9월', 'Seoul Singapore Dubai property September 2026'],
  'bank-of-korea-rate-rise-seoul-home-buyers-2026': ['집값 그대로인데, 내가 살 수 있는 집은 달라진다', 'Same Seoul Home Price. A Different Buying Budget.', '서울 아파트 금리 대출 상환액', 'Seoul apartment mortgage payment budget'],
  'singapore-q2-2026-private-housing-split': ['싱가포르 집값 올랐다는데, 내가 본 콘도는 왜 다를까?', 'Singapore Prices Rose. Why Might Your Condo Tell a Different Story?', '싱가포르 2026년 2분기 민간주택 가격', 'Singapore Q2 2026 private property prices'],
  'dubai-h1-2026-completions-and-transaction-growth': ['두바이에 새집 쏟아진다는데, 내 집 옆에도 생길까?', 'Dubai Is Adding Homes. Are They Competing With Yours?', '두바이 2026년 상반기 준공 공급', 'Dubai H1 2026 property completions'],
  'singapore-condo-prices-2026-by-project': ['싱가포르 콘도, 싼 순서로 정렬하면 놓치는 것', 'Sort Singapore Condos by Price. What Disappears?', '싱가포르 콘도 단지별 가격 비교', 'Singapore condo prices by project'],
  'tokyo-asking-price-vs-contracted-price-2026': ['도쿄 집값, 매도자가 부르는 돈과 거래된 돈은 다르다', 'Tokyo Sellers Have a Price. Buyers Have Another Number.', '도쿄 맨션 호가 실거래가 비교', 'Tokyo apartment asking versus transaction prices'],
  'seoul-sale-market-monthly-brief': ['서울 아파트 더 팔렸다고, 내 집도 오른 걸까?', 'More Seoul Apartments Sold. Did Yours Get More Expensive?', '서울 아파트 거래량 가격 해석', 'Seoul apartment sales volume versus prices'],
  'seoul-jeonse-market-monthly-brief': ['전세 싸게 구했다고 끝? 보증금은 다른 이야기다', 'A Cheap Seoul Jeonse. What Happens to Your Deposit?', '서울 전세 보증금 가격 비교', 'Seoul jeonse deposit price comparison'],
  'seoul-monthly-rent-market-brief': ['월세 80만 원이 100만 원보다 비쌀 수 있을까?', 'Could ₩800,000 Rent Cost More Than ₩1 Million?', '서울 월세 보증금 관리비 비교', 'Seoul monthly rent deposit and fees'],
  'singapore-private-market-quarterly-brief': ['싱가포르 집값, 올랐다는 한마디로 끝내면 틀린다', 'Singapore Prices Rose. That’s Not the Whole Story.', '싱가포르 민간주택 지역별 가격 임대료', 'Singapore private housing regional prices rents'],
  'seoul-district-price-distribution': ['용산이 강남보다 비싸다고? 이 표부터 뜯어보자', 'Yongsan Above Gangnam? Look at What This Table Counts.', '서울 용산 강남 아파트 가격 중앙값', 'Yongsan Gangnam property price medians'],
  'seoul-new-renewal-rent-gap': ['같은 건물인데, 새 세입자는 보증금을 더 냈다', 'Same Seoul Building. New Tenants Needed a Bigger Deposit.', '서울 도봉구 신규 갱신 전세 보증금', 'Seoul Dobong new versus renewed jeonse'],
  'korea-deposit-monthly-rent-cost-structure': ['월세 85만 원 보고 왔는데, 계산은 122만 원?', 'You Saw ₩850,000 Rent. Why Does the Budget Say ₩1.22M?', '서울 월세 관리비 보증금 기회비용', 'Seoul rent management fees deposit costs'],
  'singapore-ccr-rcr-ocr-comparison': ['싱가포르 중심부가 무조건 비싸다? 집부터 맞춰보자', 'Central Singapore Always Costs More? Compare the Homes First.', '싱가포르 CCR RCR OCR 콘도 비교', 'Singapore CCR RCR OCR condo comparison'],
  'how-to-read-property-transaction-prices-and-medians': ['집값이 두 배 됐다는데, 오른 집은 한 채도 없다?', 'The Median Price Doubled. What If No Home Got Pricier?', '부동산 실거래가 중앙값 거래 구성', 'Property transaction medians and sales mix'],
  'singapore-condo-absd-60-percent-real-acquisition-cost': ['싱가포르 집값 보고 준비했는데, 세금에서 멈췄다', 'You Budgeted for the Singapore Condo. Did You Budget for the Tax?', '싱가포르 외국인 콘도 취득비용 ABSD', 'Singapore foreign buyer condo acquisition costs ABSD'],
  'dubai-flexi-rent-monthly-payments-total-cost': ['두바이 월세 나눠 내면 이득? 총액을 보면 달라진다', 'Dubai Rent in Monthly Payments. Easier—or Cheaper?', '두바이 월납 임대료 Flexi Rent 총비용', 'Dubai monthly rental payments Flexi Rent cost'],
  'seoul-august-2026-sales-reporting-lag': ['8월은 끝났는데, 서울 거래 순위는 아직 바뀐다', 'August Is Over. Seoul’s Sales Rankings Aren’t Finished.', '서울 2026년 8월 실거래 신고 시차', 'Seoul August 2026 sales reporting lag'],
  'singapore-rents-vacancy-landlord-income-2026': ['월세 더 받으려다, 싱가포르 집주인 수입이 줄었다?', 'Hold Out for Higher Singapore Rent—and Collect Less?', '싱가포르 임대료 공실 임대수입', 'Singapore rental income vacancy costs'],
  'tokyo-august-2026-asking-prices-inquiry-gap': ['도쿄 집값 1억 엔 넘는다는데, 사람들이 찾은 집은 달랐다', 'Tokyo Listings Top ¥100M. Buyers Are Looking Elsewhere.', '도쿄 2026년 8월 맨션 호가 문의가격', 'Tokyo August 2026 apartment asking inquiry prices'],
};

const DISCOVERY_DECKS: Readonly<Record<string, readonly [string, string]>> = {
  'seoul-84sqm-under-one-billion-2026': ['서울 84㎡ 아파트를 10억 원 이하로 산 기록은 어디에 남았을까? 2026년 7~8월 거래에서 찾은 후보와 단지 안의 가격 차이를 함께 살펴봤다.', 'Where did Seoul buyers find 84㎡ apartments at or below ₩1 billion? Explore July–August 2026 contracts and the price gaps hidden inside a single complex.'],
  'seoul-59sqm-under-700-million-2026': ['7억 원 예산으로 서울 아파트를 찾는다면 어느 동네부터 볼까? 55~65㎡ 거래 표본에서 17개 그룹이 통과한 조건과 반복 거래를 확인한다.', 'Where can a ₩700 million Seoul apartment search begin? See the 17 source groups that passed a 55–65 sqm transaction screen—and what the screen leaves out.'],
  'singapore-condos-under-1-5-million-2026': ['싱가포르 콘도 18개 단지가 재판매 기준을 통과했다. S$150만 예산의 후보를 보고, 집값과 취득에 필요한 전체 자금이 왜 다른지 확인한다.', 'Eighteen Singapore projects passed the resale screen. Explore a S$1.5 million condo budget, then see why the purchase price is only one part of the cash required.'],
  'dubai-rental-yield-after-costs': ['두바이 부동산 수익률 7%가 실제 수입과 다른 이유. 가상 아파트의 공실·관리비·대출을 차례로 계산해 통장에 남는 돈을 살펴본다.', 'A 7% Dubai rental yield sounds simple. Follow an illustrative apartment through vacancy, recurring costs and financing to see what reaches the bank account.'],
  'korea-foreon-neighbour-price-gap': ['포레온 가까이에 산다는 이유만으로 같은 상승을 기대해도 될까? 주변 아파트 가격 차이를 새집의 상품성과 동네 변화로 나눠 읽는다.', 'Does buying near Foreon buy the same upside? Separate neighbourhood improvements from the features of a new apartment before treating a price gap as an opportunity.'],
  'singapore-lentor-launch-resale-divergence': ['렌토르 새 분양 주변의 두 콘도는 왜 다르게 움직였을까? 시즌스파크와 캐슬그린의 가격 변화를 비교하고, 가까우면 수혜라는 설명을 점검한다.', 'Two condos near Lentor’s new launches moved differently. Compare Seasons Park and Castle Green before assuming that proximity explains the gains.'],
  'seoul-footfall-shop-rent-capacity': ['서울 핫플의 긴 줄이 비싼 상가 월세를 보장할까? 가상 점포의 통행량·결제·비용을 연결해, 사람이 많은 거리와 버티는 가게의 차이를 본다.', 'Does a queue on a busy Seoul street justify a high retail rent? Two illustrative shops connect footfall, purchases and costs to the rent a business can sustain.'],
  'dubai-valuation-purchase-cash-gap': ['두바이 집값을 맞췄는데도 준비할 현금이 늘어날 수 있다. 매도인의 가격과 은행 감정가가 다를 때 대출·자기자금 계산이 어떻게 바뀌는지 본다.', 'Your Dubai offer is agreed, but your cash requirement may still change. See how the lender’s valuation and final loan terms can reshape the purchase budget.'],
  'tokyo-older-apartments-shinagawa-renewal-2026': ['새 주방과 바닥만 보고 도쿄 구축 맨션을 골라도 될까? 초자마루 재생 사례를 통해 실내 인테리어와 건물 전체 갱신의 차이를 살펴본다.', 'A fresh kitchen can make an older Tokyo apartment feel new. The Chojamaru renewal project shows what an interior photograph cannot tell you about the building.'],
  'seoul-august-2026-sales-reporting-lag': ['지난달 서울 아파트 거래 순위가 오늘 달라졌다면? 계약일과 신고일의 차이, 뒤늦은 신고와 해제가 8월 거래 화면을 바꾸는 과정을 살펴본다.', 'Why did last month’s Seoul apartment rankings change today? Contract dates, later reports and cancellations explain why an August table can move in September.'],
  'singapore-rents-vacancy-landlord-income-2026': ['싱가포르 월세가 오르면 집주인도 더 벌까? 추가 임대료를 기다리는 한 달이 수입을 어떻게 바꾸는지 가상 계약으로 계산한다.', 'Higher Singapore rents do not automatically mean more collected income. An illustrative comparison puts a price on the empty month spent waiting for a better tenant offer.'],
  'tokyo-august-2026-asking-prices-inquiry-gap': ['도쿄 맨션 평균 호가와 사람들이 문의한 집의 가격은 왜 벌어졌을까? 서로 다른 매물 집단을 구분하고, 그 차이를 할인율로 읽을 수 없는 이유를 본다.', 'Tokyo apartment listing prices and enquiry prices tell different stories. Explore the gap between the homes offered and those attracting interest—without mistaking it for a discount.'],
};

export function discoveryCopy(slug: string, locale: string) {
  if (locale !== 'ko' && locale !== 'en') return null;
  const copy = DISCOVERY_COPY[slug] ?? DISCOVERY_COPY[slug.replace(/-en$/u, '')];
  if (!copy) return null;
  return { title: copy[locale === 'ko' ? 0 : 1], searchTitle: copy[locale === 'ko' ? 2 : 3] };
}

export function refreshDiscovery<T extends {slug: string; locale: string; title: string; deck: string; bodyMarkdown: string; updatedAt: string}>(article: T): T {
  const copy = discoveryCopy(article.slug, article.locale);
  if (!copy || Date.parse(article.updatedAt) > Date.parse(DISCOVERY_UPDATED_AT)) return article;
  const deck = DISCOVERY_DECKS[article.slug] ?? DISCOVERY_DECKS[article.slug.replace(/-en$/u, '')];
  const nextDeck = deck?.[article.locale === 'ko' ? 0 : 1] ?? article.deck;
  return { ...article, title: copy.title, deck: nextDeck, updatedAt: DISCOVERY_UPDATED_AT };
}
