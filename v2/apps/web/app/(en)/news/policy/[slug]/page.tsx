import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { NewsroomArticle } from '@/components/newsroom/newsroom-article';
import { PolicyRecordArticle } from '@/components/newsroom/policy-record-article';
import { PublicEditorialJsonLd } from '@/components/public-json-ld';
import { EDITORIAL_PORTFOLIO, getPortfolioRecord } from '@/content/portfolio-manifest';
import { policyRepository } from '@/lib/policy/policy-repository.server';
import { editorialLanguageAlternates, indexableMetadata } from '@/lib/public-metadata';

type PolicyPageProps = Readonly<{ params: Promise<Readonly<{ slug: string }>> }>;

const explainerSlugs = new Set([
  'korea-rental-deposit-protection-status',
  'singapore-absd-policy-status',
]);

export function generateStaticParams() {
  return policyRepository.list().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const policy = policyRepository.get((await params).slug);
  if (policy === null) notFound();
  const article = getPortfolioRecord('en', policy.slug);
  if (article?.type !== 'policy-update') notFound();
  const languageAlternates = editorialLanguageAlternates(article, EDITORIAL_PORTFOLIO);
  const explainer = explainerSlugs.has(policy.slug);
  return indexableMetadata({
    path: `/news/policy/${policy.slug}/`,
    title: `${explainer ? article.title : policy.title} | signedprice`,
    description: explainer ? article.deck : policy.summary,
    ...(languageAlternates === undefined ? {} : { languageAlternates }),
  });
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const policy = policyRepository.get((await params).slug);
  if (policy === null) notFound();
  const article = getPortfolioRecord('en', policy.slug);
  if (article?.type !== 'policy-update') notFound();
  return <EditorialGrowthPublicFrame locale="en" surface="content">
    {explainerSlugs.has(policy.slug)
      ? <NewsroomArticle article={article} />
      : <PolicyRecordArticle policy={policy} article={article} />}
    <PublicEditorialJsonLd article={article} />
  </EditorialGrowthPublicFrame>;
}
