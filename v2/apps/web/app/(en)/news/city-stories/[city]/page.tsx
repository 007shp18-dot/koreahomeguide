import { notFound } from 'next/navigation';
import { CITY_STORIES, cityStoryHref } from '@/content/city-stories';
import { CityStoryArticle } from '@/components/newsroom/city-story-article';
import { indexableMetadata } from '@/lib/public-metadata';
import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
export const dynamicParams = false;
export function generateStaticParams() { return CITY_STORIES.map(({ city }) => ({ city })); }
type Props = { params: Promise<{ city: string }> };
export async function generateMetadata({ params }: Props) {
  const { city } = await params;
  const story = CITY_STORIES.find(item => item.city === city);
  if (!story) notFound();
  return indexableMetadata({ path: cityStoryHref(story.city, 'en') as `/${string}`, title: `${story.title.en} | SignedPrice`, description: story.deck.en, locale: 'en_US', languageAlternates: { en: cityStoryHref(story.city) as `/${string}`, ko: cityStoryHref(story.city, 'ko') as `/${string}` } });
}
export default async function Page({ params }: Props) {
  const { city } = await params;
  const story = CITY_STORIES.find(item => item.city === city);
  if (!story) notFound();
  return <EditorialGrowthPublicFrame locale="en" surface="content"><CityStoryArticle story={story} locale="en" /></EditorialGrowthPublicFrame>;
}
