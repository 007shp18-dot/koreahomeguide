import type { StoryCity, StoryLocale, StoryText } from './city-stories';

const text = (en: string, ko: string): StoryText => ({ en, ko });
type Item = { title: StoryText; description: StoryText };
const item = (en: string, ko: string, description: string, descriptionKo: string): Item => ({ title: text(en, ko), description: text(description, descriptionKo) });
export const RESOURCE_TYPES = ['checklist', 'glossary'] as const;
export type GuideResource = typeof RESOURCE_TYPES[number];
export const RESOURCE_CITIES = ['seoul', 'tokyo', 'singapore', 'dubai'] as const;
export const RESOURCE_LABELS = { checklist: text('Checklist', '체크리스트'), glossary: text('Glossary', '용어집') };
export const REGIONAL_RESOURCES: Record<StoryCity, { name: StoryText; intro: StoryText; checklist: Item[]; glossary: Item[]; related: string }> = {
  seoul: {
    name: text('Seoul', '서울'), intro: text('Check ownership, deposit protection, permits and funding alongside the costs of buying or renting in Seoul.', '서울 매수·임대차 비용과 함께 소유권·보증금 보호·허가·자금 조달 조건을 확인하세요.'),
    related: '/guides/rent-an-apartment-in-korea/',
    checklist: [
      item('Confirm the listing units', '매물의 금액 단위 확인', 'Ask for deposit and monthly rent in full KRW. Do not assume a shorthand such as 1,000/80 uses a particular unit.', '보증금과 월세를 원 단위로 받으세요. 1,000/80 같은 표기는 단위를 먼저 확인합니다.'),
      item('Separate deposit from monthly spending', '보증금과 월 지출 구분', 'List deposit cash separately from rent, management fees and utilities. Add funding costs if you need to borrow the deposit.', '보증금은 월세·관리비·공과금과 별도로 정리하고, 보증금 대출이 필요하면 조달 비용을 더하세요.'),
      item('Ask what the management fee includes', '관리비 포함 항목 확인', 'Request an itemized list and a recent bill. Identify separately billed electricity, gas, water and internet.', '항목별 명세와 최근 고지서를 요청하고 전기·가스·수도·인터넷의 별도 납부 여부를 확인하세요.'),
      item('Match the home and the contracting party', '매물과 계약 상대방 대조', 'Check the exact address and unit against current ownership records. Confirm who signs and why the named account receives the payment.', '정확한 주소·호실을 최신 소유권 자료와 대조하고 서명자와 입금 계좌 명의의 관계를 확인하세요.'),
      item('Get payment and refund terms in writing', '납부·환불 조건 서면 확인', 'Request each amount, due date and refund condition before transferring money, including one-time fees.', '송금 전 일회성 비용을 포함한 항목별 금액·납부일·환불 조건을 서면으로 받으세요.'),
      item('Inspect and record the move-in condition', '입주 상태 점검·기록', 'Test heating, water and locks; record existing damage and meter readings. Agree how repairs and handover will be handled.', '난방·수도·잠금장치를 확인하고 기존 하자와 계량기 수치를 기록하세요. 수리와 인계 방법도 합의합니다.'),
    ],
    glossary: [
      item('보증금 · Deposit', '보증금', 'Money held under the rental agreement, separate from monthly rent. Return timing and possible deductions depend on the agreement and applicable rules.', '임대차계약에 따라 맡기는 금액으로 월세와 구분됩니다. 반환 시점과 공제 여부는 계약과 적용 규정에 따라 확인해야 합니다.'),
      item('월세 · Wolse', '월세', 'A rental arrangement with recurring monthly rent, often alongside a deposit. Compare both amounts.', '매달 임대료를 내는 방식입니다. 보증금이 함께 있는 경우 두 금액을 같이 비교하세요.'),
      item('전세 · Jeonse', '전세', 'A deposit-based rental arrangement generally without monthly rent. Deposit funding and recovery still matter.', '일반적으로 월세 없이 보증금을 맡기는 임대 방식입니다. 보증금 조달 비용과 반환 가능성을 함께 확인해야 합니다.'),
      item('관리비 · Management fee', '관리비', 'A recurring charge whose included services vary by property and agreement. It does not automatically include every utility.', '매물과 계약별로 포함 항목이 다른 관리 비용입니다. 모든 공과금이 포함된다고 가정하면 안 됩니다.'),
      item('전용면적 · Exclusive-use area', '전용면적', 'The area designated for the household’s exclusive use. Confirm the stated measurement before comparing it with a larger marketed area.', '세대가 전용으로 사용하는 것으로 표시된 면적입니다. 더 크게 표기된 다른 면적과 비교하기 전 기준을 확인하세요.'),
      item('만원 · Ten thousand won', '만원', 'A monetary unit equal to KRW 10,000. If a listing explicitly uses this unit, 1,000 means KRW 10,000,000.', '1만원은 10,000원입니다. 매물이 만원 단위를 명시했다면 1,000은 1,000만원입니다.'),
    ],
  },
  tokyo: {
    name: text('Tokyo', '도쿄'), intro: text('Look beyond an apartment’s renovation to the building, documents and recurring costs.', '아파트 내부 수리 상태에 더해 건물 관리 문서와 반복 비용을 확인하세요.'), related: '/news/city-stories/tokyo/which-home/',
    checklist: [
      item('Identify the exact unit and area basis', '호실·면적 기준 확인', 'Match the unit, floor plan, recorded area and tenure. Ask which parts of the home the advertised area includes.', '호실·평면도·기록된 면적·권리 형태를 대조하고 광고 면적의 포함 범위를 확인하세요.'),
      item('Read the current repair plan', '최신 수선계획 읽기', 'Request the planned works, dates, estimated costs and funding assumptions for the whole building.', '건물 전체의 예정 공사·일정·예상 비용·재원 가정을 받으세요.'),
      item('Check reserve accounts and unit charges', '적립금 회계·호실 부담 확인', 'Request current reserve accounts, the unit’s monthly contribution and any outstanding amounts.', '최신 수선적립금 회계와 해당 호실의 월 납부액·미납액을 요청하세요.'),
      item('Separate proposals from approved decisions', '제안과 승인된 결정 구분', 'Read recent owners’ meeting minutes for approved or proposed increases and special assessments. Record amounts and dates.', '최근 관리조합 회의록에서 인상·추가 분담금의 승인 여부를 구분하고 금액·날짜를 적으세요.'),
      item('Confirm what was renovated', '리모델링 범위 확인', 'Ask for a dated scope of work. New finishes do not establish the condition of common pipes, structure or building equipment.', '날짜가 있는 공사 내역을 받으세요. 새 마감재만으로 공용 배관·구조·설비 상태를 판단할 수는 없습니다.'),
      item('Obtain a complete payment schedule', '전체 납부 일정 받기', 'Separate purchase price, transaction costs, recurring charges and possible future contributions before comparing units.', '매입 가격·거래 비용·반복 비용·향후 분담 가능액을 분리해 호실을 비교하세요.'),
    ],
    glossary: [
      item('管理費 · Management fee', '管理費 · 관리비', 'Recurring contributions for day-to-day building management. Check the unit statement for the amount and inclusions.', '건물의 일상 관리에 쓰이는 반복 납부금입니다. 호실 명세에서 금액과 포함 항목을 확인하세요.'),
      item('修繕積立金 · Repair reserve contribution', '修繕積立金 · 수선적립금', 'Contributions reserved for building repairs. A monthly contribution and the fund’s current balance are different figures.', '건물 수선을 위해 적립하는 납부금입니다. 월 납부액과 기금의 현재 잔액은 서로 다른 수치입니다.'),
      item('長期修繕計画 · Long-term repair plan', '長期修繕計画 · 장기 수선계획', 'A plan for future building works, costs and timing. Read its funding assumptions and revision date.', '향후 건물 공사·비용·시기를 정리한 계획입니다. 재원 가정과 수정 날짜를 확인하세요.'),
      item('管理組合 · Owners’ association', '管理組合 · 관리조합', 'The condominium owners’ body involved in decisions about common property and its management.', '공동주택의 공용 부분과 관리에 관한 의사결정에 관여하는 구분소유자 조직입니다.'),
      item('議事録 · Meeting minutes', '議事録 · 회의록', 'The record of a meeting. Distinguish a discussed proposal from a resolution that was actually adopted.', '회의 내용을 기록한 문서입니다. 논의한 제안과 실제 채택된 결의를 구분하세요.'),
      item('一時金 · One-time contribution', '一時金 · 일시 부담금', 'An additional one-time payment when specified. Check who owes it, the amount and due date; do not assume every building has one.', '별도로 정해진 일회성 부담금입니다. 납부 의무자·금액·기한을 확인하고 모든 건물에 있다고 가정하지 마세요.'),
    ],
  },
  singapore: {
    name: text('Singapore', '싱가포르'), intro: text('Compare the total price, area definition and ownership conditions of the homes on your shortlist.', '후보 매물의 총 가격·면적 기준·보유 조건을 함께 비교하세요.'), related: '/news/city-stories/singapore/which-home/',
    checklist: [
      item('Match the area definition', '면적 정의 맞추기', 'Ask what the quoted square footage includes. Use the same basis when calculating price per square foot.', '표시된 면적의 포함 범위를 확인하고 면적당 가격 계산에 같은 기준을 사용하세요.'),
      item('Compare total prices as well as PSF', '면적당 가격과 총액 함께 비교', 'Write down the full price for each home. A larger home can have a lower PSF and still require more money.', '매물별 전체 가격을 적으세요. 큰 집은 면적당 가격이 낮아도 더 많은 자금이 필요할 수 있습니다.'),
      item('Label the price evidence', '가격 자료 성격 구분', 'Keep asking prices separate from recorded transactions. Note the date, unit type and whether the comparison is like-for-like.', '호가와 기록된 거래를 구분하고 날짜·호실 유형·비교 조건을 적으세요.'),
      item('Check tenure and remaining term', '권리 기간과 잔여 기간 확인', 'Confirm the tenure and relevant dates in the property documents instead of relying on a listing label alone.', '매물 표기만 믿지 말고 문서에서 권리 형태와 관련 날짜를 확인하세요.'),
      item('Price the full purchase for your buyer profile', '내 조건의 전체 매수 비용 확인', 'Obtain current eligibility, duty and financing advice for your own circumstances. Add itemized fees to the advertised price.', '본인 조건에 맞는 최신 매수 자격·세금·대출 조건을 확인하고 광고 가격에 항목별 비용을 더하세요.'),
      item('Inspect layout and recurring charges', '평면·반복 비용 확인', 'Check usable rooms, light, noise and maintenance charges. Ask which costs are already included to avoid counting them twice.', '실제로 쓸 방·채광·소음·관리 비용을 확인하고 포함 항목을 물어 중복 계산을 피하세요.'),
    ],
    glossary: [
      item('PSF · Price per square foot', 'PSF · 제곱피트당 가격', 'Price divided by the quoted floor area in square feet. Compare only when the price and area definitions match.', '가격을 제곱피트 단위 면적으로 나눈 값입니다. 가격과 면적 정의가 맞는 경우에 비교하세요.'),
      item('Asking price', '호가', 'The price requested by the seller. It is not evidence that a transaction completed at that amount.', '매도자가 요청하는 가격입니다. 그 금액에 거래가 완료되었다는 뜻은 아닙니다.'),
      item('Recorded transaction', '기록된 거래', 'A transaction reported in the stated dataset. Check its date, coverage and property details before treating it as comparable.', '해당 데이터에 보고된 거래입니다. 날짜·포함 범위·매물 세부 조건을 확인한 뒤 비교하세요.'),
      item('Leasehold tenure', '기간이 정해진 권리', 'A property interest with a stated term. Check commencement, expiry and remaining years in the relevant records.', '기간이 정해진 부동산 권리입니다. 관련 기록에서 시작일·만료일·잔여 기간을 확인하세요.'),
      item('Floor area', '면적', 'The measured area quoted for a property. Inclusions can differ; it is not automatically the area you can use as rooms.', '매물에 표시된 측정 면적입니다. 포함 범위가 다를 수 있으며 모두 방으로 사용할 수 있는 면적이라는 뜻은 아닙니다.'),
      item('Recurring maintenance charges', '반복 관리 비용', 'Ongoing contributions associated with the property’s upkeep. Obtain the current amount and included services for the unit.', '부동산 유지관리에 드는 반복 부담금입니다. 호실의 현재 금액과 포함 서비스를 확인하세요.'),
    ],
  },
  dubai: {
    name: text('Dubai', '두바이'), intro: text('Trace the rent, recurring bills and cash needed to buy before relying on a headline yield.', '광고 수익률을 판단하기 전 임대료·반복 비용·매입 자금을 확인하세요.'), related: '/news/dubai-rental-yield-after-costs/',
    checklist: [
      item('Identify the property and ownership record', '매물·소유 기록 확인', 'Match the exact unit and seller to current property documents. Distinguish a completed home from an off-plan purchase.', '정확한 호실과 매도자를 최신 부동산 문서와 대조하고 준공 매물과 분양 중 매물을 구분하세요.'),
      item('Identify the rent behind the yield', '수익률에 쓰인 임대료 확인', 'Is it a current lease, a signed renewal or an estimate for a future tenant? Request the relevant agreement and payment evidence.', '현재 계약인지, 서명된 갱신인지, 미래 임차인에 대한 추정인지 구분하고 계약·입금 근거를 받으세요.'),
      item('Request the current service-charge statement', '최신 서비스 비용 명세 요청', 'Check the correct unit and period, included services and outstanding amounts. Do not treat a published rate as proof that all bills are paid.', '호실·기간·포함 항목·미납액을 확인하세요. 공개 요율만으로 모든 비용이 납부됐다고 판단하지 마세요.'),
      item('Itemize management and repair costs', '관리 수수료·수리 비용 분리', 'Ask whether management is charged on contracted or collected rent, and whether letting and repair costs are separate.', '관리 수수료의 기준이 계약 임대료인지 수취 임대료인지, 임대 중개·수리 비용이 별도인지 확인하세요.'),
      item('List all cash due at purchase', '매입 시 필요한 자금 정리', 'Separate the price from acquisition and finance costs. Use an itemized statement for your transaction rather than a universal percentage.', '가격과 취득·금융 비용을 구분하고 일률적인 비율 대신 해당 거래의 항목별 명세를 사용하세요.'),
      item('Run a vacancy and higher-cost case', '공실·비용 증가 상황 점검', 'Reduce collected rent and keep costs that continue during vacancy. Check loan payments separately from operating income.', '수취 임대료를 줄이고 공실 중 계속되는 비용을 반영하세요. 대출 상환액은 운영 소득과 별도로 확인합니다.'),
    ],
    glossary: [
      item('Gross rental yield', '비용 차감 전 임대수익률', 'Annual rent divided by the stated property-price basis, before costs. Check whether the rent is contracted, collected or assumed.', '비용 차감 전 연 임대료를 표시된 부동산 가격 기준으로 나눈 값입니다. 임대료가 계약·수취·가정 중 무엇인지 확인하세요.'),
      item('Operating income', '운영 소득', 'Collected rent minus the operating costs included in the calculation. Check exclusions; this is not automatically cash after loan payments or tax.', '수취 임대료에서 계산에 포함한 운영비를 뺀 금액입니다. 제외 항목을 확인하세요. 대출·세금 차감 후 현금과는 다릅니다.'),
      item('Service charges', '서비스 비용', 'Recurring charges for the property’s shared services and upkeep. Verify the current unit statement and included items.', '공용 서비스와 유지관리에 대한 반복 비용입니다. 최신 호실 명세와 포함 항목을 확인하세요.'),
      item('Vacancy allowance', '공실 가정', 'An allowance for time without rental receipts. Some ownership costs can continue even when no tenant is paying.', '임대료를 받지 못하는 기간에 대한 가정입니다. 임차인이 없어도 일부 보유 비용은 계속됩니다.'),
      item('Acquisition costs', '취득 비용', 'One-time costs associated with buying, additional to the price. Their allocation and amount depend on the transaction.', '매입 가격 외에 취득과 관련해 발생하는 일회성 비용입니다. 부담 주체와 금액은 거래별로 확인하세요.'),
      item('Off-plan property', '준공 전 분양 부동산', 'A property sold before completion. Its payment, delivery and completion risks need a different review from a completed rental home.', '준공 전에 판매되는 부동산입니다. 대금 지급·인도·준공 위험은 이미 임대 중인 준공 매물과 다르게 검토해야 합니다.'),
    ],
  },
};
export function regionalResourceHref(city: StoryCity, resource: GuideResource, locale: StoryLocale = 'en'): `/${string}` { return `${locale === 'ko' ? '/ko' : ''}/guides/${city}/${resource}/`; }
export function resourceParams() { return RESOURCE_CITIES.flatMap(slug => RESOURCE_TYPES.map(resource => ({ slug, resource }))); }
export function isResourceRoute(city: string, resource: string): city is StoryCity { return (RESOURCE_CITIES as readonly string[]).includes(city) && (RESOURCE_TYPES as readonly string[]).includes(resource); }
