import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EDITORIAL_PORTFOLIO } from '../content/portfolio-manifest';
import { relatedReading } from '../content/related-reading';

describe('article reading paths', () => {
  it('links every article to two distinct existing destinations without a self-link', () => {
    const routes = new Set(EDITORIAL_PORTFOLIO.map(record => record.canonicalHref));
    for (const article of EDITORIAL_PORTFOLIO) {
      const links = relatedReading(article);
      expect(links).toHaveLength(2);
      expect(new Set(links.map(link => link.href)).size).toBe(2);
      for (const { href } of links) {
        expect(href.endsWith(`/${article.slug}/`)).toBe(false);
        expect(routes.has(href) || existsSync(`apps/web/app/(en)${href}page.tsx`), href).toBe(true);
      }
    }
  });

  it('keeps rental readers on rental topics and Dubai readers on Dubai topics', () => {
    for (const slug of ['rent-an-apartment-in-korea', 'seoul-new-renewal-rent-gap', 'korea-rental-deposit-protection-status']) {
      const article = EDITORIAL_PORTFOLIO.find(record => record.locale === 'en' && record.slug === slug)!;
      expect(relatedReading(article).every(link => /rent|wolse|jeonse/.test(link.href))).toBe(true);
    }
    for (const article of EDITORIAL_PORTFOLIO.filter(record => record.marketId === 'ae-dubai')) {
      expect(relatedReading(article).every(link => link.href.includes('dubai'))).toBe(true);
    }
  });
});
