import { notFound } from 'next/navigation';
import { getJourneyArticle, journeyArticleParams } from '@/content/city-journey-articles';
import { journeyArticleHref } from '@/content/city-journey-routes';
import { JourneyArticle } from '@/components/newsroom/journey-article';
import { indexableMetadata } from '@/lib/public-metadata';
import { KoreanSiteFrame } from '@/components/korean-site-frame';

export const dynamicParams = false;
export function generateStaticParams() { return journeyArticleParams(); }
type Props = { params: Promise<{ city: string; step: string }> };

export async function generateMetadata({ params }: Props) {
  const { city, step } = await params;
  const article = getJourneyArticle(city, step);
  if (!article) notFound();
  return indexableMetadata({
    path: journeyArticleHref(article.city, article.id, 'ko'),
    title: `${article.title.ko} | SignedPrice`,
    description: article.deck.ko,
    locale: 'ko_KR',
    languageAlternates: { en: journeyArticleHref(article.city, article.id), ko: journeyArticleHref(article.city, article.id, 'ko') },
  });
}

export default async function Page({ params }: Props) {
  const { city, step } = await params;
  const article = getJourneyArticle(city, step);
  if (!article) notFound();
  const href = journeyArticleHref(article.city, article.id, 'ko');
  return <KoreanSiteFrame href={href}><JourneyArticle article={article} locale="ko" /></KoreanSiteFrame>;
}
