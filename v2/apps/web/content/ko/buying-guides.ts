import { BUYING_GUIDES } from '../en/buying-guides';
import { BUYING_GUIDE_DATA, type BuyingGuideData } from '../en/buying-guide-data';
import type { EditorialPortfolioRecord } from '../portfolio-types';

const commonMethod = '선택한 예산 상한의 80~100%에 해당하는 거래를 찾았습니다. 같은 단지·면적 구간에서 해당 가격대의 거래가 3건 이상이고, 집계 기간 내 거래의 절반 이상이 그 가격대에 속해야 합니다. 면적은 20㎡ 단위로 나누며 하한을 포함하고 상한은 제외합니다. 조건에 맞는 거래 건수가 많은 순으로 정렬하고, 같으면 원자료의 단지명과 면적 구간순으로 정렬해 서로 다른 단지 3곳을 표시합니다. 투자 순위나 예산으로 살 수 있는 모든 집의 목록은 아닙니다. 층·집 상태·저가 거래 사유는 확인되지 않았습니다. 지연 신고와 취소로 기록이 달라질 수 있으며, 제공받은 자료가 모든 거래를 포함하는지는 독립적으로 검증하지 않았습니다. 과거 거래이며 현재 매물이 아닙니다. 도시마다 통화, 면적 정의와 집계 기간이 다릅니다.';
const copy: Record<string, {city:string;title:string;deck:string;period:string;eligibility:string;method:string;checks:string[];sourceTitles:string[]}> = {
  KRW: {
    city:'서울', title:'서울 아파트, 6억·10억·15억으로 어디까지 볼 수 있을까?',
    deck:'2026년 5~7월 실거래에서 예산별 단지와 면적을 살펴보고, 취득세와 계약 전 확인사항을 정리했습니다.', period:'2026년 5~7월',
    eligibility:'외국인 매수자는 계약 전에 해당 주소의 토지거래허가 대상 여부, 실거주 조건과 자금 증빙 서류를 관할 구청에 확인하세요. 이 거래 사례만으로 특정 주택을 매수할 수 있다고 판단할 수는 없습니다.',
    method:'2026년 9월 7일 제공받은 국토교통부 자료 366,779행 중 5~7월 중개거래 아파트 매매를 사용했습니다. 취소 거래와 직거래는 제외했습니다. 면적은 전용면적입니다. 공개 항목이 같은 기록도 서로 다른 거래일 수 있어 원자료의 기록을 유지했습니다. 단지 ID와 20㎡ 면적 구간으로 묶었습니다. '+commonMethod,
    checks:['등기부, 매도인 신분, 근저당과 권리 제한을 확인하세요.','같은 단지에서 면적과 층이 비슷한 최근 매매를 비교하세요.','세입자 보증금, 명도 조건과 입주 가능일을 확인하세요.','계약 전에 필요한 허가, 대출과 잔금 조건을 확인하세요.'],
    sourceTitles:['외국인 토지거래허가구역 관련 국토교통부 발표','주택 매수인이 부담하는 세금','국토교통부 실거래가 공개시스템'],
  },
  SGD: {
    city:'싱가포르', title:'싱가포르 콘도, S$100만·150만·200만 예산 살펴보기',
    deck:'2026년 5~7월 콘도 재판매 거래를 바탕으로 예산별 사례를 비교합니다. 매수자에 따라 달라지는 인지세도 함께 확인하세요.', period:'2026년 5~7월',
    eligibility:'싱가포르 토지청(SLA)은 일반 콘도 호실을 외국인이 주거용 부동산법에 따른 사전 승인 없이 살 수 있는 유형으로 안내합니다. 이 가이드는 HDB, 이그제큐티브 콘도(EC), 토지형 주택을 제외합니다. 매수 자격과 적용 세금은 각각 확인해야 합니다.',
    method:'2026년 9월 2일 생성된 URA 기반 자료 133,942행 중 5~7월 콘도 재판매 거래를 사용했습니다. 1호실 거래, strata 면적, 양수인 가격·면적만 포함했습니다. 별도 분류된 아파트, EC, HDB, 신규 분양과 전매는 제외했습니다. 단지 ID, 소유권 조건과 20㎡ 면적 구간으로 묶었습니다. Strata 면적은 서울의 전용면적과 정의가 다릅니다. '+commonMethod,
    checks:['소유권 유형과 잔여 임차권 기간을 확인하세요.','같은 단지에서 면적과 층이 비슷한 거래를 비교하세요.','관리비, 임대차 계약과 인도 조건을 확인하세요.','매수 옵션을 행사하기 전에 적용 인지세와 대출 조건을 확인하세요.'],
    sourceTitles:['외국인의 부동산 소유','매수 인지세(BSD)','추가 매수 인지세(ABSD)','자유무역협정에 따른 ABSD 감면','URA 부동산 데이터'],
  },
  AED: {
    city:'두바이', title:'두바이 완공 아파트, AED 75만·100만·150만 예산 살펴보기',
    deck:'2026년 6~8월 완공 아파트 거래에서 예산별 사례를 찾았습니다. 등록 비용과 소유권, 계약 전 확인사항까지 살펴보세요.', period:'2026년 6~8월',
    eligibility:'외국인의 영구 소유권(Freehold) 취득은 지정 지역에서 허용됩니다. 아래 사례는 원자료에 Free Hold와 Ready로 표시된 주택입니다. 실제 호실의 소유권 증서, 매수 자격과 완공 상태를 두바이 토지청(DLD)에 확인하세요. 분양 중인 주택 거래는 제외했습니다.',
    method:'제공받은 DLD 자료 151,921행 중 6~8월 주거용 Unit/Flat의 일반 매매(Sale)를 사용했습니다. Ready, Free Hold로 분류되고 단지명이 있으며 가격·면적이 양수인 기록만 포함했습니다. 지역명, 단지명, 침실 수와 20㎡ 면적 구간으로 묶었습니다. 면적은 원자료의 ACTUAL_AREA입니다. 건수는 개별 부동산 기록 수로, 고유한 법적 계약 수와 다릅니다. 단지명이 없는 기록은 제외했으며 단지명만으로 건물의 동일성이 검증된 것은 아닙니다. '+commonMethod,
    checks:['DLD 소유권 증서, 매도인과 완공 상태를 확인하세요.','같은 단지에서 침실 수와 신고 면적이 비슷한 거래를 비교하세요.','관리비, 체납금, 임대차와 인도 조건을 확인하세요.','등록비와 거래 비용을 누가 부담할지 계약서에 명시하세요.'],
    sourceTitles:['외국인의 UAE 부동산 매수','부동산 매매 등록 비용','DLD 공개 데이터'],
  },
};
const districts:Record<string,string>={'Nowon-gu':'노원구','Geumcheon-gu':'금천구','Guro-gu':'구로구','Eunpyeong-gu':'은평구','Gangdong-gu':'강동구'};
export const KOREAN_BUYING_GUIDE_DATA: readonly BuyingGuideData[] = BUYING_GUIDE_DATA.map(guide=>{
  const translated=copy[guide.currency]!;
  return {...guide,city:translated.city,period:translated.period,eligibility:translated.eligibility,method:translated.method,checks:translated.checks,bands:guide.bands.map(band=>({...band,examples:band.examples.map(example=>({...example,region:districts[example.region]??example.region,detail:example.detail.replace(/^Built (\d+)$/, '$1년 준공').replace(/^99 yrs lease commencing from (\d+)$/, '$1년 시작 · 99년 임차권').replace('1 B/R','침실 1개').replace('2 B/R','침실 2개').replace('Studio','스튜디오').replace('Free Hold (source)','영구 소유권 · 원자료 기준')}))}))};
});
export const KOREAN_BUYING_GUIDES: readonly EditorialPortfolioRecord[] = BUYING_GUIDES.map(article=>{
  const guide=KOREAN_BUYING_GUIDE_DATA.find(item=>item.slug===article.slug)!;
  const translated=copy[guide.currency]!;
  return {...article,id:`ko-${article.id}`,locale:'ko',title:translated.title,deck:translated.deck,canonicalHref:`/ko/guides/${article.slug}/`,translationGroupId:article.slug,readerQuestion:translated.title,revisionNote:'원문의 거래 수치와 산식을 유지하고 한국어로 번역했습니다.',relatedHref:article.marketId==='kr-seoul'?'/ko/kr/seoul/explore/':article.relatedHref,sources:article.sources.map((source,index)=>({...source,title:translated.sourceTitles[index]??source.title})),bodyMarkdown:`## 예산별 거래 사례\n\n${translated.deck}\n\n## 매수 자격\n\n${guide.eligibility}\n\n## 계약 전 확인사항\n\n${guide.checks.map(check=>`- ${check}`).join('\n')}\n\n## 집계 기준\n\n${guide.method}`};
});
