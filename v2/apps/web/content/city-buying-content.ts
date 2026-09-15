import type { ContentLocale } from '../lib/content/content-types';
import type { BuyingCity } from '../lib/home/buying-journey';

export const CITY_BUYING = {
  seoul: {
    market: 'kr-seoul', base: '/kr/seoul', currency: 'KRW', cap: 1000000000,
    name: ['Seoul', '서울', '首尔'],
    why: ['A place to compare a home for your own use with a rental plan, using separately published sale and rental contracts.', '직접 거주할 집과 임대할 집을 함께 검토한다면, 매매와 전세·월세 계약을 구분해 비교할 수 있는 시장입니다.', '若同时考虑自住与出租，可分别核对买卖、全租与月租合同。'],
    tradeoff: ['The same budget does not buy the same size or age in every district. Tenant deposits, condition and address-specific purchase conditions need separate checks.', '같은 예산이어도 구·연식에 따라 면적이 달라집니다. 임차보증금, 수리 상태와 해당 주소의 구매 조건을 따로 확인해야 합니다.', '同一预算在不同区与楼龄下对应的面积不同，还需核实租客押金、房屋状况及具体地址的购买条件。'],
    question: ['KRW 1 billion in Seoul: compare area, age and district', '서울 10억 원, 지역·면적·연식 중 무엇을 선택할까?', '首尔10亿韩元：如何取舍区域、面积与楼龄？'],
    lens: ['Use the recorded area and construction year to narrow the shortlist. Test your actual commute for each address before paying for a location label.', '거래 면적과 준공연도로 후보를 좁히세요. 지역 이름에 값을 더 지불하기 전에 각 주소에서 실제 통근 경로를 확인하는 것이 좋습니다.', '先用成交面积与建成年份筛选，再核实每个地址的实际通勤路线。'],
    costs: ['Compare tenant deposits and vacant possession as well as taxes, fees and repairs. A purchase-price ceiling is not a total-cash budget.', '세금·수수료·수리비뿐 아니라 임차보증금과 명도 조건을 비교하세요. 집값 상한은 총 필요 현금과 다릅니다.', '除税费和装修外，还需比较租客押金与交房条件。房价上限不等于全部所需现金。'],
    source: 'https://rt.molit.go.kr/',
  },
  singapore: {
    market: 'sg-singapore', base: '/sg/singapore', currency: 'SGD', cap: 1500000,
    name: ['Singapore', '싱가포르', '新加坡'],
    why: ['Compare condominium projects using recorded resales, sizes and tenure. This is useful when a long-term home decision starts with a specific project and budget.', '장기 거주할 콘도를 검토한다면, 단지별 재판매 가격·면적·소유권 기간을 함께 비교할 수 있습니다.', '长期置业可从具体公寓项目出发，同时比较转售价格、面积与产权期限。'],
    tradeoff: ['Tenure and buyer-profile costs can change the comparison. A lower purchase price alone does not establish a lower total cost.', '소유권 기간과 구매자 조건별 비용이 판단을 바꿀 수 있습니다. 집값이 낮다고 총비용도 낮은 것은 아닙니다.', '产权期限与买家身份相关费用会改变比较结果，较低房价不一定意味着较低总成本。'],
    question: ['S$1.5 million: compare condominium size and tenure', '싱가포르 S$150만, 콘도 면적과 소유권 기간 비교', '新加坡150万新元：比较公寓面积与产权期限'],
    lens: ['Compare the remaining lease on a consistent date and the actual unit condition. These selected resales do not cover HDB or every private-home category.', '같은 기준일의 잔여 임차기간과 실제 세대 상태를 비교하세요. 선정한 콘도 재판매 사례이며 HDB나 모든 민간 주택 유형을 포함하지 않습니다.', '用同一日期比较剩余租期与具体房况。这些公寓转售样本不含HDB及所有私人住宅类别。'],
    costs: ['Calculate duties for your own buyer profile before comparing total acquisition costs. Confirm maintenance charges and financing independently.', '자신의 구매자 조건으로 취득 세금을 계산한 뒤 총비용을 비교하세요. 관리비와 금융 조건도 별도로 확인해야 합니다.', '先按自身买家身份计算税费，再比较总购置成本，并另行核实管理费与融资条件。'],
    source: 'https://www.ura.gov.sg/guidelines/property-and-business-owners/property/buying-property/',
  },
  dubai: {
    market: 'ae-dubai', base: '/ae/dubai', currency: 'AED', cap: 1000000,
    name: ['Dubai', '두바이', '迪拜'],
    why: ['For a completed-home purchase, compare Ready transactions with the costs and condition of a specific unit before considering a rental plan.', '완공 주택을 매입해 거주하거나 임대하려면, Ready 거래와 실제 세대의 비용·상태를 함께 검토하는 출발점이 됩니다.', '考虑购入现房自住或出租时，可先比较Ready成交与具体房屋的费用及状况。'],
    tradeoff: ['Service charges, vacancy and unit condition can change net income. Area-level gross yields do not establish an individual unit’s return.', '관리비·공실·세대 상태에 따라 실제 남는 수입이 달라집니다. 지역의 비용 차감 전 수익률로 특정 집의 수익을 판단할 수 없습니다.', '物业费、空置和房况影响净收入，区域毛收益率不能代表某套住宅的回报。'],
    question: ['AED 1 million: compare completed apartments before rental assumptions', '두바이 AED 100만, 완공 아파트와 보유 비용 비교', '迪拜100万迪拉姆：比较现房与持有费用'],
    lens: ['Compare bedroom count and reported area before interpreting the price. A two-bedroom and a studio are different products even within one budget.', '가격을 보기 전에 침실 수와 신고 면적부터 비교하세요. 같은 예산이어도 침실 2개 주택과 스튜디오는 용도가 다릅니다.', '先比较卧室数与记录面积。同一预算内，两居室与单间对应不同使用需求。'],
    costs: ['Ask for the actual service-charge statement, tenancy and condition records. Model vacancy and repairs before treating rental income as spendable cash.', '실제 관리비 명세, 임대차와 상태 자료를 요청하세요. 임대료를 가용 현금으로 보기 전에 공실과 수리비를 반영해야 합니다.', '索取实际物业费、租约与房况资料；将空置和维修计入后再看可用租金现金流。'],
    source: 'https://dubailand.gov.ae/en/eservices/property-status-overview/',
  },
  tokyo: {
    market: 'jp-tokyo', base: '/jp/tokyo', currency: 'JPY', cap: 50000000,
    name: ['Tokyo', '도쿄', '东京'],
    why: ['Compare several wards with the same purchase budget, then narrow the choice using size, building condition and your actual travel needs.', '같은 구매 예산으로 여러 구를 비교한 뒤, 면적·건물 상태·실제 이동 동선으로 후보를 좁힐 수 있습니다.', '先按同一购房预算比较多个区，再按面积、楼况与实际出行需要缩小范围。'],
    tradeoff: ['Anonymous ward records cannot identify a building. Repair reserves, management documents, hazard exposure and resale conditions need property-level checks.', '익명 거래만으로 건물을 특정할 수 없습니다. 수선적립금·관리 자료·재해 위험·재매각 조건은 실제 건물별로 확인해야 합니다.', '匿名记录不能识别具体楼宇；修缮储备、管理文件、灾害风险及转售条件需逐套核实。'],
    question: ['JPY 50 million across five Tokyo wards: what changes with location?', '도쿄 5천만 엔, 다섯 구에서 면적은 얼마나 달랐을까?', '东京5,000万日元：五个区的成交面积有何不同？'],
    lens: ['These are ward-and-area groups, not named buildings or neighbourhood medians. Different ages and conditions remain mixed; the size gap is not a measured location premium.', '구·면적 구간별 거래 그룹이며 특정 건물이나 동네 중앙값이 아닙니다. 연식과 상태가 섞여 있으므로 면적 차이를 순수한 입지 프리미엄으로 해석할 수 없습니다.', '这是区与面积段的成交组，并非具体楼宇或社区中位数。楼龄和房况仍混合，面积差不等于测得的区位溢价。'],
    costs: ['Obtain the management and repair-reserve statements for an actual building. Add purchase fees, repairs and financing costs separately from the JPY budget.', '실제 후보 건물의 관리비와 수선적립금 자료를 확인하세요. 매입 수수료·수리비·금융 비용은 엔화 집값 예산과 따로 계산하세요.', '核实实际候选楼宇的管理费与修缮储备，另计购置费用、维修和融资成本。'],
    source: 'https://www.reinfolib.mlit.go.jp/',
  },
} as const;
export function cityText(values: readonly string[], locale: ContentLocale): string { return values[locale === 'ko' ? 1 : locale === 'zh-CN' ? 2 : 0]!; }
export function cityPrefix(locale: ContentLocale): string { return locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : ''; }
export function comparisonSlug(city: BuyingCity): string { return `${city}-same-budget-property-comparison`; }
export function consultationHref(city: BuyingCity, locale: ContentLocale, budget?: number): string {
  return `${cityPrefix(locale)}/contact/?${new URLSearchParams({ city, ...(budget ? { budget:String(budget) } : {}) })}#purchase-enquiry`;
}
