import type { EditorialPortfolioRecord } from './portfolio-types';

const checkedAt = '2026-09-13T12:00:00Z';
const ura = { id: 'ura-private-data-check-20260913', kind: 'primary' as const, publisher: 'Urban Redevelopment Authority', title: 'Private residential property data', href: 'https://www.ura.gov.sg/property-data/private-residential-properties/', checkedAt };
const dld = { id: 'dld-rental-definitions-check-20260913', kind: 'primary' as const, publisher: 'Dubai Land Department', title: 'Residential Rental Performance Index — historical methodology context', href: 'https://dubailand.gov.ae/en/open-data/residential-rental-performance-index/', checkedAt };
const roots = { id: 'nhb-queenstown-check-20260913', kind: 'primary' as const, publisher: 'National Heritage Board / Roots', title: 'My Queenstown Heritage Trail', href: 'https://www.roots.gov.sg/places/places-landing/trails/my-queenstown-heritage-trail', checkedAt };
const tokyo = { id: 'gotokyo-kiyosumi-check-20260913', kind: 'primary' as const, publisher: 'GO TOKYO', title: 'Kiyosumi Shirakawa', href: 'https://www.gotokyo.org/en/destinations/eastern-tokyo/kiyosumi-shirakawa/index.html', checkedAt };

