import stories from './neighbourhood-stories.json';

export type NeighbourhoodPhoto = {
  src: string; width: number; height: number; alt: string; caption: string;
  author: string; source: string; license: string; licenseUrl: string;
};
export type NeighbourhoodStory = {
  slug: string; city: string; cityName: string; neighbourhood: string;
  title: string; deck: string; publishedAt: string; route: string;
  intro: string; hero: NeighbourhoodPhoto;
  sections: { title: string; paragraphs: string[]; photo: NeighbourhoodPhoto }[];
  living: string; sources: { label: string; href: string }[];
};

export const NEIGHBOURHOOD_STORIES: readonly NeighbourhoodStory[] = stories;
export const neighbourhoodHref = (slug: string): `/news/neighbourhoods/${string}/` => `/news/neighbourhoods/${slug}/`;
export const getNeighbourhoodStory = (slug: string) => NEIGHBOURHOOD_STORIES.find(story => story.slug === slug);
export function listNeighbourhoodStories(city = 'all') {
  return NEIGHBOURHOOD_STORIES.filter(story => city === 'all' || story.city === city)
    .toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
