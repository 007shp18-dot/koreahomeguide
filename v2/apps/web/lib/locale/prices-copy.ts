import type { SiteLocale } from '@/lib/navigation/site-navigation';
const en = {
 title: 'Explore', description: 'Find recorded sale prices and rents by city, then compare the area, building or project you are considering.', budget: 'Compare your budget across cities', tools: 'Price checks and calculators', comparison: 'Making a comparison', check: 'What to check beside the price',
 tips: [ ['Match the property', 'Compare the same housing type, a similar floor area and nearby transaction dates. In Dubai, keep Ready and Off-Plan separate; in Singapore, check tenure as well as the project.'], ['Read the sample', 'A median describes the middle of the recorded transactions. It is not a valuation of a specific home. Check the number of records and the period before treating it as a useful benchmark.'], ['Include ownership costs', 'Purchase taxes, fees, financing and running costs sit outside the sale price. Gross rental yield is annual rent divided by price, before costs and vacancy; area rent and sale samples may describe different homes.'] ],
 source: 'Each market page shows its data sources and dates.', trust: 'Read how we handle data and corrections', calculate: 'Calculate a budget with your own costs', choose: 'Choose a market', find: 'Find prices in your market.', explore: 'Explore',
 search: 'Property price search', market: 'Market', property: 'Find a property', submit: 'Explore prices', destinations: 'Market price destinations',
 markets: [
 ['Seoul', 'Reported housing contracts', 'Explore sale, jeonse and monthly rent by district, neighborhood and building. Compare the same property type and area.', 'District, neighborhood or building', 'Search reported sale, jeonse and monthly-rent records.'],
 ['Singapore', 'Private homes and HDB', 'Search private projects and inspect transaction history, size bands and tenure. HDB records stay in their own dataset.', 'Project, street or district number', 'Search private residential projects. HDB evidence is available separately in Explore.'],
 ['Dubai', 'Ready and Off-Plan prices', 'Compare Ready and Off-Plan sale prices, annual rents and gross yields by area, with sample sizes and reporting dates.', 'Area or project', 'Compare Ready and Off-Plan prices, annual rents and yields by area.'],
 ['Tokyo', 'Recorded neighbourhood prices', 'Browse disclosed transactions by ward, neighbourhood, floor area and quarter.', 'Neighbourhood, layout or built year', 'Explore recorded transactions by ward, neighbourhood, floor area and quarter.'],
 ],
};
type PricesCopy = typeof en;
const ko: PricesCopy = {
 title: '둘러보기', description: '도시별 신고 매매가와 임대료를 확인하고 관심 지역·건물·단지를 비교하세요.', budget: '도시별 예산 비교', tools: '가격 확인·계산 도구', comparison: '가격 비교하기', check: '가격과 함께 확인할 사항',
 tips: [ ['같은 조건의 주택 비교', '주택 유형과 면적이 비슷하고 계약 시점이 가까운 거래를 비교하세요. 두바이는 준공 주택과 분양 계약을 구분하고, 싱가포르는 단지와 토지 보유 기간을 함께 확인하세요.'], ['표본 확인', '중앙값은 신고 거래의 중간값이며 개별 주택의 감정평가액이 아닙니다. 비교 기준으로 사용하기 전에 거래 건수와 집계 기간을 확인하세요.'], ['보유 비용 포함', '취득 세금·수수료·금융비용·운영비는 매매가에 포함되지 않습니다. 총임대수익률은 비용과 공실을 차감하기 전 연간 임대료를 매매가로 나눈 값입니다. 지역별 임대·매매 표본은 서로 다른 주택일 수 있습니다.'] ],
 source: '각 시장 페이지에 자료 출처와 기준일이 표시됩니다.', trust: '데이터 처리·정정 기준 보기', calculate: '내 비용 조건으로 예산 계산', choose: '시장 선택', find: '관심 도시의 가격을 찾아보세요.', explore: '둘러보기',
 search: '부동산 가격 검색', market: '도시', property: '주택 찾기', submit: '가격 탐색', destinations: '도시별 가격 탐색',
 markets: [
 ['서울', '신고 주택 계약', '자치구·동네·건물별 매매·전세·월세를 확인하세요. 같은 주택 유형과 면적을 비교하세요.', '자치구·동네·건물명', '신고된 매매·전세·월세 거래를 검색하세요.'],
 ['싱가포르', '민간 주택과 HDB', '민간 단지를 검색하고 거래 이력·면적대·토지 보유 기간을 확인하세요. HDB 자료는 별도로 구분합니다.', '단지·도로명·디스트릭트 번호', '민간 주택 단지를 검색하세요. HDB 자료는 Explore에서 별도로 확인할 수 있습니다.'],
 ['두바이', '준공 주택·분양 가격', '거래 건수와 집계 기간을 확인하면서 지역별 준공 주택·분양 매매가, 연간 임대료와 총임대수익률을 비교하세요.', '지역·프로젝트', '지역별 준공 주택·분양 가격, 연간 임대료와 수익률을 비교하세요.'],
 ['도쿄', '동네별 신고 거래가', '자치구·동네·면적·분기별 공개 거래를 확인하세요.', '동네·평면·준공연도', '자치구·동네·면적·분기별 신고 거래를 확인하세요.'],
 ],
};
const zh: PricesCopy = {
 title: '探索', description: '按城市查找已申报的成交价和租金，再比较您关注的区域、楼宇或项目。', budget: '比较各城市预算', tools: '价格评估与计算器', comparison: '进行比较', check: '除了价格，还应核对什么',
 tips: [ ['比较相似房产', '比较相同住宅类型、相近面积及相近成交日期的记录。在迪拜，应区分现房和期房；在新加坡，除项目外还应核对土地持有年限。'], ['了解样本', '中位数表示已记录成交的中间值，并非某套住宅的估值。用作参考之前，请核对记录数量和统计期间。'], ['计入持有成本', '购置税费、融资及运营费用不包含在成交价内。毛租金收益率是年租金除以价格，尚未扣除费用和空置损失；区域租赁与买卖样本可能对应不同住宅。'] ],
 source: '各市场页面均注明数据来源和日期。', trust: '了解数据处理与更正方法', calculate: '按您的成本条件计算预算', choose: '选择市场', find: '查找目标市场的价格。', explore: '探索',
 search: '房地产价格搜索', market: '城市', property: '查找房产', submit: '探索价格', destinations: '各城市价格探索',
 markets: [
 ['首尔', '已申报住宅合同', '按行政区、街区和楼宇探索买卖、全租与月租。比较相同住宅类型和面积。', '行政区、街区或楼宇', '搜索已申报的买卖、全租和月租记录。'],
 ['新加坡', '私人住宅与组屋', '搜索私人住宅项目，查看成交历史、面积区间和土地持有年限。组屋记录采用独立数据集。', '项目、街道或邮区编号', '搜索私人住宅项目。探索页面另列组屋数据。'],
 ['迪拜', '现房与期房价格', '按区域比较现房与期房成交价、年租金和毛租金收益率，同时核对样本数量及统计日期。', '区域或项目', '按区域比较现房与期房价格、年租金和收益率。'],
 ['东京', '街区成交记录', '按行政区、街区、面积及季度浏览公开成交。', '街区、户型或建成年份', '按行政区、街区、面积及季度探索成交记录。'],
 ],
};
export const priceMarkets = [
 { id: 'seoul', currency: 'KRW', href: '/kr/seoul/explore/' },
 { id: 'singapore', currency: 'SGD', href: '/sg/singapore/explore/' },
 { id: 'dubai', currency: 'AED', href: '/ae/dubai/explore/' },
 { id: 'tokyo', currency: 'JPY', href: '/jp/tokyo/explore/' },
] as const;
export function pricesCopy(locale: SiteLocale = 'en'): PricesCopy { return locale === 'ko' ? ko : locale === 'zh-CN' ? zh : en; }
export function pricesLocalePrefix(locale: SiteLocale): string { return locale === 'ko' ? '/ko' : locale === 'zh-CN' ? '/zh-cn' : ''; }
