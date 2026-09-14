import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import originals from '../content/city-journey-articles.json';
import neighbourhoods from '../content/neighbourhood-stories.json';
import { CITY_JOURNEY_ARTICLES } from '../content/city-journey-articles';
import { CITY_STORIES } from '../content/city-stories';
import { listPortfolioRecords } from '../content/portfolio-manifest';
import { getNeighbourhoodStory } from '../content/neighbourhood-stories';
import { EDITORIAL_REVISION_DATE, hasEditorialRevision, reviseEditorial } from '../content/editorial-revision';
import { BILINGUAL_DATABASE_SLUGS } from '../content/editorial-edition-slugs';
import { editorialLanguageRoutes } from '../lib/navigation/editorial-language-routes';

describe('whole editorial revision coverage', () => {
  it('connects both directions of all eight new database language pairs without importing their prose', () => {
    expect(BILINGUAL_DATABASE_SLUGS).toHaveLength(8);
    const routes = editorialLanguageRoutes();
    for (const slug of BILINGUAL_DATABASE_SLUGS) {
      expect(hasEditorialRevision(slug)).toBe(true);
      expect(routes[`/news/${slug}/`]?.ko).toBe(`/ko/news/${slug}/`);
      expect(routes[`/ko/news/${slug}/`]?.en).toBe(`/news/${slug}/`);
    }
  });
  it('replaces both editions of all thirty city articles without changing their evidence or anchors', () => {
    expect(CITY_JOURNEY_ARTICLES).toHaveLength(originals.length);
    for (const article of CITY_JOURNEY_ARTICLES) {
      const original = originals.find(item => item.city === article.city && item.id === article.id)!;
      expect(article.editedAt).toBe('2026-09-14');
      expect(article.checkedAt).toBe(original.checkedAt);
      expect(article.sources).toEqual(original.sources);
      expect(article.sections.map(section => ({id:section.id,sourceIds:section.sourceIds,table:section.table}))).toEqual(original.sections.map(section => ({id:section.id,sourceIds:section.sourceIds,table:'table' in section ? section.table : undefined})));
      for (const locale of ['en','ko'] as const) {
        expect(article.title[locale]).not.toBe(original.title[locale]);
        expect(article.deck[locale]).not.toBe(original.deck[locale]);
        article.sections.forEach((section,index) => expect(section.paragraphs[locale]).not.toEqual(original.sections[index]!.paragraphs[locale]));
      }
    }
  });
  it('keeps four city hubs consistent with the rewritten articles', () => {
    for (const story of CITY_STORIES) for (const section of story.sections) {
      const article = CITY_JOURNEY_ARTICLES.find(item => item.city === story.city && item.id === section.id)!;
      expect(section.title).toEqual(article.title);
      expect(section.paragraphs).toEqual({en:[article.deck.en],ko:[article.deck.ko]});
    }
  });
  it('covers every portfolio market brief and data story in English and Korean', () => {
    for (const locale of ['en','ko'] as const) {
      const articles = listPortfolioRecords(locale).filter(item => ['market-brief','data-story'].includes(item.type));
      expect(articles.length).toBeGreaterThan(20);
      for (const article of articles) {
        expect(hasEditorialRevision(article.slug), article.slug).toBe(true);
        expect(article.updatedAt, article.slug).toBe(EDITORIAL_REVISION_DATE);
        expect(article.bodyMarkdown).not.toMatch(/\{\{(?:image|table):/);
        expect(reviseEditorial(article)).toEqual(article);
      }
    }
  });
  it('rewrites all eight neighbourhoods while retaining the licensed photographs', () => {
    expect(neighbourhoods).toHaveLength(8);
    for (const original of neighbourhoods) for (const locale of ['en','ko'] as const) {
      const revised = getNeighbourhoodStory(original.slug,locale)!;
      expect(revised.updatedAt).toBe('2026-09-14');
      expect(revised.publishedAt).toBe(original.publishedAt);
      expect(revised.title).not.toBe(original.title);
      expect(revised.intro).not.toBe(original.intro);
      expect(revised.hero.src).toBe(original.hero.src);
      expect(revised.sections.map(section => section.photo.source)).toEqual(original.sections.map(section => section.photo.source));
      expect(revised.sections.map(section => section.photo.licenseUrl)).toEqual(original.sections.map(section => section.photo.licenseUrl));
    }
  });
  it('does not overwrite a newer editorial version', () => {
    const article = {...listPortfolioRecords('en').find(item => hasEditorialRevision(item.slug))!,title:'Later approved headline',bodyMarkdown:'Later approved body',updatedAt:'2026-09-15T00:00:00Z'};
    expect(reviseEditorial(article)).toBe(article);
  });
});
