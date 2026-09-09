import { notFound } from 'next/navigation';
import { getJourneyArticle, journeyArticleParams } from '@/content/city-journey-articles';
import { journeyArticleHref } from '@/content/city-journey-routes';
import { JourneyArticle } from '@/components/newsroom/journey-article';
import { indexableMetadata } from '@/lib/public-metadata';
import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';

export const dynamicParams = false;
export function generateStaticParams() { return journeyArticleParams(); }
type Props = { params: Promise<{ city: string; step: string }> };

export async function generateMetadata({ params }: Props) {
  const { city, step } = await params;
  const article = getJourneyArticle(city, step);
  if (!article) notFound();
  return indexableMetadata({
    path: journeyArticleHref(article.city, article.id, 'en'),
    title: `${article.title.en} | SignedPrice`,
    description: article.deck.en,
    locale: 'en_US',
    languageAlternates: { en: journeyArticleHref(article.city, article.id), ko: journeyArticleHref(article.city, article.id, 'ko') },
  });
}

export default async function Page({ params }: Props) {
  const { city, step } = await params;
  const article = getJourneyArticle(city, step);
  if (!article) notFound();
  const href = journeyArticleHref(article.city, article.id, 'en');
  return <EditorialGrowthPublicFrame locale="en" surface="content" currentHref={href}><JourneyArticle article={article} locale="en" /></EditorialGrowthPublicFrame>;
}
