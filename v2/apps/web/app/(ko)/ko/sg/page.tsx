import { KoreanMarketOverview } from '@/components/korean-market-overview';
import { singaporeSnapshotRepositoryFromEnvironment } from '@/lib/singapore/snapshot-repository.server';
import { buildSingaporeEntryModel } from '@/lib/singapore/route-model.server';
import { indexableMetadata } from '@/lib/public-metadata';
import { sgText } from '@/lib/locale/singapore-copy';
export const metadata = indexableMetadata({ path: '/ko/sg/', title: '싱가포르 부동산 시장 개요 | SignedPrice', description: '싱가포르 민간 주택의 거래 집계와 비교 방법을 한국어로 확인하세요.', locale: 'ko_KR', languageAlternates: { en: '/sg/', ko: '/ko/sg/' } });
export default async function Page() {
  const model = buildSingaporeEntryModel(await singaporeSnapshotRepositoryFromEnvironment());
  const ready = model.status !== 'unavailable';
  const count = (label: string) => {
    const value = label.match(/[\d,]+/)?.[0];
    return value ? Number(value.replaceAll(',', '')).toLocaleString('ko-KR') : '—';
  };
  return <KoreanMarketOverview market="singapore" available={ready} facts={ready ? [{ label: '거래 건수', value: count(model.transactionLabel) }, { label: '단지 수', value: count(model.projectLabel) }, { label: '거래 통화', value: model.currency }] : []} period={ready ? `집계 기간: ${sgText('ko', model.periodLabel)}` : ''} />;
}
