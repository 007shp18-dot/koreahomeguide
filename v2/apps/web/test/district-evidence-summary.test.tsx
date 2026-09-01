import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/kr/seoul/explore/jung-gu/',
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { DistrictEvidenceSummary } from '../components/public-market/district-evidence-summary';
import {
  buildPublicAreaExploreModel,
  buildPublicDistrictModel,
} from '../lib/public-market/area-route-model.server';
import {
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaV1Fixture,
  createPublicAreaV2Fixture,
} from './public-area-fixture';

describe('district evidence summary', () => {
  it('renders selectable All, New and Renewal evidence plus unknown disclosure from v2', () => {
    const route = buildPublicAreaExploreModel('jung-gu', {
      source: createPublicAreaV2Fixture(),
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    }, 'new');
    if (route.status !== 'ready') throw new Error('Expected ready Explore fixture.');
    const model = route.districts.find(({ slug }) => slug === 'jung-gu');
    if (model === undefined) throw new Error('Expected Jung-gu fixture.');

    const html = renderToStaticMarkup(<DistrictEvidenceSummary
      model={model.contractEvidence}
      mode="compact"
    />);

    expect(html).toContain('data-district-summary="published"');
    expect(html).toContain('data-summary-mode="compact"');
    expect(html).toContain('Jung-gu');
    expect(html).toContain('중구');
    expect(html).toContain('data-contract-group="all"');
    expect(html).toContain('data-contract-group="new"');
    expect(html).toContain('data-contract-group="renewal"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('New contracts');
    expect(html).toContain('₩90,000,000');
    expect(html).toContain('₩80,000,000–₩100,000,000');
    expect(html).toContain('₩70,000,000–₩110,000,000');
    expect(html).toContain('5 reported contracts');
    expect(html).toContain('Contract type unknown · 1');
    expect(html).toContain('data-contract-comparison="new-renewal-all"');
    expect((html.match(/data-contract-comparison-row=/g) ?? [])).toHaveLength(3);
    expect(html).toContain('data-contract-comparison-row="new"');
    expect(html).toContain('data-contract-comparison-row="renewal"');
    expect(html).toContain('data-contract-comparison-row="all"');
    expect(html).not.toContain('Combined All is lower than New in this snapshot.');
    expect(html).toContain(PUBLIC_AREA_FIXTURE_PERIOD);
    expect(html).toContain('href="/kr/seoul/explore/jung-gu?contract=new"');
    expect(html).not.toMatch(/Community|Save/i);
  });

  it('states that combined All is lower only when the published medians prove it', () => {
    const source = createPublicAreaV2Fixture();
    const all = source.groups.all.districtSummaries[1];
    if (!all?.published) throw new Error('Expected published Jung-gu All fixture.');
    source.groups.all.districtSummaries[1] = {
      ...all,
      min: 60_000_000,
      p25: 70_000_000,
      med: 80_000_000,
      p75: 90_000_000,
      max: 100_000_000,
    };
    const route = buildPublicAreaExploreModel('jung-gu', {
      source,
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    });
    if (route.status !== 'ready') throw new Error('Expected ready Explore fixture.');
    const district = route.districts.find(({ slug }) => slug === 'jung-gu');
    if (district === undefined) throw new Error('Expected Jung-gu fixture.');

    const html = renderToStaticMarkup(<DistrictEvidenceSummary
      model={district.contractEvidence}
      mode="compact"
    />);

    expect(html).toContain('Combined All is lower than New in this snapshot.');
  });

  it('keeps an independently withheld renewal split money-free and selectable', () => {
    const source = createPublicAreaV2Fixture();
    source.groups.renewal.districtSummaries[1] = {
      marketId: 'kr-seoul',
      area: 'jung-gu',
      parent: 'seoul',
      deal: 'jeonse',
      band: '45-55sqm',
      period: PUBLIC_AREA_FIXTURE_PERIOD,
      n: 4,
      published: false,
    };
    source.groups.renewal.citySummary.n = 124;
    source.unknownContractCounts.city = 26;
    source.unknownContractCounts.districts[1] = 2;
    const route = buildPublicAreaExploreModel('jung-gu', {
      source,
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    }, 'renewal');
    if (route.status !== 'ready') throw new Error('Expected ready Explore fixture.');
    const model = route.districts.find(({ slug }) => slug === 'jung-gu');
    if (model === undefined) throw new Error('Expected Jung-gu fixture.');

    const html = renderToStaticMarkup(<DistrictEvidenceSummary
      model={model.contractEvidence}
      mode="compact"
    />);

    expect(html).toContain('data-district-summary="withheld"');
    expect(html).toContain('Renewal contracts');
    expect(html).toContain('4 reported contracts');
    expect(html).toContain('At least 5 are required');
    expect(html).toContain('Contract type unknown · 2');
    expect(html).not.toContain('data-summary-median');
    expect(html).toContain('data-contract-comparison-row="renewal"');
    expect(html).toContain('Not published');
    expect(html).toContain('₩90,000,000');
  });

  it('keeps v1 combined evidence visible and explains unavailable split controls', () => {
    const route = buildPublicAreaExploreModel('jung-gu', {
      source: createPublicAreaV1Fixture(),
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    }, 'renewal');
    if (route.status !== 'ready') throw new Error('Expected ready Explore fixture.');
    const model = route.districts.find(({ slug }) => slug === 'jung-gu');
    if (model === undefined) throw new Error('Expected Jung-gu fixture.');

    const html = renderToStaticMarkup(<DistrictEvidenceSummary
      model={model.contractEvidence}
      mode="compact"
    />);

    expect(html).toContain('data-contract-comparison-row="all"');
    expect(html).toContain('₩110,000,000');
    expect(html).toContain('New/renewal split not available in this snapshot');
    expect(html).toContain('data-contract-group="new"');
    expect(html).toContain('data-contract-group="renewal"');
    expect((html.match(/disabled=""/g) ?? [])).toHaveLength(2);
    expect((html.match(/data-contract-comparison-row=/g) ?? [])).toHaveLength(3);
    expect(html).toContain('Snapshot unavailable');
    expect(html).not.toContain('Contract type unknown ·');
  });

  it('renders an unavailable district summary without hidden monetary output', () => {
    const route = buildPublicDistrictModel('jung-gu', {
      source: { invalid: true },
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    });
    if (route === null) throw new Error('Expected known district identity.');

    const html = renderToStaticMarkup(<DistrictEvidenceSummary
      model={route.contractEvidence}
      mode="full"
    />);

    expect(html).toContain('data-district-summary="unavailable"');
    expect(html).toContain('Verified district summary unavailable');
    expect(html).toContain('No district figure is substituted when the verified artifact is unavailable.');
    expect(html).toContain('Return to Explore and choose another district.');
    expect(html).not.toContain('₩');
    expect(html).not.toMatch(/data-summary-median|data-summary-range/);
  });
});
