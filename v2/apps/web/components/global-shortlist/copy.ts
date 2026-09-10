import { marketText } from '../../lib/locale/market-localization';
export type ShortlistLocale = 'en' | 'ko' | 'zh-CN';
const zh: Record<string,string> = {
 'Budget search conditions':'预算筛选条件','Check for updates':'检查更新','Checking saved places…':'正在检查收藏…',
 'Completion':'完工状态','Evidence could not be checked. Your saved list is retained.':'无法检查资料，您的收藏已保留。',
 'Evidence updated':'资料已更新','Find & save conditions':'查找并保存条件','Last checked · ':'上次检查 · ',
 'Loading evidence…':'正在加载交易资料…','Mark as seen':'标为已查看','Maximum reported area · m²':'最大申报面积 · m²','Minimum reported area · m²':'最小申报面积 · m²',
 'Maximum strata area · m²':'最大分层面积 · m²','Minimum strata area · m²':'最小分层面积 · m²',
 'Next':'下一页','Previous':'上一页','Property type':'住宅类型','Purchase-price ceiling · ':'总价上限 · ',
 'Ready':'现房','Off-plan':'期房','Remove saved':'取消收藏','Retry':'重试','View evidence':'查看交易资料',
 'No matches in the released data. Try a broader budget or filter.':'已发布资料中没有匹配结果，请扩大预算或筛选范围。',
 'Not available in the current release. This does not mean there were no transactions.':'当前资料中没有此项，不表示没有成交。',
 'Period · ':'期间 · ',' · Updated ':' · 更新于 ', 'Save a place from the results below.':'可从下方结果中收藏地点。',
 'Saved in this browser only. Updates are checked on opening or refresh, with no background notifications. Changes can include corrections':'仅保存在此浏览器中。打开或刷新时检查更新，不发送后台通知。变更可能包括资料更正',
 'Search pages':'结果分页','Verified evidence is unavailable. Try again shortly.':'暂时无法加载已核验资料，请稍后重试。',
 'Market segment':'市场区域','Ward':'区','Area':'地区','All released segments':'所有已发布区域','All released areas':'所有已发布地区',
 'apartment':'公寓','villa':'别墅','condominium':'共管公寓','executive condominium':'执行共管公寓',
 'Saved':'已收藏','Save project':'收藏项目','Save area':'收藏地区','Saved projects':'收藏的项目','Saved areas':'收藏的地区',
 'Matching projects':'匹配的项目','Areas with a median within budget':'中位总价符合预算的地区',
 'Find projects within your budget':'寻找预算内的项目','Find areas by median sale price':'按成交中位价筛选地区',
 'SINGAPORE · PRIVATE RESALE':'新加坡 · 私人住宅转售','TOKYO · CONDOMINIUM TRANSACTIONS':'东京 · 公寓成交','DUBAI · AREA PRICE SCREEN':'迪拜 · 地区价格筛选',
 'Area-level evidence':'地区交易资料','Neighbourhood-level evidence':'街区交易资料','Median transaction price · all sizes':'成交中位价 · 所有面积',
 'Median condominium price · selected size range':'公寓成交中位价 · 已选面积范围','Latest matching resale':'最新匹配的转售成交',
 'Latest recorded resale · all published sizes and types':'最新转售记录 · 所有已发布面积和类型',
 'released resale records':'条已发布转售记录','matching resale records':'条匹配转售记录','transactions in this area segment':'条该地区分类成交',
 'Calculate a JPY scenario':'计算日元方案','Check an asking price':'核对报价',
 'Search recorded resales, save projects and check an asking price against local evidence.':'查找已记录的转售成交、收藏项目，并与当地资料比较报价。',
 'Compare neighbourhood condominium medians, save areas and calculate your own JPY scenario.':'比较街区公寓成交中位价、收藏地区，并计算自己的日元方案。',
 'Screen area medians against your budget, save areas and continue to a price check.':'按预算筛选地区中位价、收藏地区，然后核对报价。',
 'This screens anonymous government condominium transactions by neighbourhood and size. Each ward uses its latest published quarter, shown on every result. Saved evidence follows the selected size range. These are not named buildings or available listings.':'按街区和面积筛选政府匿名公寓成交。每个区采用最新已发布季度，并在各项结果中显示。收藏资料使用当前面积范围，不代表具体楼盘或在售房源。',
 'Search covers the latest three months of released single-unit private resales; HDB is not included. These are recorded sales, not available listings. Strata area is not the same as Seoul net area.':'涵盖最近三个已发布月份的私人住宅单套转售，不含组屋。这是成交记录而非在售房源，分层面积与首尔套内面积不同。',
 'This filters area medians, not individual homes. A median within your budget does not establish that a particular home is available. Unit size and bedroom counts are not available in this release.':'筛选的是地区中位价而非单套住宅。价格符合预算不代表有对应房源，本期资料不含单套面积和卧室数。',
 ' Purchase price only; taxes, fees, financing and buyer eligibility are excluded. Coverage is limited to the released dataset.':' 仅比较购房价格，不含税费、融资和买家资格。范围限于已发布资料。',
 ' or a changed reporting period, not new individual transaction alerts.':'或报告期间变更，并非新增单笔成交提醒。',
 'Check the budget and area range.':'请检查预算与面积范围。','Search conditions saved in this browser.':'筛选条件已保存在此浏览器。',
 'Removed from saved places.':'已取消收藏。','You can save up to 30 places per city.':'每个城市最多收藏30个地点。','Place saved.':'地点已收藏。',
 'Update marked as seen.':'更新已标为查看。','Browser storage is blocked. Changes last only for this page session.':'浏览器存储被禁用，变更仅在本次页面会话有效。',
};
const ko:Record<string,string> = {
 'TOKYO · CONDOMINIUM TRANSACTIONS':'도쿄 · 공동주택 실거래', 'Ward':'구', 'Neighbourhood-level evidence':'동네별 거래 자료',
 'Median condominium price · selected size range':'공동주택 거래 중앙값 · 선택 면적', 'Calculate a JPY scenario':'JPY 비용·수익 계산',
 'Minimum reported area · m²':'최소 신고 면적 · m²','Maximum reported area · m²':'최대 신고 면적 · m²',
 'Compare neighbourhood condominium medians, save areas and calculate your own JPY scenario.':'동네별 공동주택 거래 중앙값을 비교하고 관심 지역을 저장한 뒤 엔화 비용·수익을 계산하세요.',
 'This screens anonymous government condominium transactions by neighbourhood and size. Each ward uses its latest published quarter, shown on every result. Saved evidence follows the selected size range. These are not named buildings or available listings.':'정부의 익명 공동주택 거래를 동네·면적으로 비교합니다. 구별 최신 공개 분기를 각 결과에 표시하며, 저장 자료도 선택한 면적 범위로 확인합니다. 개별 건물이나 현재 판매 중인 매물이 아닙니다.',
};
export function shortlistText<T>(locale:ShortlistLocale,value:T):T {
 if(locale !== 'zh-CN') return typeof value === 'string' && locale === 'ko' && ko[value] ? ko[value] as T : marketText(locale,value);
 return (typeof value === 'string' ? zh[value] ?? value : value) as T;
}
export function shortlistHref(locale:ShortlistLocale,href:string):string {
 if(locale === 'en') return href;
 const base=href.replace(/^\/(ko|zh-cn)(?=\/)/,'');
 return `${locale === 'ko' ? '/ko' : '/zh-cn'}${base}`;
}