type Story = { slug: string; marketId: EditorialPortfolioRecord['marketId']; source: typeof ura; en: [string,string,string]; ko: [string,string,string] };
const stories: Story[] = [
  {
    slug: 'singapore-lower-psf-higher-total-budget', marketId: 'sg-singapore', source: ura,
    en: ['A lower psf can still mean a bigger Singapore condo budget', 'The bigger home can look cheaper per square foot and still cost S$200,000 more. Read both numbers before choosing a shortlist.', `## Two prices, two different questions
A unit price answers how much each square foot costs. The total price answers how much the home costs. Sorting by one does not sort by the other.

Here is an illustrative calculation, not a listing or a reported transaction:

| Example | Floor area | Total price | Price per ft² |
| --- | --- | --- | --- |
| A | 900 ft² | S$1.8M | S$2,000 |
| B | 1,100 ft² | S$2.0M | S$1,818 |

B costs about 9.1% less per square foot, but its total price is S$200,000 higher. It also offers 200 ft² more. Neither number alone tells you which trade-off fits your household.

## Set the budget before sorting the table
Start with a total purchase-price ceiling. Then compare the floor area available within it. If you start with the lowest psf, larger homes can crowd the top of your shortlist even when they exceed that ceiling.

Keep acquisition expenses and ongoing ownership costs in a separate budget. The price column is not an all-in cost estimate. This example does not calculate taxes, financing eligibility or loan payments.

## Compare like with like
Within the affordable set, narrow the comparison by location, property type, tenure and transaction period. Then inspect differences such as age, condition and layout. An extra room that you can use may matter more than an attractive unit-price ranking.

Use one area unit throughout. A price per square metre and a price per square foot are not interchangeable; 1 m² is approximately 10.764 ft². Rounding belongs at the display stage, after the calculation.

## Turn a ranking into a shortlist
Write down three columns: total price, floor area and unit price. Add the transaction date beside them. The [URA property-data hub](https://www.ura.gov.sg/property-data/private-residential-properties/) provides access to private residential transaction and rental information; keep recorded contracts separate from current asking prices.

Give each shortlisted home a one-line space requirement: a work desk, storage or somewhere the household can sit together. A specific use makes extra floor area easier to evaluate. Check where that space appears in the layout, not only the area printed in the description.

The useful question is not simply “Which home has the lowest psf?” It is “Which affordable home gives me space I will actually use?”`],
    ko: ['싱가포르 콘도, psf가 낮아도 총예산은 더 커질 수 있다', '면적당 가격은 낮은데 집값은 S$200,000 더 높다. 후보를 고르기 전에 함께 봐야 할 두 숫자.', `## 면적당 가격과 총액은 서로 다른 질문이다
psf는 1제곱피트당 가격이다. 총액은 그 집 전체의 가격이다. psf가 낮은 순서로 정렬해도 총액이 낮은 순서가 되지는 않는다.

다음은 계산을 설명하기 위한 가상 예시다. 실제 매물이나 신고된 계약이 아니다.

| 예시 | 면적 | 총액 | 1ft²당 가격 |
| --- | --- | --- | --- |
| A | 900 ft² | S$1.8M | S$2,000 |
| B | 1,100 ft² | S$2.0M | S$1,818 |

B의 면적당 가격은 약 9.1% 낮지만 총액은 S$200,000 높다. 대신 면적이 200 ft² 넓다. 어느 쪽이 나은지는 가구의 예산과 공간 사용 방식에 달려 있다.

## 예산을 먼저 정하고 정렬하자
먼저 매매 총액의 상한을 정한 다음, 그 범위 안에서 확보할 수 있는 면적을 비교하자. 가장 낮은 psf부터 찾으면 예산을 넘는 큰 집이 후보 목록을 채울 수 있다.

취득 부대비용과 보유 중 비용은 별도 예산으로 잡는다. 거래금액 열은 모든 비용을 합친 금액이 아니다. 이 예시는 세금·대출 자격·상환액을 계산한 것이 아니다.

## 비교 조건을 좁히자
예산 안에 들어온 후보끼리 지역, 주택 유형, 권리 형태, 거래 기간을 맞춘다. 그다음 연식·상태·평면 차이를 본다. 실제로 사용할 수 있는 방 하나가 낮은 psf 순위보다 중요할 수도 있다.

면적 단위도 통일해야 한다. 1m²는 약 10.764ft²이므로 m²당 가격과 ft²당 가격을 그대로 비교하면 안 된다. 반올림은 계산을 마친 뒤 표시할 때 적용한다.

## 순위를 생활의 후보로 바꾸는 방법
총액·면적·면적당 가격을 나란히 적고 거래 시점도 붙여 보자. [URA 자료 페이지](https://www.ura.gov.sg/property-data/private-residential-properties/)에서 민간 주거 매매·임대 자료로 연결할 수 있다. 체결된 계약과 현재 호가는 구분해서 읽는다.

후보마다 반드시 필요한 공간을 한 줄로 적어 보자. 재택근무용 책상, 수납, 가족이 함께 앉을 공간처럼 용도가 구체적이면 넓어진 면적의 가치도 판단하기 쉬워진다. 광고에 적힌 면적뿐 아니라 평면에서 그 공간이 어디에 쓰이는지도 함께 살펴볼 수 있다.

질문은 ‘psf가 가장 낮은 집은?’에서 ‘내 예산 안에서 실제로 쓸 공간을 주는 집은?’으로 바뀐다.`],
  },
  {
    slug: 'dubai-new-renewal-rent-mix', marketId: 'ae-dubai', source: dld,
    en: ['Dubai rent medians: who signed can change the headline', 'New leases and renewals answer different questions. A changing mix can move the overall median even when each group stays still.', `## One median can hide two experiences
An incoming tenant and a tenant renewing an existing lease are not necessarily represented by the same rent benchmark. DLD's historical rental-performance material distinguishes new contracts from renewals, and annual from non-annual contracts.

That source is used here to explain categories, not to report a September 2026 rent level.

## A mix change can look like a price change
Consider two invented samples of annual contracts. These are teaching examples, not Dubai market observations.

| Illustrative sample | Renewals at AED 80,000/year | New leases at AED 100,000/year | Combined median |
| --- | --- | --- | --- |
| A | 8 contracts | 2 contracts | AED 80,000/year |
| B | 2 contracts | 8 contracts | AED 100,000/year |

The combined median rises 25%. Yet the rent within each group has not changed. Only the number of contracts in each group has changed. In real data, both prices and the mix can move at once.

## Choose the comparison for your move
If you are entering the market, inspect new-lease observations separately. If you are studying existing tenants' experience, inspect renewals. Keep area, bedroom count, property type and period comparable before treating a difference as meaningful.

A new-versus-renewal gap is not a promised negotiating discount. Different homes and tenant circumstances can sit in the two groups. Nor does a market median determine the permitted increase for an individual lease.

## Keep the annual unit visible
For an annual amount, dividing by 12 gives a monthly equivalent. It does not establish a monthly payment schedule, and it does not turn a short-stay quote into a comparable annual contract.

Check the count in each contract category, not only the total sample size. A large pooled sample can still contain few contracts of the type you need. Keep the category and area filters unchanged when comparing periods. Record the new-lease share alongside the median so a change in the mix is easier to spot.

When reading the next rent headline, look for four things: the period, the contract category, the annual or monthly basis, and the number of contracts. If the categories have been pooled, treat the headline as a broad description rather than your personal rent quote.

[DLD's rental-performance page](https://dubailand.gov.ae/en/open-data/residential-rental-performance-index/) is the category reference for this explainer.`],
    ko: ['두바이 임대료 중앙값, 누가 계약했는지가 숫자를 바꾼다', '신규 계약과 갱신 계약을 섞으면 각 집단의 임대료가 그대로여도 전체 중앙값이 달라질 수 있다.', `## 하나의 중앙값에 서로 다른 경험이 담긴다
새로 들어오는 세입자와 기존 계약을 갱신하는 세입자에게 같은 임대료 기준이 맞는 것은 아니다. DLD의 과거 임대시장 자료는 신규·갱신 계약, 연간·비연간 계약을 구분한다.

이 글은 그 분류를 설명한다. 해당 과거 자료를 2026년 9월 임대료로 제시하는 글은 아니다.

## 구성 변화가 가격 변화처럼 보일 때
다음은 연간 계약으로만 구성한 가상 표본이다. 실제 두바이 시장 집계가 아니다.

| 가상 표본 | 연 AED 80,000 갱신 | 연 AED 100,000 신규 | 전체 중앙값 |
| --- | --- | --- | --- |
| A | 8건 | 2건 | 연 AED 80,000 |
| B | 2건 | 8건 | 연 AED 100,000 |

전체 중앙값은 25% 높아진다. 하지만 신규와 갱신 각각의 가격은 그대로다. 각 집단의 계약 수만 바뀌었다. 실제 시장에서는 구성과 가격이 동시에 움직일 수 있다.

## 내 상황에 맞는 비교를 고르자
이사를 준비한다면 신규 계약을, 기존 세입자의 경험을 살핀다면 갱신 계약을 따로 보자. 지역·침실 수·주택 유형·기간을 맞춘 뒤 차이를 읽어야 한다.

두 집단의 가격 차이가 그대로 협상 가능한 할인율은 아니다. 집의 구성과 계약 사정이 다를 수 있기 때문이다. 시장 중앙값이 개별 계약의 허용 인상폭을 정하는 것도 아니다.

## 연간 금액인지 끝까지 표시하자
연간 임대료를 12로 나누면 월 환산액이다. 월별 납부가 가능하다는 뜻은 아니다. 단기 숙박 가격을 연간 주거 계약과 바로 비교할 수도 없다.

표본 수는 총건수만 보지 말고 신규와 갱신 각각 몇 건인지 나누어 확인하자. 전체 표본이 많아 보여도 내가 비교하려는 유형은 적을 수 있다. 같은 지역의 이전 기간과 비교할 때에도 분류와 면적 조건을 그대로 유지해야 구성 변화에 덜 흔들린다. 중앙값 옆에 신규 계약 비중도 함께 기록하면, 구성 변화가 있었는지 다음 비교에서 더 쉽게 확인할 수 있다.

다음 임대료 제목에서는 기간·계약 유형·연간 또는 월간 단위·건수를 확인하자. 신규와 갱신이 합쳐져 있다면 전체 시장 설명으로 읽고, 내 집의 계약 예상액으로 바로 옮기지 않는 편이 좋다.

분류 참고: [DLD 임대시장 자료](https://dubailand.gov.ae/en/open-data/residential-rental-performance-index/).`],
  },
  {
    slug: 'singapore-queenstown-everyday-heritage', marketId: 'sg-singapore', source: roots,
    en: ['Queenstown: read Singapore through an everyday neighbourhood', 'Start with housing history, then test the ordinary journey between home, errands and a place to pause.', `![Queenstown Public Library facade in Singapore](/assets/editorial/queenstown-library-2025.jpg "Queenstown Public Library · Chainwit. · 24 March 2025 · CC BY 4.0. Listing thumbnail cropped; article photo unaltered.")

## A neighbourhood before a shortlist
Queenstown offers a way to look at Singapore beyond a condo ranking. The National Heritage Board's Roots trail describes the country's first satellite estate through its housing development and residents' memories. My Community developed the trail with NHB support.

Use that history as a starting point. The question for a visit is how an established residential district works at an ordinary hour, not how many landmarks can be collected in an afternoon.

## Pick one everyday anchor
The library in the photograph is one possible anchor for planning a visit. Before travelling, confirm current access and opening arrangements. The photograph records March 2025; it is not a live view or a promise about today's services.

From an anchor, choose a route toward a home you are considering. Look for the details a neighbourhood name cannot tell you: crossings, shade, road noise and the point where a convenient-looking route becomes a detour.

## Make the walk useful
Try the route at the time you would normally use it. Note where you would buy groceries and where you would wait out a downpour. Check the journey from the actual building entrance, rather than a map pin in the middle of the estate.

These are suggested observations, not measured walking times or claims that every block shares the same amenities.

## Read housing types separately
A broad Queenstown price label is not a substitute for a comparable-home search. Keep public housing and private condos separate, then match floor area, tenure and transaction period within the relevant set. Check the rules for the housing type and your own circumstances before assuming a home is an available option.

Afterwards, put attractive scenery and everyday requirements in separate columns. Would the pleasant walk still work while carrying groceries, and does the actual entrance connect to it? This keeps a broad neighbourhood impression from becoming an untested claim about one development.

Keep the visit date and time in your notes so the next neighbourhood can be compared under similar conditions.

For a first visit, the aim is a smaller, better shortlist: a few streets whose everyday routines make sense to you.

Explore the [official heritage trail](https://www.roots.gov.sg/places/places-landing/trails/my-queenstown-heritage-trail). Photo: [Chainwit., original file](https://commons.wikimedia.org/wiki/File:Queenstown_Public_Library,_SG_%282025%29_-_img_15.jpg), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).`],
    ko: ['퀸스타운: 생활의 동선으로 읽는 싱가포르', '주거의 역사를 출발점으로 삼아 집·장보기·잠깐 쉴 곳을 잇는 평범한 하루를 살펴보자.', `![싱가포르 퀸스타운 공공도서관 외관](/assets/editorial/queenstown-library-2025.jpg "퀸스타운 공공도서관 · Chainwit. · 2025년 3월 24일 · CC BY 4.0. 목록 썸네일만 크롭, 본문 원본 유지.")

## 후보 단지보다 동네를 먼저 보자
퀸스타운은 콘도 순위 바깥에서 싱가포르를 읽는 출발점이 된다. 국립유산위원회 Roots의 산책 코스는 싱가포르 최초의 위성 주거지라는 역사와 주민의 기억을 다룬다. My Community가 NHB의 지원을 받아 만든 코스다.

그 역사를 출발점으로 삼되, 방문에서는 평범한 시간대의 생활을 살펴보자. 하루 동안 명소를 몇 곳 봤는지보다 내가 반복할 동선이 어떤지가 중요하다.

## 생활의 기준점 하나를 고르자
사진 속 도서관은 방문 계획의 기준점이 될 수 있다. 이동 전 현재 이용 가능 여부와 운영 시간을 확인하자. 사진은 2025년 3월의 기록이며 오늘의 시설 상태를 보여주는 실시간 화면은 아니다.

기준점에서 관심 있는 집 방향으로 걸어볼 길을 고른다. 횡단보도·그늘·차량 소음, 지도에서는 가까운데 실제로는 돌아가야 하는 구간을 살펴보자.

## 산책을 주거 판단으로 연결하기
실제로 그 길을 이용할 시간대에 방문해 보자. 장을 볼 곳과 갑자기 비가 올 때 기다릴 곳을 기록한다. 단지 중앙의 지도 핀보다 해당 건물 출입구에서 동선을 확인하는 편이 유용하다.

이는 현장에서 살펴볼 항목이다. 측정한 도보 시간이나 모든 블록의 편의시설을 보장하는 설명은 아니다.

## 주택 유형은 나누어 읽자
‘퀸스타운 가격’ 하나로 집을 비교하기는 어렵다. 공공주택과 민간 콘도를 구분하고, 해당 유형 안에서 면적·권리 형태·거래 기간을 맞추자. 내 상황에서 선택할 수 있는 주택인지는 유형별 규정을 따로 확인해야 한다.

집으로 돌아온 뒤에는 좋았던 풍경과 생활에 필요한 조건을 다른 칸에 적어 보자. 산책하기 좋았던 거리가 매일 장을 들고 걷기에도 편한지, 원하는 집의 출입구가 그 길과 연결되는지 다시 확인한다. 동네 전체의 인상을 특정 단지의 장점으로 그대로 옮기지 않으면 다음 방문에서 확인할 질문이 더 선명해진다.

메모에는 방문한 날짜와 시간도 함께 남긴다. 나중에 다른 후보를 볼 때 같은 조건으로 비교하기 위한 작은 기록이다.

첫 방문의 목표는 후보를 늘리는 것보다 생활 동선이 맞는 몇 개의 거리로 좁히는 것이다.

[공식 헤리티지 코스](https://www.roots.gov.sg/places/places-landing/trails/my-queenstown-heritage-trail). 사진: [Chainwit. 원본](https://commons.wikimedia.org/wiki/File:Queenstown_Public_Library,_SG_%282025%29_-_img_15.jpg), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).`],
  },
  {
    slug: 'tokyo-kiyosumi-shirakawa-between-stops', marketId: 'jp-tokyo', source: tokyo,
    en: ['Kiyosumi-Shirakawa: look between the coffee stops', 'A garden, contemporary art and residential streets provide three different ways to read this eastern Tokyo neighbourhood.', `![Ryotei pavilion at Kiyosumi Gardens, photographed in 2013](/assets/editorial/kiyosumi-garden-2013.jpg "Kiyosumi Gardens, Ryotei · Ippukucho · 22 February 2013 · CC BY 3.0. Archive photo; thumbnail cropped, article photo unaltered.")

## Give the neighbourhood more than a café stop
GO TOKYO presents Kiyosumi-Shirakawa through both its older character and its coffee scene. Its area guide points to Kiyosumi Gardens, the Museum of Contemporary Art Tokyo and Kiba Park. Kiyosumi-shirakawa Station is served by the Hanzomon and Oedo lines.

Those are useful starting points for a visit. They are not a description of every residential street or a guarantee that a particular home has the same access.

## Choose one anchor, then leave the itinerary open
For a first visit, choose the garden or the museum as an anchor rather than trying to fit everything into one timed route. Check current opening information with the venue. The garden photograph here dates from 2013 and is included as an archive image, not a current condition report.

Spend part of the visit on the ordinary streets between destinations. Notice how the route feels when there is no attraction to arrive at: where you cross a road, where you can pause and where traffic changes the atmosphere.

## Separate a pleasant afternoon from a workable week
If you are considering living nearby, repeat the relevant part of the walk on a weekday. Test the station exit you would actually use and the route to a specific building. A station name alone does not capture the last part of a commute.

Record the questions still unanswered: grocery shopping, bicycle storage, noise at your usual return time and the building's entrance arrangements. These are things to inspect, not amenities verified by this guide.

## Put a smaller area around your housing comparison
Use the visit to define the streets you would include in a search. Then compare similar floor areas and building ages within that area. Keep asking prices apart from reported transactions, and do not infer a named building from an anonymised Tokyo record.

Separate places you enjoyed from living conditions you have not yet checked. Would the comfortable weekend route also work at your weekday return time or in rain? Adding a repeatable daily journey to the first impression makes the next home-viewing shortlist more specific.

Keep a note of the route and visit time. It gives the next neighbourhood comparison something more concrete than a memory.

A neighbourhood introduction should help you decide where to look more closely. It cannot replace viewing a home or checking its individual terms.

Read the [GO TOKYO area guide](https://www.gotokyo.org/en/destinations/eastern-tokyo/kiyosumi-shirakawa/index.html). Photo: [Ippukucho, original file](https://commons.wikimedia.org/wiki/File:KiyosumiGarden8.JPG), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).`],
    ko: ['기요스미시라카와: 커피 한 잔 사이의 거리를 보자', '정원·현대미술·주거 골목. 도쿄 동쪽의 이 동네를 세 가지 속도로 읽는 방법.', `![2013년에 촬영한 기요스미 정원의 료테이](/assets/editorial/kiyosumi-garden-2013.jpg "기요스미 정원 료테이 · Ippukucho · 2013년 2월 22일 · CC BY 3.0. 과거 사진, 목록만 크롭·본문 원본 유지.")

## 카페 한 곳보다 조금 더 넓게
GO TOKYO는 기요스미시라카와의 오래된 분위기와 커피 문화를 함께 소개한다. 지역 안내에는 기요스미 정원·도쿄도현대미술관·기바공원이 등장한다. 기요스미시라카와역에는 한조몬선과 오에도선이 지난다.

방문의 출발점으로 쓸 수 있는 정보다. 모든 주거 골목의 분위기나 개별 집의 접근성을 설명하는 것은 아니다.

## 기준점 하나만 정하고 사이를 걸어보자
처음에는 정원이나 미술관 하나를 기준점으로 정해 보자. 모든 장소를 시간표에 넣기보다 사이의 거리를 보는 시간을 남긴다. 운영 정보는 방문 전 각 시설에서 확인하자. 본문 정원 사진은 2013년 기록으로, 현재 상태를 확인한 사진은 아니다.

목적지 사이의 평범한 길에서는 횡단 위치와 잠시 멈출 곳, 차량 흐름에 따라 분위기가 바뀌는 구간을 살펴보자.

## 좋은 오후와 살기 좋은 일주일은 따로 확인하기
거주를 생각한다면 필요한 구간을 평일에도 걸어 보자. 실제로 이용할 역 출구와 관심 건물까지의 길을 확인한다. 역 이름만으로는 출퇴근의 마지막 구간까지 알 수 없다.

장보기·자전거 보관·평소 귀가 시간의 소음·건물 출입 방식처럼 아직 모르는 것을 기록해 보자. 이 글이 확인한 편의시설 목록이 아니라 현장에서 살펴볼 질문이다.

## 주거 비교의 범위를 작게 잡자
산책 후에는 실제로 찾아보고 싶은 거리의 범위를 정한다. 그 안에서 비슷한 면적과 연식의 집을 비교하자. 호가와 신고 거래는 구분하고, 익명화된 도쿄 거래를 특정 건물이라고 추정하지 않는다.

방문 메모에는 마음에 든 장소와 아직 확인하지 못한 생활 조건을 나누어 적자. 주말에 편안했던 길이 평일 귀가 시간에도 같은지, 비가 오는 날에는 어떤 경로를 택할지 질문을 남긴다. 카페와 정원이 주는 첫인상에 실제로 반복할 하루의 동선을 더하면, 다음에 볼 집을 고르는 기준이 조금 더 구체적으로 바뀐다.

그날 걸었던 경로와 방문 시간도 남겨 두자. 다른 동네를 볼 때 막연한 기억보다 구체적인 비교 기준이 된다.

동네 소개가 해줄 수 있는 일은 더 자세히 볼 곳을 고르는 것이다. 개별 집의 방문과 계약 조건 확인은 그다음 단계다.

[GO TOKYO 지역 안내](https://www.gotokyo.org/en/destinations/eastern-tokyo/kiyosumi-shirakawa/index.html). 사진: [Ippukucho 원본](https://commons.wikimedia.org/wiki/File:KiyosumiGarden8.JPG), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).`],
  },
];

export const SEPTEMBER_13_EDITORIAL: readonly EditorialPortfolioRecord[] = stories.flatMap(story => (['en', 'ko'] as const).map(locale => {
  const [title, deck, bodyMarkdown] = story[locale];
  const prefix = locale === 'en' ? '' : '/ko';
  return {
    id: `${locale}-${story.slug}`, slug: story.slug, locale, marketId: story.marketId,
    type: 'market-brief', title, deck, bodyMarkdown, status: 'published', evidenceState: 'verified',
    authorName: 'SignedPrice Editorial', reviewedBy: 'SignedPrice source check (AI-assisted)',
    reviewedAt: checkedAt, publishedAt: checkedAt, updatedAt: checkedAt,
    readerQuestion: title, revisionNote: 'Original explainer or neighbourhood introduction; source links checked 13 September 2026. Numerical examples are illustrative, not market observations.',
    sources: [{ ...story.source, checkedAt: checkedAt.slice(0, 10) }], evidenceReleaseIds: [story.source.id],
    canonicalHref: `${prefix}/news/${story.slug}/`, translationGroupId: story.slug,
    relatedHref: `${prefix}/news/`, infographic: null,
  };
}));
