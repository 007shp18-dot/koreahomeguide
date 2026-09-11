import stories from './neighbourhood-stories.json';
import { KOREAN_NEIGHBOURHOOD_STORIES } from './ko/neighbourhood-stories';

export type NeighbourhoodPhoto = {
  src: string; width: number; height: number; alt: string; caption: string;
  author: string; source: string; license: string; licenseUrl: string;
};
export type NeighbourhoodStory = {
  photosWithheld?: boolean;
  slug: string; city: string; cityName: string; neighbourhood: string;
  title: string; deck: string; publishedAt: string; route: string;
  intro: string; hero: NeighbourhoodPhoto;
  sections: { title: string; paragraphs: string[]; photo: NeighbourhoodPhoto }[];
  living: string; sources: { label: string; href: string }[];
};

export const NEIGHBOURHOOD_STORIES: readonly NeighbourhoodStory[] = stories;
export const neighbourhoodHref = (slug: string, locale: 'en' | 'ko' = 'en'): `/news/neighbourhoods/${string}/` | `/ko/news/neighbourhoods/${string}/` => `${locale === 'ko' ? '/ko' : ''}/news/neighbourhoods/${slug}/`;
function localize(story: NeighbourhoodStory, locale: 'en' | 'ko'): NeighbourhoodStory {
  const translation = locale === 'ko' ? KOREAN_NEIGHBOURHOOD_STORIES[story.slug] : undefined;
  if (!translation) return story;
  const { captions, sourceLabels, sections, ...copy } = translation;
  return { ...story, ...copy,
    hero: { ...story.hero, caption: captions[0]!, alt: captions[0]! },
    sections: story.sections.map((section, index) => ({ ...section, ...sections[index], photo: { ...section.photo, caption: captions[index + 1]!, alt: captions[index + 1]! } })),
    sources: story.sources.map((source, index) => ({ ...source, label: sourceLabels[index]! })),
  };
}
export const getNeighbourhoodStory = (slug: string, locale: 'en' | 'ko' = 'en') => {
  const story = NEIGHBOURHOOD_STORIES.find(story => story.slug === slug);
  return story ? localize(story, locale) : undefined;
};
export function listNeighbourhoodStories(city = 'all', locale: 'en' | 'ko' = 'en') {
  return NEIGHBOURHOOD_STORIES.filter(story => city === 'all' || story.city === city)
    .toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt)).map(story => localize(story, locale));
}
