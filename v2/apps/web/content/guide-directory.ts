import { listPortfolioRecords } from './portfolio-manifest';

export type GuideMarket = 'all' | 'seoul' | 'singapore' | 'dubai';
export type GuideLocale = 'en' | 'ko';
export const BUDGET_GUIDE_SLUGS = [
  'seoul-apartment-buying-budget-guide',
  'singapore-condo-buying-budget-guide',
  'dubai-ready-apartment-buying-budget-guide',
] as const;

export function isBudgetAnalysis(slug: string) { return (BUDGET_GUIDE_SLUGS as readonly string[]).includes(slug); }

const entries = [
  { slug: 'buy-property-in-korea-as-foreigner', city: 'seoul', group: 'buy', title: ['Buying property in Korea as a foreigner', '외국인의 한국 주택 매수 절차'], deck: ['Check ownership, permissions and funding, then follow the steps from contract to registration.', '매수 자격과 허가 요건, 자금 준비부터 계약·신고·등기까지 순서대로 확인하세요.'] },
  { slug: 'read-singapore-private-transactions', city: 'singapore', group: 'buy', title: ['Singapore condos: prices and purchase costs', '싱가포르 콘도 가격과 매수 비용'], deck: ['Compare project transactions and plan stamp duties for your buyer profile.', '단지별 거래와 면적당 가격을 비교하고, 매수자 조건에 따른 인지세를 살펴보세요.'] },
  { slug: 'dubai-purchase', city: 'dubai', group: 'buy', title: ['Buying in Dubai: checks before you commit', '두바이 주택 매수 전 확인할 사항'], deck: ['Verify the property, review payment dates and account for service charges.', '소유권과 공사 진행 상황, 대금 지급 일정과 관리비를 확인하세요.'] },
  { slug: 'rent-an-apartment-in-korea', city: 'seoul', group: 'rent', title: ['Renting in Korea: from search to move-in', '한국에서 집 구하기: 매물 탐색부터 입주까지'], deck: ['Read listings, compare the full cost and prepare for viewings, contracts and moving day.', '매물 표기와 전체 비용을 이해하고, 집 보기부터 계약·입주까지 준비하세요.'] },
  { slug: 'wolse-vs-jeonse', city: 'seoul', group: 'rent', title: ['Jeonse or monthly rent? Compare the full cost', '전세와 월세, 전체 비용으로 비교하기'], deck: ['Compare deposits, rent and fees, including the cost of financing the deposit.', '보증금·월세·관리비에 자금 조달 비용을 더해, 내 조건에 맞는 계약을 비교하세요.'] },
  { slug: 'korea-rental-contract-checklist', city: 'seoul', group: 'rent', title: ['Before paying a rental deposit', '임대차보증금을 보내기 전 체크리스트'], deck: ['Check the owner, payment instructions, contract terms and deposit-return arrangements.', '소유자와 입금 계좌, 계약 조건과 보증금 반환 일정을 확인하세요.'] },
] as const;

export function guideDirectory(locale: GuideLocale, market: GuideMarket = 'all') {
  const records = listPortfolioRecords(locale);
  const language = locale === 'ko' ? 1 : 0;
  return entries.filter(entry => market === 'all' || entry.city === market).flatMap(entry => {
    const record = records.find(item => item.slug === entry.slug);
    const href = entry.slug === 'dubai-purchase' ? `${locale === 'ko' ? '/ko' : ''}/ae/dubai/guide/` : record?.canonicalHref;
    return href ? [{ id: entry.slug, city: entry.city, group: entry.group, title: entry.title[language], deck: entry.deck[language], href }] : [];
  });
}
