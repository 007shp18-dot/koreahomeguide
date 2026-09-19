import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { articleFromRow } from '../lib/content/content-repository.server';
import { articlePhotoFromRow, cityPhotoLabel } from '../lib/content/article-photo';
import { homeArticlePhoto } from '../lib/home/home-article-photo';
import { storedEditorialRecord } from '../lib/content/newsroom-content.server';

const photo = {
  src: 'https://images.example.org/verified-building.jpg', entityId: 'sg-project:exact-id',
  buildingName: 'Verified named property', attributionName: 'Photographer',
  attributionUrl: 'https://example.org/photographer', sourceUrl: 'https://example.org/photo',
};
const row = {
  slug: 'named-property-analysis', title: 'Property analysis', summary: 'Summary',
  body_markdown: '![Uploaded context](/assets/stories/context.jpg)', locale: 'en', content_type: 'data-story',
  market_id: 'sg-singapore', published_at: '2026-09-10T00:00:00Z', updated_at: '2026-09-10T00:00:00Z',
  reviewed_at: '2026-09-09T00:00:00Z', reviewed_by: 'editor', evidence_state: 'not-applicable', sources: [],
};

describe('explicit article property photography', () => {
  it('carries the rights-checked DB identity and attribution ahead of body or city imagery', () => {
    const article = articleFromRow({ ...row, property_photo: photo })!;
    expect(article.propertyPhoto).toEqual(photo);
    expect(homeArticlePhoto(storedEditorialRecord(article))).toMatchObject({
      src: photo.src, alt: photo.buildingName, context: 'property', credit: { author: photo.attributionName, source: photo.sourceUrl },
    });
  });
  it('does not infer property evidence from a title or a city and labels the fallback', () => {
    const article = articleFromRow({ ...row, body_markdown: 'Plain article body' })!;
    expect(article.propertyPhoto).toBeUndefined();
    expect(homeArticlePhoto(storedEditorialRecord(article))).toMatchObject({ context: 'city' });
    expect(cityPhotoLabel('ko')).toBe('도시 배경 사진');
  });
  it('withholds unsafe or unattributed media without suppressing the article', () => {
    for (const invalid of [
      { ...photo, src: 'javascript:alert(1)' }, { ...photo, sourceUrl: 'https://user:password@example.org' },
      { ...photo, entityId: '' }, { ...photo, attributionName: '' },
    ]) {
      expect(articlePhotoFromRow(invalid)).toBeUndefined();
      expect(articleFromRow({ ...row, property_photo: invalid })?.propertyPhoto).toBeUndefined();
      expect(articleFromRow({ ...row, property_photo: invalid })?.slug).toBe(row.slug);
    }
  });
});
