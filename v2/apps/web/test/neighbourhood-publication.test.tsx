import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { NEIGHBOURHOOD_STORIES, getNeighbourhoodStory, neighbourhoodHref } from '../content/neighbourhood-stories';
import { KOREAN_NEIGHBOURHOOD_STORIES } from '../content/ko/neighbourhood-stories';
import { languageDestinations } from '../lib/navigation/site-navigation';
import { insightPhoto } from '../content/insight-photos';
import { NeighbourhoodArticle } from '../components/newsroom/neighbourhood-story';
import { NewsroomIndex, resolveNewsroomFilters } from '../components/newsroom/newsroom-index';
import { generateMetadata, generateStaticParams } from '../app/(en)/news/neighbourhoods/[slug]/page';
import sitemap from '../app/sitemap';

describe('daily neighbourhood publication', () => {
  it('connects the existing multilingual columns and gives all editions a lead photo', () => {
    for (const slug of ['how-to-read-property-transaction-prices-and-medians', 'singapore-condo-absd-60-percent-real-acquisition-cost']) {
      expect(languageDestinations(`/ko/news/${slug}/`).en).toBe(`/news/${slug}-en/`);
      expect(languageDestinations(`/news/${slug}-en/`).ko).toBe(`/ko/news/${slug}/`);
      expect(insightPhoto(slug)?.src).toBe(insightPhoto(`${slug}-en`)?.src);
      expect(insightPhoto(slug)?.source).toBeTruthy();
    }
  });
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
  it('renders attributed photos unless their location is awaiting verification', () => {
    for (const story of NEIGHBOURHOOD_STORIES) {
      const photos = [story.hero, ...story.sections.map(section => section.photo)];
      expect(new Set(photos.map(photo => photo.src)).size).toBeGreaterThanOrEqual(4);
      const html = renderToStaticMarkup(<NeighbourhoodArticle story={story} />);
      if (story.photosWithheld) {
        for (const photo of photos) expect(html).not.toContain(photo.src);
        const schema = JSON.parse(html.match(/<script[^>]*>(.*?)<\/script>/)?.[1] ?? '{}');
        expect(schema.image).toBeUndefined();
        continue;
      }
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
  it('uses verified Seochon archive photos and keeps the valley optional', () => {
    for (const locale of ['en', 'ko'] as const) {
      const story = getNeighbourhoodStory('seochon', locale)!;
      expect(story.photosWithheld).toBeFalsy();
      expect(story.hero.src).toContain('seochon-hanok-2016');
      expect(story.deck + story.route).not.toMatch(/Valley|계곡/);
      expect(story.sections.map(s => s.title).join(' ')).not.toMatch(/Valley|계곡/);
      for (const photo of [story.hero, ...story.sections.map(s => s.photo)]) {
        expect(photo.source).toContain('commons.wikimedia.org/wiki/File:');
        expect(photo.licenseUrl).toContain('creativecommons.org/');
        expect(photo.caption).toMatch(/201[456]/);
      }
    }
  });
  it('publishes all eight complete Korean editions with reciprocal language links', () => {
    for (const original of NEIGHBOURHOOD_STORIES) {
      const copy = KOREAN_NEIGHBOURHOOD_STORIES[original.slug]!;
      expect(copy.sections).toHaveLength(original.sections.length);
      expect(copy.captions).toHaveLength(4);
      expect(copy.sourceLabels).toHaveLength(original.sources.length);
      const story = getNeighbourhoodStory(original.slug, 'ko')!;
      const html = renderToStaticMarkup(<NeighbourhoodArticle story={story} locale="ko" />);
      expect(story.title).toMatch(/[가-힣]/);
      expect(html).toContain('lang="ko"');
      expect(html).toContain('출처와 참고 자료');
      expect(html).toContain(neighbourhoodHref(original.slug).replace(/\/$/, ''));
      expect(languageDestinations(neighbourhoodHref(original.slug)).ko).toBe(neighbourhoodHref(original.slug, 'ko'));
      expect(sitemap().map(entry => entry.url)).toContain(`https://www.signedprice.com${neighbourhoodHref(original.slug, 'ko')}`);
      story.sections.forEach(section => section.paragraphs.forEach(p => expect(p).toMatch(/[가-힣]/)));
    }
  });
});
