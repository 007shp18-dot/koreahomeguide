import { ContractCheckWorkspace } from '@/components/contract-check/contract-check-workspace';
import { buildContractCheckRouteModel } from '@/lib/contract-check/route-model.server';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({
  path: '/ko/kr/seoul/check/compare/',
  title: '서울 임대차 조건 두 개 비교 | signedprice',
  description: '보증금과 월세가 다른 서울 임대차 조건 두 개를 같은 월 비용 기준으로 비교합니다.',
  locale: 'ko_KR',
  imagePath: '/og/ko/',
  languageAlternates: {
    en: '/kr/seoul/check/compare/',
    ko: '/ko/kr/seoul/check/compare/',
  },
});

export default function KoreanOfferComparisonPage() {
  return <ContractCheckWorkspace locale="ko" model={buildContractCheckRouteModel()} />;
}
