import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DubaiAreaPhoto } from '../components/dubai/dubai-area-photo';
import { DUBAI_AREA_PHOTOS, dubaiAreaPhoto } from '../lib/dubai/area-photos';

describe('Dubai area context photographs', () => {
  it('uses an explicit location match and never substitutes another area', () => {
    expect(dubaiAreaPhoto('marsa-dubai')?.name).toBe('Dubai Marina');
    expect(dubaiAreaPhoto('unpublished-area')).toBeUndefined();
    expect(renderToStaticMarkup(<DubaiAreaPhoto slug="unpublished-area" locale="ko" variant="thumbnail" />)).toBe('');
    expect(new Set(DUBAI_AREA_PHOTOS.map(photo => photo.slug)).size).toBe(DUBAI_AREA_PHOTOS.length);
  });

  it('serves a small local thumbnail lazily without image transformation requests', () => {
    const html = renderToStaticMarkup(<DubaiAreaPhoto slug="marsa-dubai" locale="ko" variant="thumbnail" />);
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('width="360" height="240"');
    expect(html).toContain('지역 전경 · 2020');
    expect(html).not.toContain('/_next/image');
    const path = fileURLToPath(new URL('../public/assets/dubai-areas/marsa-dubai-thumb.webp', import.meta.url));
    expect(statSync(path).size).toBeLessThan(35_000);
    expect(readFileSync(path).subarray(8, 12).toString()).toBe('WEBP');
  });

  it('retains source, licence and historical capture date in all detail locales', () => {
    for (const photo of DUBAI_AREA_PHOTOS) {
      for (const locale of ['en', 'ko', 'zh-CN'] as const) {
        const html = renderToStaticMarkup(<DubaiAreaPhoto slug={photo.slug} locale={locale} variant="detail" />);
        expect(html).toContain(photo.date);
        expect(html).toContain(photo.author);
        expect(html).toContain(photo.licenseUrl);
      }
    }
  });
});
