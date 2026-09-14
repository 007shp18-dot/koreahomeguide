import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { PropertyReviewDetailPage, namedPropertyMetadata, namedPropertyProfile, namedPropertyStaticParams } from '../components/market-ui/property-review-detail-page';
import { PropertyReviewDirectory } from '../components/market-ui/property-review-directory';
import { propertyReviewDirectoryEntries } from '../lib/research/property-review-profile';
import { actualDetailHref } from '../lib/research/property-review-locations';
import * as locations from '../lib/research/property-review-locations';
import TokyoPropertyPage from '../app/(en)/jp/tokyo/explore/properties/[profileId]/page';
import DubaiProjectPage from '../app/(ko)/ko/ae/dubai/explore/projects/[profileId]/page';

describe('named property details in Explore', () => {
  it('creates property routes in their actual market and rejects cross-market identities', async () => {
    expect(namedPropertyStaticParams('jp-tokyo')).toEqual(expect.arrayContaining([{ profileId: 'jp-park-city-toyosu' }]));
    expect(namedPropertyStaticParams('ae-dubai')).toEqual(expect.arrayContaining([{ profileId: 'ae-valia' }]));
    expect(namedPropertyProfile('jp-tokyo', 'ae-valia')).toBeNull();
    expect(namedPropertyProfile('ae-dubai', 'jp-park-city-toyosu')).toBeNull();
    await expect(TokyoPropertyPage({ params: Promise.resolve({ profileId: 'ae-valia' }) })).rejects.toThrow();
    await expect(DubaiProjectPage({ params: Promise.resolve({ profileId: 'unknown' }) })).rejects.toThrow();
  });

  it('uses clean property canonicals and preserves English and Korean alternates', () => {
    const metadata = namedPropertyMetadata('ko', 'jp-tokyo', 'jp-park-city-toyosu');
    expect(metadata.alternates?.canonical).toBe('https://www.signedprice.com/ko/jp/tokyo/explore/properties/jp-park-city-toyosu/');
    expect(metadata.alternates?.languages).toMatchObject({
      en: 'https://www.signedprice.com/jp/tokyo/explore/properties/jp-park-city-toyosu/',
      ko: 'https://www.signedprice.com/ko/jp/tokyo/explore/properties/jp-park-city-toyosu/',
    });
    expect(namedPropertyMetadata('zh-CN', 'jp-tokyo', 'jp-park-city-toyosu').robots).toEqual({ index: false, follow: true });
    expect(namedPropertyMetadata('en', 'jp-tokyo', 'ae-valia').robots).toEqual({ index: false, follow: true });
  });

  it('keeps the full review on the property page and distinguishes anonymous Tokyo prices', async () => {
    const html = renderToStaticMarkup(await TokyoPropertyPage({ params: Promise.resolve({ profileId: 'jp-park-city-toyosu' }) }));
    expect(html).toContain('data-named-property-detail="jp-park-city-toyosu"');
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html.match(/id="property-review"/g)).toHaveLength(1);
    expect(html).toContain('Getting around');
    expect(html).toContain('Schools &amp; daily life');
    expect(html).toContain('MLIT publishes transactions without building names.');
    expect(html).toMatch(/\/jp\/tokyo\/explore\/?\?city=13108/);
    expect(html).not.toMatch(/[\uac00-\ud7af]/u);
    expect(html).not.toMatch(/href="https?:\/\/[^"]*(?:suumo|homes\.co\.jp|srx\.com|propertyguru|propertyfinder|hogangnono)/i);
    expect(html).not.toContain('href="/living/');
    expect(html).toMatch(/hrefLang="ko"[^>]*href="\/ko\/jp\/tokyo\/explore\/properties\/jp-park-city-toyosu\/?"/);
  });

  it('keeps Skyflame project-group identity separate from an unverified Tower 1 aggregate', () => {
    const profile = namedPropertyProfile('ae-dubai', 'ae-skyflame-1')!;
    const html = renderToStaticMarkup(<PropertyReviewDetailPage profile={profile} />);
    expect(html).toContain('Tower 1 to DLD registration mapping is unverified');
    expect(html).not.toContain('Project transaction summary');
    expect(html).toContain('Dubai transactions &amp; map');
    expect(html).not.toContain('area=majan');
  });

  it('retains the exact Dubai project selection when continuing to transaction evidence', () => {
    const profile = namedPropertyProfile('ae-dubai', 'ae-skyterraces')!;
    const html = renderToStaticMarkup(<PropertyReviewDetailPage profile={profile} locale="ko" />);
    expect(html).toMatch(/\/ko\/ae\/dubai\/explore\/?\?stage=off-plan&amp;area=al-hebiah-first&amp;project=4327-apartment-off-plan/);
    expect(html).toContain('이 프로젝트의 거래 요약');
    expect(html).toContain('단지 분석');
  });

  it('keeps completed projects in the Ready cohort', () => {
    const profile = namedPropertyProfile('ae-dubai', 'ae-skyterraces')!;
    const currentLocation = locations.reviewLocation;
    const selected = currentLocation(profile.id)!;
    const lookup = vi.spyOn(locations, 'reviewLocation').mockImplementation(id => id === profile.id
      ? { ...selected, projectId: '2372-apartment-ready', areaSlug: 'business-bay' }
      : currentLocation(id));
    try {
      const html = renderToStaticMarkup(<PropertyReviewDetailPage profile={profile} />);
      expect(html).toContain('Dubai · Completed property');
      expect(html).toMatch(/stage=ready&amp;area=business-bay&amp;project=2372-apartment-ready/);
      expect(html).not.toContain('Dubai · Off-plan project');
    } finally { lookup.mockRestore(); }
  });

  it('passes lightweight identities to Explore and searches names across locales', () => {
    const entries = propertyReviewDirectoryEntries('jp-tokyo');
    for (const entry of entries) expect(Object.keys(entry).sort()).toEqual(['area', 'id', 'marketId', 'name']);
    const html = renderToStaticMarkup(<PropertyReviewDirectory locale="ko" entries={entries} query="Brillia" />);
    expect(html).toContain(actualDetailHref('ko', 'jp-brillia-towers-meguro')!.replace(/\/$/, ''));
    expect(html).not.toContain(actualDetailHref('ko', 'jp-park-city-toyosu')!.replace(/\/$/, ''));
    expect(html).not.toContain('/living/');
    expect(renderToStaticMarkup(<PropertyReviewDirectory locale="en" entries={entries} query="unknown property" />)).toBe('');
  });
});
