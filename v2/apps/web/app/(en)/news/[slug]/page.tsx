import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { NewsroomArticle } from '@/components/newsroom/newsroom-article';
import { PublicEditorialJsonLd } from '@/components/public-json-ld';
import { EDITORIAL_PORTFOLIO, listPortfolioRecords } from '@/content/portfolio-manifest';
import { getNewsroomArticle } from '@/lib/content/newsroom-content.server';
import { editorialDiscoveryMetadata } from '@/lib/public-metadata';

export const revalidate = 900;

type NewsArticlePageProps = Readonly<{ params: Promise<Readonly<{ slug: string }>> }>;

export function generateStaticParams() {
  return listPortfolioRecords('en')
    .filter(({ type }) => type === 'news-brief' || type === 'market-brief' || type === 'data-story')
    .map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: NewsArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsroomArticle(slug);
  if (article === null) notFound();
  return editorialDiscoveryMetadata(article, EDITORIAL_PORTFOLIO);
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const { slug } = await params;
  const article = await getNewsroomArticle(slug);
  if (article === null) notFound();
  return <EditorialGrowthPublicFrame locale="en" surface="content">
    <NewsroomArticle article={article} />
    <PublicEditorialJsonLd article={article} />
  </EditorialGrowthPublicFrame>;
}
