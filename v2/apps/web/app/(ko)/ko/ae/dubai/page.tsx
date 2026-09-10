import { KoreanMarketOverview } from '@/components/korean-market-overview';
import { dubaiEvidenceRepositoryFromEnvironment } from '@/lib/dubai/evidence-repository.server';
import { indexableMetadata } from '@/lib/public-metadata';
export const metadata = indexableMetadata({ path: '/ko/ae/dubai/', title: '두바이 부동산 시장 개요 | SignedPrice', description: '두바이 준공·분양 단계의 지역별 가격과 임대료 비교 기준을 한국어로 확인하세요.', locale: 'ko_KR', languageAlternates: { en: '/ae/dubai/', ko: '/ko/ae/dubai/' } });
export default function Page() {
  const repository = dubaiEvidenceRepositoryFromEnvironment();
  const context = repository?.getContext();
  return <KoreanMarketOverview market="dubai" available={!!context} facts={[{ label: '가격 비교', value: '완공 주택 · 분양 중인 주택' }, { label: '임대 비교', value: '연간 임대료 · 비용 차감 전 임대수익률' }, { label: '거래 통화', value: 'AED' }]} period={context ? `비교 기간: ${context.comparisonPeriod.from}–${context.comparisonPeriod.to} · 자료 기준일: ${context.asOfDate} · 출처: 두바이 토지청(DLD) 공개 자료` : ''} />;
}
