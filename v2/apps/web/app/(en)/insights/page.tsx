import type { Metadata } from 'next';

import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { InsightsIndex } from '@/components/insights/insights-index';
import { listPublishedContentArticles } from '@/lib/insights/content-article-store.server';
import { indexableMetadata } from '@/lib/public-metadata';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = indexableMetadata({
  path: '/insights/',
  title: 'Original property reports and analysis | signedprice',
  description: 'Read SignedPrice original reporting, market analysis and evidence-led property explainers across Seoul, Singapore and global markets.',
  languageAlternates: {
    en: '/insights/',
    'zh-Hans': '/zh-cn/kr/seoul/insights/',
  },
});

type InsightsPageProps = Readonly<{
  searchParams?: Promise<Readonly<{ market?: string | readonly string[] }>>;
}>;

export default async function InsightsPage({ searchParams = Promise.resolve({}) }: InsightsPageProps = {}) {
  const marketValue = (await searchParams).market;
  const requestedMarket = typeof marketValue === 'string' ? marketValue : 'all';
  const activeMarket = ['global', 'seoul', 'singapore', 'dubai'].includes(requestedMarket)
    ? requestedMarket as 'global' | 'seoul' | 'singapore' | 'dubai'
    : 'all';
  const allArticles = await listPublishedContentArticles();
  const articles = activeMarket === 'all' ? allArticles : allArticles.filter(({ marketKey }) => (
    activeMarket === 'global' ? marketKey === null : marketKey === activeMarket
  ));
  return (
    <EditorialGrowthPublicFrame locale="en" surface="content">
      <InsightsIndex articles={articles} activeMarket={activeMarket} />
    </EditorialGrowthPublicFrame>
  );
}
