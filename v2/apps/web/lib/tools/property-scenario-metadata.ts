import {indexableMetadata} from '../public-metadata';
export function buildPropertyScenarioMetadata(locale:'en'|'ko'|'zh-CN',hasQueryState:boolean) {
 const ko=locale==='ko';
 const zh=locale==='zh-CN';
 const imagePath=ko?'/og/ko/':'/og/en/';
 return {...indexableMetadata({path:ko?'/ko/tools/property-scenario/':zh?'/zh-cn/tools/property-scenario/':'/tools/property-scenario/',title:ko?'매입 비용과 임대 운영 수익률 계산 | signedprice':zh?'购置成本与租金收益计算器 | signedprice':'Property purchase cost and operating yield calculator | signedprice',description:ko?'직접 입력한 매입 가격, 취득 비용, 임대료, 운영 비용과 공실로 계산합니다. KRW·SGD·AED·JPY 지원.':zh?'使用自己输入的购置价格、费用、租金及空置假设计算，支持韩元、新加坡元、迪拉姆和日元。':'Calculate acquisition outlay and operating yield from your own price, costs, rent and vacancy assumptions in KRW, SGD, AED or JPY.',locale:ko?'ko_KR':zh?'zh_CN':'en_US',imagePath,languageAlternates:{en:'/tools/property-scenario/',ko:'/ko/tools/property-scenario/','zh-Hans':'/zh-cn/tools/property-scenario/'}}),robots:{index:!hasQueryState,follow:true}};
}
