import { createHash } from 'node:crypto';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { DubaiExplorer } from '../components/dubai/dubai-explorer';
import { DubaiOverview } from '../components/dubai/dubai-overview';
import { DubaiGuide } from '../components/dubai/dubai-guide';
import {
  buildDubaiExploreHref,
  filterDubaiExploreResults,
} from '../lib/dubai/explore-model';
import { createDubaiEvidenceRepository, dubaiEvidenceRepositoryFromEnvironment } from '../lib/dubai/evidence-repository.server';
import { DUBAI_ANNUAL_TRANSACTIONS, filterDubaiAreas } from '../lib/dubai/research';
import { buildDubaiExploreModel } from '../lib/dubai/route-model.server';
import { resolveNewsroomFilters } from '../components/newsroom/newsroom-index';
import { dubaiEvidenceFixture } from './dubai-evidence-fixture';

async function readyExploreModel() {
  const source = JSON.stringify(dubaiEvidenceFixture());
  return buildDubaiExploreModel(await createDubaiEvidenceRepository({
    serialized: source,
    expectedDigest: createHash('sha256').update(source).digest('hex'),
  }));
}

describe('Dubai research release', () => {
  it('installs the 46-area public aggregate for Explore, area pages, and Check', () => {
    const repository = dubaiEvidenceRepositoryFromEnvironment();
    expect(repository).not.toBeNull();
    expect(repository?.listAreas()).toHaveLength(46);
    expect(repository?.listAreaRouteParams()).toHaveLength(46);
    expect(buildDubaiExploreModel(repository)).toMatchObject({ status: 'ready' });
  });
  it('keeps annual values comparable and quarter figures separately labelled', () => {
    expect(DUBAI_ANNUAL_TRANSACTIONS.map((row) => row.year)).toEqual(['2024', '2025']);
    const html = renderToStaticMarkup(<DubaiOverview />);
    expect(html).toContain('Q1 2026'); expect(html).toContain('not residential sale-price indices');
    expect(html).toContain('AED 761B'); expect(html).toContain('AED 917B');
  });
  it('searches actual curated area names and keeps empty matches empty', () => {
    expect(filterDubaiAreas(' marina ').map((area) => area.id)).toEqual(['dubai-marina']);
    expect(filterDubaiAreas('unavailable tower')).toEqual([]);
    const html = renderToStaticMarkup(<DubaiExplorer browserKey={null} initialArea="dubai-marina" />);
    expect(html).toContain('Official neighbourhood guide'); expect(html).toContain('not individual buildings');
    expect(html).not.toContain('SGD'); expect(html).not.toContain('KRW');
  });
  it('renders released area evidence in the existing Explore shell', async () => {
    const html = renderToStaticMarkup(<DubaiExplorer
      browserKey={null}
      model={await readyExploreModel()}
      initialArea="marsa-dubai"
    />);

    for (const label of [
      'Ready', 'Off-Plan', 'Apartment', 'Median sale price', 'Median AED/m²',
      'Registered sales', 'Median annual rent', 'Estimated gross rent-to-price ratio',
      'AED 1,500,000', 'AED 20,000/m²', 'AED 90,000/year',
    ]) expect(html).toContain(label);
    expect(html).toContain('data-dubai-evidence="ready"');
    expect(html).toContain('href="/ae/dubai/explore/marsa-dubai"');
    expect(html).not.toMatch(/individual building|available listing|SGD|KRW/iu);
  });
  it('filters released areas by search, stage, budget, and Ready gross ratio', async () => {
    const model = await readyExploreModel();
    if (model.status !== 'ready') throw new Error('missing fixture evidence');
    const marina = model.areas[0]!;
    const offPlan = { ...marina.segments[0]!.sales.ready!, medianPriceAed: 1_300_000 };
    const businessBay = {
      ...marina,
      id: 'ae-dubai:area:business-bay',
      slug: 'business-bay',
      name: 'Business Bay',
      searchAliases: ['Business Bay'],
      href: '/ae/dubai/explore/business-bay/' as const,
      segments: [{
        ...marina.segments[0]!,
        sales: { ready: { ...marina.segments[0]!.sales.ready!, medianPriceAed: 1_200_000 }, offPlan },
        readyGrossYieldPct: 7,
      }],
    };
    const areas = [marina, businessBay];

    expect(filterDubaiExploreResults(areas, {
      query: 'bay', housing: 'apartment', stage: 'ready',
      budgetMaximumAed: 1_500_000, yieldMinimumPct: 6.5,
    }).map(({ area }) => area.slug)).toEqual(['business-bay']);
    expect(filterDubaiExploreResults(areas, {
      query: '', housing: 'apartment', stage: 'off-plan',
      budgetMaximumAed: 1_500_000, yieldMinimumPct: null,
    }).map(({ area }) => area.slug)).toEqual(['business-bay']);
  });
  it('serializes only active Dubai Explore filters in a stable order', () => {
    expect(buildDubaiExploreHref({
      query: '  marina ', housing: 'villa', stage: 'off-plan',
      budgetMaximumAed: 1_500_000, yieldMinimumPct: null, page: 2,
      selectedArea: 'marsa-dubai',
    })).toBe('/ae/dubai/explore/?q=marina&housing=villa&stage=off-plan&budgetMax=1500000&page=2&area=marsa-dubai');
  });
  it('starts AED assumptions empty and enables the Dubai news filter', () => {
    const html = renderToStaticMarkup(<DubaiGuide />);
    expect(html).toContain('data-property-scenario="AED"');
    expect(html).toContain('value=""'); expect(html).not.toContain('value="2000000"');
    expect(resolveNewsroomFilters({market: 'dubai'}).market).toBe('dubai');
  });
});
