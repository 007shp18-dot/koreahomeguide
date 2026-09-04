import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { NewsroomArticle } from '@/components/newsroom/newsroom-article';
import { PublicEditorialJsonLd } from '@/components/public-json-ld';
import { EDITORIAL_PORTFOLIO, getPortfolioRecord, listPortfolioRecords } from '@/content/portfolio-manifest';
import { editorialLanguageAlternates, indexableMetadata } from '@/lib/public-metadata';

type Props = Readonly<{ params: Promise<Readonly<{ slug: string }>> }>;
export const dynamicParams = false;
export function generateStaticParams() { return listPortfolioRecords('zh-CN').filter(({ type }) => type === 'market-brief' || type === 'data-story').map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getPortfolioRecord('zh-CN', (await params).slug); if (article === null || article.type === 'guide' || article.type === 'policy-update') notFound();
  const languageAlternates = editorialLanguageAlternates(article, EDITORIAL_PORTFOLIO);
  return indexableMetadata({ path: article.canonicalHref as `/${string}`, title: `${article.title} | signedprice`, description: article.deck, locale: 'zh_CN', ...(languageAlternates === undefined ? {} : { languageAlternates }) });
}
export default async function ChineseNewsArticlePage({ params }: Props) {
  const article = getPortfolioRecord('zh-CN', (await params).slug); if (article === null || article.type === 'guide' || article.type === 'policy-update') notFound();
  return <EditorialGrowthPublicFrame locale="zh-CN" surface="content"><NewsroomArticle article={article} /><PublicEditorialJsonLd article={article} /></EditorialGrowthPublicFrame>;
}
