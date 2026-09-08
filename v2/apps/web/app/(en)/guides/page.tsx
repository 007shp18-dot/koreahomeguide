import type { Metadata } from 'next';

import { GlobalProductHub } from '@/components/global-product-hub';
import { resolveGuideMarket } from '@/components/guides/guide-directory';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/guides/',
  title: 'Cross-border property guides | signedprice',
  description: 'Practical guides to buying and renting: eligibility, funding, contract checks and reading transaction prices.',
  languageAlternates: { en: '/guides/', ko: '/ko/guides/', 'zh-Hans': '/zh-cn/guides/' },
});

export default async function GuidesPage({ searchParams }: { searchParams: Promise<{ market?: string }> }) {
  const { market } = await searchParams;
  const guideMarket = resolveGuideMarket(market);
  return <GlobalProductHub kind="guides" guideMarket={guideMarket} />;
}
