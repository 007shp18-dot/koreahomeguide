
import type { Metadata } from 'next';

import { TopTenPreview } from '@/components/rankings/top-ten';
import { RankingMarketsHub } from '@/components/rankings/ranking-markets-hub';
import { indexableMetadata } from '@/lib/public-metadata';
import { readDubaiTopTen, readTokyoTopTen } from '@/lib/rankings/top-ten.server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = indexableMetadata({
  path: '/rankings/top-10/',
  title: 'Dubai and Tokyo property TOP 10 | signedprice',
  description: 'A transparent first TOP 10 preview from Dubai DLD project snapshots and Japan MLIT recorded condominium transactions.',
  languageAlternates: { en: '/rankings/top-10/', ko: '/ko/rankings/top-10/' },
});

export default async function TopTenPage() {
  const dubai = readDubaiTopTen();
  const tokyo = await readTokyoTopTen();

  return <RankingMarketsHub>
    <TopTenPreview dubai={dubai} tokyo={tokyo} />
  </RankingMarketsHub>;
}
