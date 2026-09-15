import { BUYERS_EDITION } from '../content/buyers-edition';
import { EDITORIAL_DEPTH, DEPTH_REVISED_AT } from '../content/editorial-depth';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import originals from '../content/city-journey-articles.json';
import neighbourhoods from '../content/neighbourhood-stories.json';
import { CITY_JOURNEY_ARTICLES } from '../content/city-journey-articles';
import { CITY_STORIES } from '../content/city-stories';
import { getPortfolioRecord, listPortfolioRecords } from '../content/portfolio-manifest';
import { SEPTEMBER_15_EDITORIAL } from '../content/september-15-editorial';
import { refreshDiscovery, discoveryCopy, DISCOVERY_UPDATED_AT } from '../content/editorial-discovery';
import { SEPTEMBER_14_EDITORIAL } from '../content/september-14-editorial';
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
  it('covers the 14 retained legacy portfolio briefs and data stories in each language', () => {
    // This edition was authored after the one-time rewrite. Exclude its exact
    // records, rather than allowing a missing override to remove legacy coverage.
    const nativeEditionIds = new Set([...SEPTEMBER_14_EDITORIAL, ...SEPTEMBER_15_EDITORIAL, ...BUYERS_EDITION].map(({ id }) => id));
    for (const locale of ['en','ko'] as const) {
      const articles = listPortfolioRecords(locale).filter(item => ['market-brief','data-story'].includes(item.type)
        && !nativeEditionIds.has(item.id));
      expect(articles).toHaveLength(14);
      for (const article of articles) {
        expect(hasEditorialRevision(article.slug), article.slug).toBe(true);
        expect(article.updatedAt, article.slug).toBe(EDITORIAL_DEPTH[article.slug] ? DEPTH_REVISED_AT : discoveryCopy(article.slug, article.locale) ? DISCOVERY_UPDATED_AT : EDITORIAL_REVISION_DATE);
        expect(article.bodyMarkdown).not.toMatch(/\{\{(?:image|table):/);
        expect(reviseEditorial(article)).toEqual(article);
      }
    }
  });
  it('preserves the four new bilingual articles with their own reviewed evidence and prose', () => {
    expect(SEPTEMBER_14_EDITORIAL).toHaveLength(8);
    const slugs = [...new Set(SEPTEMBER_14_EDITORIAL.map(({ slug }) => slug))];
    expect(slugs).toHaveLength(4);
    for (const slug of slugs) {
      const editions = SEPTEMBER_14_EDITORIAL.filter(article => article.slug === slug);
      expect(editions.map(({ locale }) => locale).sort()).toEqual(['en', 'ko']);
      expect(hasEditorialRevision(slug), slug).toBe(false);
      for (const authored of editions) {
        const published = getPortfolioRecord(authored.locale, slug);
        expect(published, `${authored.locale}/${slug}`).toEqual(refreshDiscovery(authored));
        expect(authored.status).toBe('published');
        expect(authored.evidenceState).toBe('verified');
        expect(authored.reviewedBy).toBeTruthy();
        expect(Date.parse(authored.reviewedAt!)).toBeGreaterThan(Date.parse(EDITORIAL_REVISION_DATE));
        expect(Date.parse(authored.publishedAt)).toBeGreaterThan(Date.parse(EDITORIAL_REVISION_DATE));
        expect(Date.parse(authored.updatedAt)).toBeGreaterThan(Date.parse(EDITORIAL_REVISION_DATE));
        expect(authored.sources.length).toBeGreaterThan(0);
        expect(authored.evidenceReleaseIds.length).toBeGreaterThan(0);
        expect(authored.bodyMarkdown).not.toMatch(/\{\{(?:image|table):/);
        expect(reviseEditorial(authored)).toBe(authored);
        if (authored.locale === 'ko') {
          expect(authored.title).toMatch(/[가-힣]/);
          expect(authored.bodyMarkdown).toMatch(/[가-힣]/);
        }
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
