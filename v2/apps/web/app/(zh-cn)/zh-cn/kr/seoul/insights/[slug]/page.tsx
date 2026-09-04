import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { ChineseInsightsArticle } from '@/components/insights/chinese-insights';
import {
  CHINESE_KOREA_ARTICLES,
  getChineseKoreaArticle,
} from '@/lib/insights/chinese-korea-articles';
import { indexableMetadata, publicCanonical, safeJsonLd } from '@/lib/public-metadata';

export const dynamicParams = false;

type ChineseArticlePageProps = Readonly<{ params: Promise<Readonly<{ slug: string }>> }>;

export function generateStaticParams() {
  return CHINESE_KOREA_ARTICLES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ChineseArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getChineseKoreaArticle(slug);
  if (article === null) notFound();
  return indexableMetadata({
    path: `/zh-cn/kr/seoul/insights/${article.slug}/`,
    title: `${article.title} | signedprice`,
    description: article.summary,
    languageAlternates: {
      en: `/news/${article.relatedEnglishSlug}/`,
      'zh-Hans': `/zh-cn/kr/seoul/insights/${article.slug}/`,
    },
    locale: 'zh_CN',
  });
}

export default async function ChineseArticlePage({ params }: ChineseArticlePageProps) {
  const { slug } = await params;
  const article = getChineseKoreaArticle(slug);
  if (article === null) notFound();
  const path = `/zh-cn/kr/seoul/insights/${article.slug}/` as const;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary,
    inLanguage: 'zh-Hans',
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: publicCanonical(path),
    author: { '@type': 'Organization', name: 'SignedPrice 数据编辑部' },
    publisher: { '@type': 'Organization', name: 'SignedPrice' },
  };
  return (
    <EditorialGrowthPublicFrame locale="zh-CN" surface="content">
      <ChineseInsightsArticle article={article} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    </EditorialGrowthPublicFrame>
  );
}
