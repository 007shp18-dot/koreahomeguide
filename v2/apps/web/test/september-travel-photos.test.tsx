import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { SEPTEMBER_15_EDITORIAL } from '../content/september-15-editorial';
import { NewsroomArticle } from '../components/newsroom/newsroom-article';
import { editorialImages } from '../lib/insights/editorial-images';

describe('September travel photography', () => {
  it.each(['seoul-buam-dong-afternoon-walk', 'tokyo-koenji-vintage-evening-walk'])('renders a credited place photograph in both editions of %s', slug => {
    for (const locale of ['en', 'ko']) {
      const article = SEPTEMBER_15_EDITORIAL.find(a => a.slug === slug && a.locale === locale)!;
      const photos = editorialImages(article.bodyMarkdown);
      expect(photos.length).toBeGreaterThan(0);
      const html = renderToStaticMarkup(<NewsroomArticle article={article} />);
      for (const photo of photos) {
        expect(existsSync(resolve('apps/web/public', '.' + photo.src))).toBe(true);
        expect(html).toContain(photo.src);
        expect(photo.caption).toContain('CC BY-SA');
      }
    }
  });
});
