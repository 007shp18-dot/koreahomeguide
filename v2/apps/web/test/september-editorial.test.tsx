import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { SEPTEMBER_13_EDITORIAL } from '../content/september-13-editorial';
import { buildInsightItems, InsightsIndex } from '../components/newsroom/insights-index';
import { NewsroomArticle } from '../components/newsroom/newsroom-article';
import { editorialImages } from '../lib/insights/editorial-images';

describe('September 13 bilingual edition', () => {
  it('offers all four stories in both languages and separates neighbourhoods from investment', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-13T15:00:00Z'));
    try {
      for (const locale of ['en', 'ko'] as const) {
        const records = SEPTEMBER_13_EDITORIAL.filter(a => a.locale === locale);
        expect(records).toHaveLength(4);
        const items = buildInsightItems([], 'all', locale);
        const selected = items.filter(i => records.some(a => a.id === i.id));
        expect(selected).toHaveLength(4);
        expect(selected.filter(i => i.investment)).toHaveLength(2);
        for (const record of records) {
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
  it('keeps Korean body copy within 1,000–1,500 characters excluding picture and reference lines', () => {
    for (const record of SEPTEMBER_13_EDITORIAL.filter(a => a.locale === 'ko')) {
      const body = record.bodyMarkdown.split('\n').filter(line => !line.startsWith('![') && !/^(분류 참고:|\[공식 헤리티지|\[GO TOKYO 지역)/.test(line)).join('\n').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim();
      expect(body.length, record.slug).toBeGreaterThanOrEqual(1000);
      expect(body.length, record.slug).toBeLessThanOrEqual(1500);
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
