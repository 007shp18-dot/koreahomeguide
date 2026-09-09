import type { Metadata } from 'next';

import { GlobalProductHub } from '@/components/global-product-hub';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/guides/',
  title: 'Buying & renting guides | signedprice',
  description: 'Plan the costs, check the paperwork and work through the buying or renting process before signing.',
  languageAlternates: { en: '/guides/', ko: '/ko/guides/', 'zh-Hans': '/zh-cn/guides/' },
});

export default async function GuidesPage({ searchParams }: { searchParams: Promise<{ market?: string }> }) {
  const { market } = await searchParams;
  const guideMarket = market === 'seoul' || market === 'singapore' || market === 'dubai' ? market : 'all';
  return <GlobalProductHub kind="guides" guideMarket={guideMarket} />;
}
