import { Suspense } from 'react';
import { StoredExternalHeadlines } from '@/components/news/stored-external-headlines';
import type { Metadata } from 'next';

import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { NewsroomIndex, resolveNewsroomFilters } from '@/components/newsroom/newsroom-index';
import { listNewsroomArticles } from '@/lib/content/newsroom-content.server';
import { policyRepository } from '@/lib/policy/policy-repository.server';
import { indexableMetadata } from '@/lib/public-metadata';

export const revalidate = 900;

type NewsPageProps = Readonly<{
  searchParams?: Promise<Readonly<Record<string, string | readonly string[] | undefined>>>;
}>;

export async function generateMetadata({ searchParams = Promise.resolve({}) }: NewsPageProps): Promise<Metadata> {
  const filters = resolveNewsroomFilters(await searchParams);
  return indexableMetadata({
    path: filters.canonicalHref as `/${string}`,
    title: filters.type === 'news' ? 'Property news across four cities | SignedPrice' : 'Insights on places and property | SignedPrice',
    description: 'Understand neighbourhood life, housing prices, ownership costs and buying rules in Seoul, Tokyo, Singapore and Dubai.',
    ...(filters.type === 'insights' && filters.market === 'all' ? {
      languageAlternates: { en: '/news/' as const, ko: '/ko/news/' as const, 'zh-Hans': '/zh-cn/news/' as const },
    } : {}),
  });
}

export default async function NewsPage({ searchParams = Promise.resolve({}) }: NewsPageProps) {
  const [filters, articles] = await Promise.all([
    searchParams.then(resolveNewsroomFilters),
    listNewsroomArticles('en'),
  ]);
  return <EditorialGrowthPublicFrame locale="en" surface="content" currentHref={filters.canonicalHref}>
    <NewsroomIndex articles={articles} policies={policyRepository.list()} filters={filters} headlines={<Suspense fallback={<p role="status">Loading headlines…</p>}><StoredExternalHeadlines market={filters.market} preview={filters.type !== 'news'} /></Suspense>} />
  </EditorialGrowthPublicFrame>;
}
