import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { NEIGHBOURHOOD_STORIES, neighbourhoodHref } from '../content/neighbourhood-stories';
import { NeighbourhoodArticle } from '../components/newsroom/neighbourhood-story';
import { NewsroomIndex, resolveNewsroomFilters } from '../components/newsroom/newsroom-index';
import { generateMetadata, generateStaticParams } from '../app/(en)/news/neighbourhoods/[slug]/page';
import sitemap from '../app/sitemap';

describe('daily neighbourhood publication', () => {
  it('makes each new article discoverable in its city filter and the sitemap', async () => {
    const urls = sitemap().map(entry => entry.url);
    for (const story of NEIGHBOURHOOD_STORIES) {
      const path = neighbourhoodHref(story.slug);
      expect(generateStaticParams()).toContainEqual({ slug: story.slug });
      expect(urls).toContain(`https://www.signedprice.com${path}`);
      const metadata = await generateMetadata({ params: Promise.resolve({ slug: story.slug }) });
      expect(metadata.alternates?.canonical).toBe(`https://www.signedprice.com${path}`);
      const html = renderToStaticMarkup(<NewsroomIndex articles={[]} policies={[]} filters={resolveNewsroomFilters({ market: story.city })} headlines={<div />} />);
      expect(html).toContain(path.replace(/\/$/, ''));
      for (const other of NEIGHBOURHOOD_STORIES.filter(other => other.city !== story.city)) expect(html).not.toContain(neighbourhoodHref(other.slug).replace(/\/$/, ''));
    }
  });
  it('renders four attributed local or hosted photos per article with dates, credits, and matching article schema', () => {
    for (const story of NEIGHBOURHOOD_STORIES) {
      const photos = [story.hero, ...story.sections.map(section => section.photo)];
      expect(new Set(photos.map(photo => photo.src)).size).toBeGreaterThanOrEqual(4);
      const html = renderToStaticMarkup(<NeighbourhoodArticle story={story} />);
      for (const photo of photos) {
        if (photo.src.startsWith('/')) {
          expect(existsSync(fileURLToPath(new URL(`../public${photo.src}`, import.meta.url)))).toBe(true);
        } else {
          const photoUrl = new URL(photo.src);
          expect(photoUrl.protocol).toBe('https:');
          expect(photoUrl.hostname).toBe('images.pexels.com');
          expect(photoUrl.pathname).toMatch(/^\/photos\/\d+\//);
          expect(photo.author).toBeTruthy();
          expect(photo.licenseUrl).toBe('https://www.pexels.com/license/');
        }
        expect(html).toContain(photo.src);
        expect(html).toContain(photo.licenseUrl);
        expect(photo.width).toBeGreaterThan(0);
      }
      const schema = JSON.parse(html.match(/<script[^>]*>(.*?)<\/script>/)?.[1] ?? '{}');
      expect(schema).toMatchObject({ headline: story.title, datePublished: story.publishedAt, mainEntityOfPage: `https://www.signedprice.com${neighbourhoodHref(story.slug)}` });
    }
  });
});
