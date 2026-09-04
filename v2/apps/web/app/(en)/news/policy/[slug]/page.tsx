import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { PolicyRecordArticle } from '@/components/newsroom/policy-record-article';
import { PublicEditorialJsonLd } from '@/components/public-json-ld';
import { EDITORIAL_PORTFOLIO, getPortfolioRecord } from '@/content/portfolio-manifest';
import { policyRepository } from '@/lib/policy/policy-repository.server';
import { editorialLanguageAlternates, indexableMetadata } from '@/lib/public-metadata';

type PolicyPageProps = Readonly<{ params: Promise<Readonly<{ slug: string }>> }>;

export function generateStaticParams() {
  return policyRepository.list().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const policy = policyRepository.get((await params).slug);
  if (policy === null) notFound();
  const article = getPortfolioRecord('en', policy.slug);
  if (article?.type !== 'policy-update') notFound();
  const languageAlternates = editorialLanguageAlternates(article, EDITORIAL_PORTFOLIO);
  return indexableMetadata({
    path: `/news/policy/${policy.slug}/`,
    title: `${policy.title} | signedprice`,
    description: policy.summary,
    ...(languageAlternates === undefined ? {} : { languageAlternates }),
  });
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const policy = policyRepository.get((await params).slug);
  if (policy === null) notFound();
  const article = getPortfolioRecord('en', policy.slug);
  if (article?.type !== 'policy-update') notFound();
  return <EditorialGrowthPublicFrame locale="en" surface="content">
    <PolicyRecordArticle policy={policy} article={article} />
    <PublicEditorialJsonLd article={article} />
  </EditorialGrowthPublicFrame>;
}
