import { notFound } from 'next/navigation';
import { NEIGHBOURHOOD_STORIES, getNeighbourhoodStory, neighbourhoodHref } from '@/content/neighbourhood-stories';
import { NeighbourhoodArticle } from '@/components/newsroom/neighbourhood-story';
import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { indexableMetadata, publicCanonical } from '@/lib/public-metadata';

export const dynamicParams = false;
export function generateStaticParams() { return NEIGHBOURHOOD_STORIES.map(({ slug }) => ({ slug })); }
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const story = getNeighbourhoodStory((await params).slug);
  if (!story) notFound();
  const metadata = indexableMetadata({ path: neighbourhoodHref(story.slug), title: `${story.title} | SignedPrice`, description: story.deck, locale: 'en_US' });
  const images = [{ url: publicCanonical(story.hero.src as `/${string}`), width: story.hero.width, height: story.hero.height, alt: story.hero.alt }];
  return { ...metadata, openGraph: { ...metadata.openGraph, type: 'article', publishedTime: story.publishedAt, images }, twitter: { ...metadata.twitter, card: 'summary_large_image', images: images.map(image => image.url) } } as import('next').Metadata;
}
export default async function Page({ params }: Props) {
  const story = getNeighbourhoodStory((await params).slug);
  if (!story) notFound();
  return <EditorialGrowthPublicFrame locale="en" surface="content" currentHref={neighbourhoodHref(story.slug)}><NeighbourhoodArticle story={story} /></EditorialGrowthPublicFrame>;
}
