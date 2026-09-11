import { notFound } from 'next/navigation';
import { NEIGHBOURHOOD_STORIES, getNeighbourhoodStory, neighbourhoodHref } from '@/content/neighbourhood-stories';
import { NeighbourhoodArticle } from '@/components/newsroom/neighbourhood-story';
import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { indexableMetadata, publicCanonical } from '@/lib/public-metadata';

export const dynamicParams = false;
export function generateStaticParams() { return NEIGHBOURHOOD_STORIES.map(({ slug }) => ({ slug })); }
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const story = getNeighbourhoodStory((await params).slug, 'ko');
  if (!story) notFound();
  const metadata = indexableMetadata({ path: neighbourhoodHref(story.slug, 'ko'), title: `${story.title} | SignedPrice`, description: story.deck, locale: 'ko_KR' });
  const images = story.photosWithheld ? [] : [{ url: publicCanonical(story.hero.src as `/${string}`), width: story.hero.width, height: story.hero.height, alt: story.hero.alt }];
  return { ...metadata, alternates: { ...metadata.alternates, languages: { en: publicCanonical(neighbourhoodHref(story.slug)), ko: publicCanonical(neighbourhoodHref(story.slug, 'ko')), 'x-default': publicCanonical(neighbourhoodHref(story.slug)) } }, openGraph: { ...metadata.openGraph, type: 'article', publishedTime: story.publishedAt, images }, twitter: { ...metadata.twitter, card: images.length ? 'summary_large_image' : 'summary', images: images.map(image => image.url) } } as import('next').Metadata;
}
export default async function Page({ params }: Props) {
  const story = getNeighbourhoodStory((await params).slug, 'ko');
  if (!story) notFound();
  return <EditorialGrowthPublicFrame locale="ko" surface="content" currentHref={neighbourhoodHref(story.slug, 'ko')}><NeighbourhoodArticle story={story} locale="ko" /></EditorialGrowthPublicFrame>;
}
