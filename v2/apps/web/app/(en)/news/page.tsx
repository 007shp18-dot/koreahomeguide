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

export async function generateMetadata({ searchParams = Promise.resolve({}) }: NewsPageProps = {}): Promise<Metadata> {
  const filters = resolveNewsroomFilters(await searchParams);
  return indexableMetadata({
    path: filters.canonicalHref as `/${string}`,
    title: 'Property policy, market news and data stories | signedprice',
    description: 'Read reviewed Seoul and Singapore property policy records, market briefs and original data stories with sources attached.',
    ...(filters.type === 'latest' && filters.market === 'all' ? {
      languageAlternates: { en: '/news/' as const, 'zh-Hans': '/zh-cn/news/' as const },
    } : {}),
  });
}

export default async function NewsPage({ searchParams = Promise.resolve({}) }: NewsPageProps = {}) {
  const [filters, articles] = await Promise.all([
    searchParams.then(resolveNewsroomFilters),
    listNewsroomArticles(),
  ]);
  return <EditorialGrowthPublicFrame locale="en" surface="content">
    <NewsroomIndex articles={articles} policies={policyRepository.list()} filters={filters} />
  </EditorialGrowthPublicFrame>;
}
