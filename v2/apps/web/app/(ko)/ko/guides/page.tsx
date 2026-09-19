import { KoreanSiteFrame } from '@/components/korean-site-frame';
import { EditorialGuides } from '@/components/guide/editorial-guides';
import { indexableMetadata } from '@/lib/public-metadata';
export const metadata = indexableMetadata({ path: '/ko/guides/', title: '매수·임대차 가이드 | signedprice', description: '집을 사거나 빌리기 전, 필요한 비용과 서류부터 계약·입주 절차까지 확인하세요.', languageAlternates: { en: '/guides/', ko: '/ko/guides/', 'zh-Hans': '/zh-cn/guides/' }, locale: 'ko_KR', imagePath: '/og/ko/' });
export default async function Page({ searchParams }: { searchParams: Promise<{ market?: string; q?: string }> }) {
  const { market, q } = await searchParams;
  const selected = market === 'seoul' || market === 'tokyo' || market === 'singapore' || market === 'dubai' ? market : 'seoul';
  return <KoreanSiteFrame href={`/ko/guides/?market=${selected}`}><EditorialGuides locale="ko" market={selected} query={typeof q === 'string' ? q.slice(0, 120) : ''} /></KoreanSiteFrame>;
}
