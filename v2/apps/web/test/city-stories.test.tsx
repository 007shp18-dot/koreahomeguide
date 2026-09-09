import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { CITY_STORIES, STORY_STEPS, cityStoryHref } from '../content/city-stories';
import { LOCAL_CONVERSATIONS } from '../content/local-conversations';
import { CityStoryArticle, storyLinkHref } from '../components/newsroom/city-story-article';
import { listPortfolioRecords } from '../content/portfolio-manifest';
import { languageDestinations } from '../lib/navigation/site-navigation';

describe('published city journeys', () => {
  it.each(CITY_STORIES)('lets readers open all six $city stages as independent articles', story => {
    for (const locale of ['en', 'ko'] as const) {
      const html = renderToStaticMarkup(<CityStoryArticle story={story} locale={locale} />);
      for (const step of STORY_STEPS) {
        expect(html).toContain(`href="${cityStoryHref(story.city, locale)}${step.id}"`);
      }
    }
  });
  it('offers a collapsible contents list with the actual chapter titles', () => {
    const story = CITY_STORIES[0];
    const html = renderToStaticMarkup(<CityStoryArticle story={story} locale="ko" />);
    expect(html).toMatch(/<details[^>]*data-article-contents/);
    const contents = html.match(/<details[^>]*data-article-contents[\s\S]*?<\/details>/)?.[0] ?? '';
    expect(contents).toContain('목차');
    for (const section of story.sections) {
      expect(contents).toContain(`href="#${section.id}"`);
      expect(contents).toContain(section.title.ko);
    }
  });
  it.each(CITY_STORIES)('connects every $city chapter to available content and tools', story => {
    expect(story.sections.map(section => section.id)).toEqual(STORY_STEPS.map(step => step.id));
    for (const locale of ['en', 'ko'] as const) {
      const html = renderToStaticMarkup(<CityStoryArticle story={story} locale={locale} />);
      expect(html).toContain(story.title[locale].replaceAll('&', '&amp;'));
      expect(languageDestinations(cityStoryHref(story.city)).ko).toBe(cityStoryHref(story.city, 'ko'));
      for (const section of story.sections) for (const link of section.links) {
        const href = storyLinkHref(link.href, locale);
        if (!href.startsWith('/')) { expect(new URL(href).protocol).toBe('https:'); continue; }
        const pathname = href.split('?')[0]!;
        const canonical = listPortfolioRecords().some(record => record.canonicalHref === pathname);
        const file = `${locale === 'ko' && pathname.startsWith('/ko/') ? '(ko)' : '(en)'}${pathname}page.tsx`;
        expect(canonical || existsSync(new URL(`../app/${file}`, import.meta.url)) || existsSync(new URL(`../app/${file.replace('/kr/seoul/', '/[country]/[city]/')}`, import.meta.url)), pathname).toBe(true);
      }
    }
    expect(LOCAL_CONVERSATIONS.filter(item => item.city === story.city)).toHaveLength(5);
  });
});
