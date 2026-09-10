import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { SingaporeCheckWorkspace } from '../components/singapore/singapore-check-workspace';
import { SingaporeRankings } from '../components/singapore/singapore-rankings';
import { buildSingaporeExploreHref, parseSingaporeExploreSearchParams } from '../components/singapore/singapore-explorer';
import { marketHref } from '../lib/locale/market-localization';
import { sgText, singaporeMetadata } from '../lib/locale/singapore-copy';
import { indexableMetadata } from '../lib/public-metadata';
import type { SingaporeCheckRouteModel } from '../lib/singapore/check-route-model.server';
import { buildSingaporeRankingsModel } from '../lib/public-market/rankings-route-model.server';

const catalog = { available: true, months: ['2026-08'], segments: ['CCR'], projects: [{ id: 'project-a', label: 'THE ORIGINAL PROJECT' }], districts: ['09'], propertyTypes: ['Condominium'], floorRanges: ['06-10'], saleTypes: ['Resale'], towns: [], blocks: [], flatTypes: [], storeyRanges: [] } as const;
const model: SingaporeCheckRouteModel = { mode: 'compare', catalogs: { 'ura-private-sale': catalog, 'hdb-resale': catalog, 'hdb-rent': catalog }, drafts: { a: { market: 'ura-private-sale' }, b: { market: 'hdb-rent' } }, result: { kind: 'empty' } };

describe('Singapore Korean functional surfaces', () => {
  it('localizes social metadata as well as the Singapore page title', () => {
    const metadata = singaporeMetadata(indexableMetadata({ path: '/ko/sg/singapore/explore/', title: 'Singapore', description: 'Singapore prices' }));
    expect(metadata.openGraph).toMatchObject({ locale: 'ko_KR', images: ['https://www.signedprice.com/og/ko/'], alternateLocale: ['en_US'] });
    expect(metadata.twitter).toMatchObject({ images: ['https://www.signedprice.com/og/ko/'] });
    expect(metadata.alternates?.languages).toMatchObject({ 'x-default': 'https://www.signedprice.com/sg/singapore/explore/' });
  });
  it('localizes the comparison form while preserving submitted IDs and source values', () => {
    // Large project catalogs hydrate on the client; the selected project's
    // original label and submitted ID must already be present in server HTML.
    const selectedModel = { ...model, drafts: { ...model.drafts, a: { ...model.drafts.a, project: 'project-a' } } };
    const html = renderToStaticMarkup(<SingaporeCheckWorkspace locale="ko" model={selectedModel} />);
    expect(html).toContain('매물 가격 비교');
    expect(html).toMatch(/action="\/ko\/sg\/singapore\/check\/?"/);
    expect(html).toContain('매물 비교');
    expect(html).toContain('name="a-project"');
    expect(html).toContain('value="project-a"');
    expect(html).toContain('THE ORIGINAL PROJECT');
    expect(html).toContain('value="Condominium"');
    expect(html).toContain('콘도미니엄');
    expect(html).toContain('name="b-market"');
    expect(html).toContain('value="hdb-rent"');
    expect(JSON.stringify(model)).toContain('Condominium');
    expect(renderToStaticMarkup(<SingaporeCheckWorkspace model={model} />)).toContain('Compare an asking price');
  });
  it('keeps explorer selection and query parameters intact in Korean URLs', () => {
    const state = parseSingaporeExploreSearchParams(new URLSearchParams('q=Original&region=ccr&district=09&sort=name&page=2&project=project-a'));
    const en = buildSingaporeExploreHref(state);
    expect(marketHref('ko', en)).toBe(`/ko${en}`);
    expect(parseSingaporeExploreSearchParams(new URL(marketHref('ko', en), 'https://www.signedprice.com').searchParams)).toEqual(state);
  });
  it('renders ranking labels and localized links without converting numbers or property names', () => {
    const ranking = buildSingaporeRankingsModel([{ id: 'project-a', name: 'THE ORIGINAL PROJECT', street: 'ORIGINAL ROAD', segment: 'CCR', district: '09', sample: 7, medianPriceSgd: 300000, medianPsf: 1900, href: '/sg/singapore/explore/ccr/project-a/' }], 'price', 1);
    const html = renderToStaticMarkup(<SingaporeRankings locale="ko" periodLabel="Jun 2026–Aug 2026" model={ranking} />);
    expect(html).toContain('단지별 신고 자료를 비교하세요.');
    expect(html).toContain('THE ORIGINAL PROJECT');
    expect(html).toContain('300,000');
    expect(html).toContain('href="/ko/sg/singapore/explore/ccr/project-a"');
    expect(html).not.toContain('Compare reported project evidence.');
  });
  it('translates evidence boundaries and preserves canonical language pairs', () => {
    expect(sgText('ko', '12 reported sale transactions')).toBe('신고 매매 12건');
    expect(sgText('ko', 'Jun 2026–Aug 2026')).toBe('2026년 6월–2026년 8월');
    expect(sgText('en', 'Selected project')).toBe('Selected project');
    const metadata = singaporeMetadata({
      title: 'Singapore Check | signedprice',
      description: 'Compare one Singapore offer.',
      alternates: {
        canonical: 'https://www.signedprice.com/ko/sg/singapore/check/',
      },
      robots: { index: false, follow: false },
    });
    expect(metadata.alternates?.languages).toEqual({
      en: 'https://www.signedprice.com/sg/singapore/check/',
      ko: 'https://www.signedprice.com/ko/sg/singapore/check/',
      'x-default': 'https://www.signedprice.com/sg/singapore/check/',
    });
    expect(metadata.openGraph).toMatchObject({
      locale: 'ko_KR',
      images: ['https://www.signedprice.com/og/ko/'],
    });
    expect(metadata.twitter).toMatchObject({
      images: ['https://www.signedprice.com/og/ko/'],
    });
    expect(metadata.title).toBe('싱가포르 매물 가격 비교 | signedprice');
  });
});


describe('Singapore public project identity handoff', () => {
  it('retains the real namespaced project ID in a shared map URL', () => {
    const id = 'sg-singapore:project-123';
    const parsed = parseSingaporeExploreSearchParams(new URLSearchParams({ region: 'ccr', project: id }));
    expect(parsed.selectedProjectId).toBe(id);
    expect(new URL(buildSingaporeExploreHref(parsed), 'https://signedprice.com').searchParams.get('project')).toBe(id);
  });
});
