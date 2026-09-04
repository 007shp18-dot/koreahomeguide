import type { Metadata } from 'next';

import { InsightsIndex } from '@/components/insights/insights-index';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { listPublishedContentArticles } from '@/lib/insights/content-article-store.server';
import { INSIGHTS_FOOTER, INSIGHTS_HEADER } from '@/lib/insights/insights-shell';
import { indexableMetadata } from '@/lib/public-metadata';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = indexableMetadata({
  path: '/insights/',
  title: 'Original property reports and analysis | signedprice',
  description: 'Read SignedPrice original reporting, market analysis and evidence-led property explainers across Seoul, Singapore and global markets.',
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
    <div id="top">
      <SiteHeader copy={INSIGHTS_HEADER} />
      <InsightsIndex articles={articles} activeMarket={activeMarket} />
      <SiteFooter copy={INSIGHTS_FOOTER} />
    </div>
  );
}
