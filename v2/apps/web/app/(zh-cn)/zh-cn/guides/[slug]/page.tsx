import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { NewsroomArticle } from '@/components/newsroom/newsroom-article';
import { PublicEditorialJsonLd } from '@/components/public-json-ld';
import { EDITORIAL_PORTFOLIO, getPortfolioRecord, listPortfolioRecords } from '@/content/portfolio-manifest';
import { editorialLanguageAlternates, indexableMetadata } from '@/lib/public-metadata';

type Props = Readonly<{ params: Promise<Readonly<{ slug: string }>> }>;
export const dynamicParams = false;
export function generateStaticParams() { return listPortfolioRecords('zh-CN').filter(({ type }) => type === 'guide').map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getPortfolioRecord('zh-CN', (await params).slug); if (guide?.type !== 'guide') notFound();
  const languageAlternates = editorialLanguageAlternates(guide, EDITORIAL_PORTFOLIO);
  return indexableMetadata({ path: guide.canonicalHref as `/${string}`, title: `${guide.title} | signedprice`, description: guide.deck, locale: 'zh_CN', ...(languageAlternates === undefined ? {} : { languageAlternates }) });
}
export default async function ChineseGuidePage({ params }: Props) {
  const guide = getPortfolioRecord('zh-CN', (await params).slug); if (guide?.type !== 'guide') notFound();
  return <EditorialGrowthPublicFrame locale="zh-CN" surface="content"><NewsroomArticle article={guide} /><PublicEditorialJsonLd article={guide} /></EditorialGrowthPublicFrame>;
}
