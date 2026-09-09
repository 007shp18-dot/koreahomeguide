import { policyExplainers } from '../policy-explainers';
import { ENGLISH_PORTFOLIO } from '../en/portfolio';
import type { EditorialPortfolioRecord } from '../portfolio-types';
import { enrichKoreanRecord } from './research-expansions';
import { KOREAN_AFFORDABLE_RESALE_STORIES } from './affordable-resale';
import { KOREAN_DUBAI_RENTAL_YIELD } from './dubai-rental-yield';
import { KOREAN_KOREA_LARGE_ESTATE_SPILLOVER } from './korea-large-estate-spillover';
import { KOREAN_SINGAPORE_LENTOR_SPILLOVER } from './singapore-lentor-spillover';
import { KOREAN_MONTHLY_REPORTS } from './monthly-reports';
import { KOREAN_LATEST_MARKET_NEWS } from './market-news-2026-09-08';
import { KOREAN_SEOUL_59SQM_UNDER_700M } from './seoul-59sqm-under-700m';

// Identity, dates, evidence, and numerical chart data are shared with the English edition.
const copy: Readonly<Record<string, readonly [string, string, string]>> = {
  'korea-foreign-property-reporting-status': ['한국 외국인 부동산 거래 신고: 2026년 2월 달라진 사항', '외국인 거래 신고에 신원, 거주지와 해외 자금 관련 정보가 추가됐습니다. 구체적인 신고 내용은 거래에 따라 달라집니다.', '외국인이 한국 주택을 매수하기 전후에 어떤 내용을 신고해야 할까요?'],
  'seoul-land-transaction-permit-status': ['서울 토지거래허가: 필지·용도·날짜를 확인하세요', '지정 소식만으로는 충분하지 않습니다. 계약 전에 서울시의 지정 현황과 정확한 필지를 대조해 현재 적용 여부를 확인해야 합니다.', '현재 서울의 어떤 주택 매수가 토지거래허가제의 적용을 받을까요?'],
  'korea-housing-finance-rules-status': ['한국 주택금융 규정: 하나의 대출 비율로 판단하지 않기', '현재 한도는 규제지역, 차주, 보유 주택 수, 상품과 시행일에 따라 달라집니다. 감당할 수 있는 예산은 금융기관의 개별 확인이 필요합니다.', '현재 어떤 대출 제한이 주택 구입 예산에 실질적인 영향을 줄까요?'],
  'singapore-hdb-private-owner-waitout-status': ['HDB, 2026년 7월 15개월 대기기간 폐지', '민간 주택 소유자가 보조금 없는 HDB 재판매 주택을 구입할 때 적용되던 대기기간이 폐지됐습니다. 다른 자격 요건은 여전히 확인해야 합니다.', '민간 주택 소유자에게 적용되던 HDB 대기기간 규정은 어떻게 달라졌을까요?'],
  'seoul-sale-market-monthly-brief': ['2026년 8월 서울 매매 데이터: 수록 범위와 비교의 한계', '수록된 매매 신고 22,850건을 완료된 기간, 자치구, 건물과 면적별로 살펴본 뒤 움직임을 해석합니다.', '2026년 8월 서울 매매 공개 자료는 무엇을 포함하며, 어떻게 비교해야 할까요?'],
  'seoul-jeonse-market-monthly-brief': ['2026년 8월 서울 전세 데이터: 어떤 계약을 비교할까', '현재 임대차 공개 자료에는 여러 임대차 구조에 걸쳐 기준을 충족한 계약 49,129건이 담겨 있습니다. 전세 비교에는 먼저 전세 계약만 골라야 합니다.', '서울 전세보증금 비교에는 어떤 계약을 포함해야 할까요?'],
  'seoul-monthly-rent-market-brief': ['서울 월세 데이터: 보증금에 따라 비교가 달라지는 이유', '낮은 월세 뒤에 큰 보증금이 있을 수 있습니다. 시장 비교에는 공개된 하나의 환산 기준이 필요합니다.', '서울 임대차 신고에서 보증금과 월세를 어떻게 함께 비교해야 할까요?'],
  'singapore-private-market-quarterly-brief': ['2026년 2분기 싱가포르 콘도 가격: URA 지수가 보여주는 것', 'URA는 전체 민간 주택 가격지수가 전 분기 대비 0.5% 올랐다고 발표했습니다. 지역별 움직임은 달랐습니다.', '최근 발표된 분기에 CCR·RCR·OCR은 각각 어떻게 달라졌을까요?'],
  'seoul-district-price-distribution': ['서울 자치구별 임대차보증금: 중앙값이 가리는 차이', '자치구 중앙값은 탐색의 출발점입니다. 분포, 주택 구성과 건물별 자료를 보면 같은 중앙값 뒤에 서로 다른 선택지가 있음을 알 수 있습니다.', '중앙값이 비슷한 서울의 두 자치구가 실제로는 왜 다르게 느껴질까요?'],
  'seoul-new-renewal-rent-gap': ['서울 임대차: 신규 계약과 갱신 계약의 보증금은 같을까', '공개된 한 비교군은 같은 건물·면적대 안에서도 신규 계약과 갱신 계약의 중앙값이 다를 수 있음을 보여줍니다.', '도봉구의 한 아파트 비교군에서 신규·갱신 보증금은 어떻게 다를까요?'],
  'korea-deposit-monthly-rent-cost-structure': ['한국 임대차 비용: 월세·관리비·보증금 계산 예시', '예시 비용 내역을 통해 월세, 관리비와 보증금 자금비용이 하나의 월간 비교 금액에 어떻게 반영되는지 살펴봅니다.', '보증금이 달라지면 비교 가능한 월 비용은 어떻게 달라질까요?'],
  'singapore-ccr-rcr-ocr-comparison': ['싱가포르 콘도 가격: CCR·RCR·OCR 비교', '공개된 민간 주택 프로젝트의 평방피트당 가격 중앙값은 지역마다 다릅니다. 프로젝트 구성, 보유권 형태, 거래 유형과 주택 면적도 함께 봐야 합니다.', 'CCR·RCR·OCR의 거래 분포는 실제로 무엇을 보여줄까요?'],
  'rent-an-apartment-in-korea': ['한국에서 집 구하기: 탐색부터 입주까지', '외국인 거주자가 예산, 거래 근거, 신원, 계약과 보증금 보호를 확인하는 실무 순서입니다.', '외국인 거주자는 한국에서 집을 찾고 입주하기까지 어떤 절차를 거칠까요?'],
  'wolse-vs-jeonse': ['월세와 전세: 한국에서 임대차 구조 선택하기', '보증금에 묶이는 자금, 월세, 각종 비용과 보증금 반환 위험을 드러낸 뒤 임대차 구조를 선택합니다.', '임차인은 월세와 전세를 어떻게 같은 기준으로 비교할 수 있을까요?'],
  'korea-rental-contract-checklist': ['큰 보증금을 보내기 전 확인하는 한국 임대차계약 점검표', '주택의 정확한 표시, 소유자의 권한, 모든 비용, 계약 조항과 입주 후 보호 절차를 하나의 판단 자료로 정리합니다.', '큰 임대차보증금을 이체하기 전에 무엇을 확인해야 할까요?'],
  'read-seoul-sale-transactions': ['서울 매매 실거래 읽기: 한 건으로 가격을 판단하지 않기', '신고된 체결 계약부터 살펴보고 건물, 면적과 기간을 일정하게 유지하면서 가격 범위와 표본 수를 읽습니다.', '한 건의 매매를 과대평가하지 않고 서울 매매 신고 자료를 어떻게 읽어야 할까요?'],
  'compare-seoul-district-prices': ['서울 자치구 가격 비교: 서로 다른 비교군을 섞지 않기', '거래 유형, 주택 유형, 면적, 기간과 공개 기준을 같게 맞춘 뒤 순위를 읽습니다.', '기간·유형·면적을 뒤섞지 않고 자치구를 어떻게 비교할 수 있을까요?'],
  'buy-property-in-korea-as-foreigner': ['외국인의 한국 부동산 매수: 확인해야 할 순서', '매수를 확정하기 전에 신원, 거래 근거, 자금, 제한 사항, 신고, 계약과 등기를 함께 준비합니다.', '외국인이 한국 부동산을 매수할 때 확인해야 할 절차는 무엇일까요?'],
  'read-singapore-private-transactions': ['싱가포르 민간 주택 거래 자료 읽기', '지역, 프로젝트, 보유권 형태, 거래 유형, 주택 면적과 공식 지수는 각각 구분해 살펴봅니다.', '매수자는 싱가포르 프로젝트별·지역별 거래 자료를 어떻게 읽어야 할까요?'],
};
const bodies: Readonly<Record<string, string>> = {
  'korea-foreign-property-reporting-status': `## 시행일\n\n국토교통부는 2026년 2월 9일 신고 항목 확대를 발표하고 2026년 2월 10일부터 적용한다고 밝혔습니다.\n\n## 정보 범위\n\n공식 안내는 외국인 거래의 확대된 항목에 비자 또는 체류 자격, 국내 주소와 해외 자금 정보를 포함하고 있습니다.\n\n## 신고 전 확인\n\n최신 공식 서식을 사용하고 매수자, 부동산과 자금 경로에 따라 별도 허가, 외국환 신고나 지방자치단체 신고가 필요한지 확인하세요.\n\n## 근거의 한계\n\n이 글은 변경 사항을 기록한 것으로, 개별 거래의 신고서 작성본이나 법률 의견이 아닙니다.`,
  'seoul-land-transaction-permit-status': `## 지정 현황부터 확인\n\n서울시는 현재 지정 공고, 경계와 기간을 공개합니다. 자치구 전체에 대한 요약에 의존하지 말고 정확한 필지와 현행 공고를 검색하세요.\n\n## 거래 조건 확인\n\n기준과 의무는 지정 구역, 토지 용도, 면적, 매수 목적과 계약일에 따라 달라질 수 있습니다. 가까운 필지라도 결과가 다를 수 있습니다.\n\n## 날짜 기록\n\n지정은 연장·변경·해제될 수 있으므로 공고, 조회일과 담당 기관의 답변을 의사결정 자료에 보관하세요.\n\n## 근거의 한계\n\nSignedPrice는 허가 자격을 판단하지 않습니다. 관할 기관과 현재의 공식 지정 내용이 기준입니다.`,
  'korea-housing-finance-rules-status': `## 조건에 따라 달라지는 규정\n\n금융위원회의 2026년 조치는 전국에 하나의 대출 비율을 적용하는 해석이 왜 부적절한지 보여줍니다. 규제지역 취급과 예외는 구체적인 사안에 따라 달라집니다.\n\n## 예산 구성\n\n현금, 세금과 수수료를 최대 대출액과 구분하고, 계약 전에 금리·상환 조건·평가액 변화의 영향을 점검하세요.\n\n## 서면 확인\n\n제시된 대출액에 어떤 규정, 부동산 가치, 차주 정보와 서류 기준일이 적용됐는지 금융기관에 확인하세요.\n\n## 근거의 한계\n\n이 현황 페이지는 신용 심사 결과나 대출 제안이 아니며, 서울의 모든 매수자에게 하나의 비율이 적용된다는 뜻도 아닙니다.`,
  'singapore-hdb-private-owner-waitout-status': `## 변경 사항\n\nHDB는 2026년 7월 27일, 민간 주택 소유자가 보조금 없는 재판매 주택을 구입할 때 적용되던 한시적 15개월 대기기간을 폐지한다고 발표했습니다.\n\n## 남아 있는 조건\n\n대기기간 폐지가 매수에 영향을 줄 수 있는 다른 자격, 기존 주택 처분, 금융 또는 개별 주택 조건까지 없애는 것은 아닙니다.\n\n## 활용 방법\n\n정책 소식을 승인으로 받아들이기 전에 해당 가구와 구입하려는 주택에 대한 HDB의 최신 자격 안내를 확인하세요.\n\n## 근거의 한계\n\n이 기록은 발표된 규정 변경을 설명하며, 개별 가구의 자격을 확정하지 않습니다.`,
  'seoul-sale-market-monthly-brief': `## 공개 자료부터 확인\n\n수록된 매매 공개 자료는 2026년 2월부터 8월까지를 다루며, 명시된 파서와 이용 권한 검사를 거쳐 적격 기록 22,850건을 포함합니다.\n\n## 미완료 월 비교 주의\n\n최근 신고 건수는 최초 공개 뒤에도 늘어날 수 있습니다. 조건이 같은 완료 기간을 비교하고 취소 건은 별도로 구분하세요.\n\n## 다음 비교 단계\n\n자치구의 맥락에서 같은 건물과 면적대로 내려가세요. 도시 전체의 합계로 특정 주택의 가격을 정할 수는 없습니다.\n\n## 근거의 한계\n\n이 브리프는 수록된 근거 자료의 범위를 설명하며, 전망이나 실시간 감정평가가 아닙니다.`,
  'seoul-jeonse-market-monthly-brief': `## 하나의 임대차 구조 선택\n\n자치구나 건물의 중앙값을 비교하기 전에 월세 계약에서 전세 관측값을 분리하세요.\n\n## 비교군 유지\n\n모든 비교에서 주택 유형, 전용면적, 기간과 최소 공개 표본 기준을 일정하게 유지하세요.\n\n## 범위 살펴보기\n\n중앙값과 함께 가운데 50%의 범위와 표본 수를 보세요. 유난히 큰 보증금 한 건이 시장 전체를 뜻하지는 않습니다.\n\n## 근거의 한계\n\n신고 계약은 보증금의 안전성, 현재 매물 유무나 특정 주택의 상태를 입증하지 않습니다.`,
  'seoul-monthly-rent-market-brief': `## 함께 움직이는 두 요소\n\n월세 계약에는 보증금과 반복 지급액이 함께 있습니다. 하나를 무시하고 다른 하나만 정렬하면 결론이 달라집니다.\n\n## 하나의 환산 기준 사용\n\n공개된 비교 가정을 선택해 일관되게 적용하세요. 적용 비율이 달라지면 비교 가능한 월 부담도 달라집니다.\n\n## 실제 계약으로 돌아가기\n\n환산 금액으로 후보를 좁힌 뒤에는 실제 보증금, 월세, 면적, 부동산과 계약 월을 확인하세요.\n\n## 근거의 한계\n\n환산은 비교 도구이며, 임대인이 따라야 할 의무 비율이나 예측치가 아닙니다.`,
};
const sourceCopy: Readonly<Record<string, readonly [string, string]>> = {
  'kr-lease-law': ['국가법령정보센터', '주택임대차보호법'],
  'kr-transactions': ['국토교통부', '실거래가 공개시스템'],
  'kr-foreign-reporting-2026': ['국토교통부', '외국인 부동산 거래 신고 항목 확대'],
  'seoul-land-permit-registry': ['서울특별시', '토지거래허가구역 지정 현황'],
  'kr-finance-2026': ['금융위원회', '2026년 7월 시행 주택금융 조치'],
  'sg-iras-absd': ['싱가포르 국세청(IRAS)', '추가 매수자 인지세(ABSD)'],
  'sg-hdb-waitout-2026': ['주택개발청(HDB)', '15개월 대기기간 폐지'],
  'sg-ura-q2-2026': ['도시재개발청(URA)', '2026년 2분기 부동산 통계 발표'],
};
const chartCopy: Readonly<Record<string, readonly [string, string, string, string, readonly string[], readonly string[]]>> = {
  'seoul-district-price-distribution': ['서울 일부 자치구의 임대차보증금 중앙값', '선정한 다섯 자치구의 공개 건물별 중앙값은 서로 다릅니다. 이 차트는 개별 주택의 가치평가가 아닌 비교 맥락을 제공합니다.', '국토교통부 임대차 신고 계약을 바탕으로 한 SignedPrice 공개 건물 요약', '선정 자치구에서 최소 표본 기준을 충족한 공개 건물 비교군', ['공개 건물별 중앙값의 중앙값'], ['강남구', '용산구', '강동구', '마포구', '노원구']],
  'seoul-new-renewal-rent-gap': ['한 공개 비교군의 신규·갱신 보증금', '선정된 도봉구 아파트 비교군에서는 신규 계약과 갱신 계약의 중앙값이 다르며, 이를 모든 건물로 일반화해서는 안 됩니다.', '국토교통부 임대차 신고 계약을 바탕으로 한 SignedPrice 공개 건물 요약', '45–55 sqm 아파트 비교군 하나: 신규 18건, 갱신 13건', ['신규 계약', '갱신 계약'], ['공개 비교군']],
  'korea-deposit-monthly-rent-cost-structure': ['하나의 기준으로 비교하는 임대차 비용', '비교 가능한 월 비용은 월세, 관리비와 공개된 보증금 자금비용을 별도로 표시합니다.', '예시 비용 입력값; 비교 방법은 SignedPrice 환산 공개 자료에 근거', '예시 구조입니다. 계약 확인에 정확한 계약 조건과 선택한 환산 가정을 입력하세요.', ['비교 가능한 월 부담'], ['월세', '관리비', '보증금 자금비용']],
  'singapore-ccr-rcr-ocr-comparison': ['시장 구분별 공개 민간 프로젝트 PSF 중앙값', '이번 공개 자료에서는 공개 프로젝트 중앙값의 중앙값이 CCR에서 가장 높지만, 프로젝트 구성과 보유권 형태는 지역마다 다릅니다.', 'URA 민간 주택 거래를 바탕으로 한 SignedPrice 공개 자료', 'CCR 614개, RCR 745개, OCR 1,053개 공개 프로젝트 요약', ['공개 프로젝트 중앙값의 중앙값'], ['CCR', 'RCR', 'OCR']],
};
function translateBase(record: EditorialPortfolioRecord): EditorialPortfolioRecord {
  const [title, deck, readerQuestion] = copy[record.slug]!;
  const translated = enrichKoreanRecord({
    ...record, id: `ko:${record.slug}`, locale: 'ko', title, deck, readerQuestion,
    bodyMarkdown: bodies[record.slug] ?? record.bodyMarkdown,
    authorName: 'SignedPrice 데이터팀', reviewedBy: 'SignedPrice 리서치 편집자',
    canonicalHref: `/ko/${record.type === 'guide' ? 'guides' : 'news'}/${record.slug}/`,
    translationGroupId: record.translationGroupId ?? record.slug,
    sources: record.sources.map(source => {
      const labels = sourceCopy[source.id];
      return labels ? { ...source, publisher: labels[0], title: labels[1] } : source;
    }),
    revisionNote: '인용한 1차 출처와 대조해 주장, 날짜, 링크와 근거의 한계를 최초 공개 검토에서 확인했습니다.',
  });
  const labels = chartCopy[record.slug];
  if (!record.infographic || !labels) return translated;
  const [chartTitle, accessibleSummary, sourceLabel, sampleLabel, seriesLabels, datumLabels] = labels;
  return Object.freeze({ ...translated, infographic: {
    ...record.infographic, id: `ko-${record.infographic.id}`, locale: 'ko' as const,
    title: chartTitle, accessibleSummary, sourceLabel, sampleLabel,
    series: record.infographic.series.map((series, index) => ({
      ...series, label: seriesLabels[index]!,
      values: series.values.map((datum, datumIndex) => ({ ...datum, label: datumLabels[datumIndex]! })),
    })),
  } });
}
export const KOREAN_EDITORIAL_PORTFOLIO: readonly EditorialPortfolioRecord[] = Object.freeze([
  ...policyExplainers('ko'),
  ...KOREAN_LATEST_MARKET_NEWS,
  KOREAN_SEOUL_59SQM_UNDER_700M,
  ...KOREAN_AFFORDABLE_RESALE_STORIES,
  KOREAN_KOREA_LARGE_ESTATE_SPILLOVER,
  KOREAN_SINGAPORE_LENTOR_SPILLOVER,
  KOREAN_DUBAI_RENTAL_YIELD,
  ...ENGLISH_PORTFOLIO.filter(record => Object.hasOwn(copy, record.slug)).map(translateBase),
  ...KOREAN_MONTHLY_REPORTS,
]);
