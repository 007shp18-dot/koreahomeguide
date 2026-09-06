import {indexableMetadata} from '../public-metadata';
export function buildPropertyScenarioMetadata(locale:'en'|'ko',hasQueryState:boolean) {
 const ko=locale==='ko';
 const imagePath=ko?'/og/ko/':'/og/en/';
 return {...indexableMetadata({path:ko?'/ko/tools/property-scenario/':'/tools/property-scenario/',title:ko?'매입 비용과 임대 운영 수익률 계산 | signedprice':'Property purchase cost and operating yield calculator | signedprice',description:ko?'직접 입력한 매입 가격, 취득 비용, 임대료, 운영 비용과 공실로 계산합니다. KRW·SGD·AED 지원.':'Calculate acquisition outlay and operating yield from your own price, costs, rent and vacancy assumptions in KRW, SGD or AED.',locale:ko?'ko_KR':'en_US',imagePath,languageAlternates:{en:'/tools/property-scenario/',ko:'/ko/tools/property-scenario/'}}),robots:{index:!hasQueryState,follow:true}};
}
