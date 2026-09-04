import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { InsightsArticle } from '@/components/insights/insights-article';
import { getPublishedContentArticle } from '@/lib/insights/content-article-store.server';
import { indexableMetadata, publicCanonical, safeJsonLd } from '@/lib/public-metadata';

export const dynamic = 'force-dynamic';

type EditorialArticlePageProps = Readonly<{ params: Promise<Readonly<{ slug: string }>> }>;

export async function generateMetadata({ params }: EditorialArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedContentArticle(slug);
  if (article === null) notFound();
  return indexableMetadata({
    path: `/insights/${article.slug}/`,
    title: `${article.title} | signedprice`,
    description: article.summary,
  });
}

export default async function EditorialArticlePage({ params }: EditorialArticlePageProps) {
  const { slug } = await params;
  const article = await getPublishedContentArticle(slug);
  if (article === null) notFound();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: publicCanonical(`/insights/${article.slug}/`),
    author: { '@type': 'Organization', name: 'SignedPrice Data Desk' },
    publisher: { '@type': 'Organization', name: 'SignedPrice' },
  };
  return (
    <EditorialGrowthPublicFrame locale="en" surface="content">
      <InsightsArticle article={article} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    </EditorialGrowthPublicFrame>
  );
}
