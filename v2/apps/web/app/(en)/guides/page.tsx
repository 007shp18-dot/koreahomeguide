import type { Metadata } from 'next';

import { EditorialGuides } from '@/components/guide/editorial-guides';
import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/guides/',
  title: 'Buying & renting guides | signedprice',
  description: 'Plan the costs, check the paperwork and work through the buying or renting process before signing.',
  languageAlternates: { en: '/guides/', ko: '/ko/guides/', 'zh-Hans': '/zh-cn/guides/' },
});

export default async function GuidesPage({ searchParams }: { searchParams: Promise<{ market?: string; q?: string }> }) {
  const { market, q } = await searchParams;
  const guideMarket = market === 'seoul' || market === 'singapore' || market === 'dubai' || market === 'tokyo' ? market : 'seoul';
  return <EditorialGrowthPublicFrame locale="en" surface="content" activeSection="guides" currentHref="/guides/"><EditorialGuides market={guideMarket} query={typeof q === 'string' ? q.slice(0, 120) : ''} /></EditorialGrowthPublicFrame>;
}
