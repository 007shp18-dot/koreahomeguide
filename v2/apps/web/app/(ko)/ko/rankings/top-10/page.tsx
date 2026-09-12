
import type { Metadata } from 'next';

import { TopTenPreview } from '@/components/rankings/top-ten';
import { RankingMarketsHub as RankingsLayout } from '@/components/rankings/ranking-markets-hub';
import { indexableMetadata } from '@/lib/public-metadata';
import { readDubaiTopTen, readTokyoTopTen } from '@/lib/rankings/top-ten.server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = indexableMetadata({
  path: '/ko/rankings/top-10/',
  title: '두바이·도쿄 부동산 TOP 10 | signedprice',
  description: '두바이 DLD 프로젝트 스냅샷과 일본 MLIT 신고 거래로 만든 첫 TOP 10 미리보기입니다.',
  languageAlternates: { en: '/rankings/top-10/', ko: '/ko/rankings/top-10/' },
  locale: 'ko_KR',
  imagePath: '/og/ko/',
});

export default async function KoreanTopTenPage() {
  const dubai = readDubaiTopTen();
  const tokyo = await readTokyoTopTen();

  return <RankingsLayout locale="ko">
    <TopTenPreview locale="ko" dubai={dubai} tokyo={tokyo} />
  </RankingsLayout>;
}
