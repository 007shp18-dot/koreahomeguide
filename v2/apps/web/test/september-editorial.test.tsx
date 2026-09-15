import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { SEPTEMBER_13_EDITORIAL } from '../content/september-13-editorial';
import { buildInsightItems, InsightsIndex } from '../components/newsroom/insights-index';
import { NewsroomArticle } from '../components/newsroom/newsroom-article';
import { editorialImages } from '../lib/insights/editorial-images';
import { editorialLanguageRoutes } from '../lib/navigation/editorial-language-routes';

describe('September 13 bilingual edition', () => {
  it('does not present first-party brokerage research as an official authority', () => {
    const article = SEPTEMBER_13_EDITORIAL.find(a => a.locale === 'ko' && a.slug === 'dubai-new-renewal-rent-mix')!;
    const html = renderToStaticMarkup(<NewsroomArticle article={article} />);
    const sources = html.slice(html.indexOf('<h2 id="article-sources-title"'));
    expect(sources).toContain('Betterhomes');
    expect(sources).not.toContain('공식 자료');
  });
  it('offers all four stories in both languages and separates neighbourhoods from investment', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-13T15:00:00Z'));
    try {
      for (const locale of ['en', 'ko'] as const) {
        const records = SEPTEMBER_13_EDITORIAL.filter(a => a.locale === locale);
        expect(records).toHaveLength(4);
        const items = [
          ...buildInsightItems([], 'all', locale),
          ...buildInsightItems([], 'all', locale, 'neighborhood'),
        ];
        const selected = items.filter(i => records.some(a => a.id === i.id));
        expect(selected).toHaveLength(4);
        expect(selected.filter(i => i.investment)).toHaveLength(2);
        for (const record of records) {
          const otherLocale = locale === 'en' ? 'ko' : 'en';
          const translated = SEPTEMBER_13_EDITORIAL.find(a => a.slug === record.slug && a.locale === otherLocale)!;
          expect(editorialLanguageRoutes()[record.canonicalHref]?.[otherLocale]).toBe(translated.canonicalHref);
          const html = renderToStaticMarkup(<NewsroomArticle article={record} />);
          expect(html).toContain(record.title);
          for (const photo of editorialImages(record.bodyMarkdown)) {
            expect(existsSync(resolve('apps/web/public', '.' + photo.src))).toBe(true);
            expect(html).toContain(photo.src);
          }
        }
      }
      const html = renderToStaticMarkup(<InsightsIndex articles={[]} market="all" />);
      expect(html).toMatch(/<figcaption[^>]*><details><summary>Photo credit<\/summary>/);
    } finally { vi.useRealTimers(); }
  });
  it('keeps the requested long-form reading length excluding images and references', () => {
    for (const record of SEPTEMBER_13_EDITORIAL.filter(a => a.locale === 'ko')) {
      const body = record.bodyMarkdown.split('## 자료와 제작')[0]!.split('\n').filter(line => !line.startsWith('![')).join('\n').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#*|]/g, '').trim();
      const longForm = ['singapore-lower-psf-higher-total-budget', 'dubai-new-renewal-rent-mix'].includes(record.slug);
      expect(body.length, record.slug).toBeGreaterThanOrEqual(longForm ? 3600 : 1800);
      expect(body.length, record.slug).toBeLessThanOrEqual(longForm ? 4400 : 2200);
    }
  });
  it('renders the visual analysis in both languages with accessible descriptions and captions', () => {
    for (const record of SEPTEMBER_13_EDITORIAL) {
      const photos = editorialImages(record.bodyMarkdown);
      const longForm = ['singapore-lower-psf-higher-total-budget', 'dubai-new-renewal-rent-mix'].includes(record.slug);
      expect(photos.length, record.id).toBeGreaterThanOrEqual(longForm ? 3 : 2);
      const html = renderToStaticMarkup(<NewsroomArticle article={record} />);
      for (const photo of photos) {
        expect(photo.alt.length).toBeGreaterThan(15);
        expect(photo.caption.length).toBeGreaterThan(15);
        expect(html).toContain(photo.src);
      }
    }
  });
  it('keeps the credit in document flow with an independent image frame', () => {
    const css = readFileSync(resolve('apps/web/components/newsroom/insights-index.module.css'), 'utf8');
    const credit = css.match(/\.credit\{([^}]+)\}/)?.[1];
    expect(credit).toBeDefined();
    expect(credit).not.toMatch(/position:absolute|max-height|overflow-y/);
    expect(css).toMatch(/\.photo>a\{[^}]*aspect-ratio:3\/2/);
  });
});
