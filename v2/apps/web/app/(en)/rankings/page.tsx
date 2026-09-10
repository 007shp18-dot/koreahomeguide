import type { Metadata } from 'next';

import { RankingMarketsHub } from '@/components/rankings/ranking-markets-hub';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/rankings/',
  title: 'Property price rankings by market | signedprice',
  description: 'Compare higher verified median transaction prices across published Seoul district and Singapore project cohorts.',
  languageAlternates: { en: '/rankings/', ko: '/ko/rankings/' },
});

export default function RankingsHubPage() { return <RankingMarketsHub />; }
