import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/kr/seoul/explore/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('next/script', () => ({
  default: ({ src }: Readonly<{ src: string }>) => createElement('script', { src }),
}));

import {
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
  MOLIT_SALE_ENDPOINT_VERSION,
  MOLIT_SALE_PARSER_VERSION,
  MOLIT_SALE_RIGHTS_POLICY_ID,
  buildKoreaRentEvidence,
  buildKoreaSaleEvidence,
  type KoreaRentRecord,
  type KoreaSaleRecord,
} from '@signedprice/korea-rent';

import {
  createKoreaEvidenceRepositoryLoader,
  koreaEvidenceRepositoriesFromEnvironment,
} from '../lib/public-market/korea-evidence-repositories.server';
import { AreaExplorer } from '../components/public-market/area-explorer';
import { DistrictRankings } from '../components/public-market/district-rankings';
import {
  buildKoreaExplorerBuildingDetailModel,
  buildKoreaExplorerEvidenceProjection as buildKoreaExplorerEvidenceProjectionBase,
  type KoreaExplorerEvidenceSelectionInput,
  type KoreaExplorerBuildingDetailModel,
} from '../lib/public-market/korea-explorer-evidence.server';
import { buildKoreaEvidenceAreaExploreModel } from '../lib/public-market/korea-explorer-area-route.server';
import { buildKoreaRentEvidenceArtifact } from '../lib/public-market/rent-evidence-artifact-builder.server';
import { buildKoreaSaleEvidenceArtifact } from '../lib/public-market/sale-evidence-artifact-builder.server';
import { buildKoreaEvidenceAreaRankingsModel } from '../lib/public-market/rankings-route-model.server';
import { resolveInstalledSnapshotRegistry } from '../lib/snapshots/installed-snapshot-repository.server';
import type { KoreaEvidenceRepositories } from '../lib/public-market/korea-evidence-repositories.server';

const period = '2026-01/2026-07';
const generatedAt = '2026-08-01T00:00:00.000Z';
const months = [
  '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07',
] as const;

function buildKoreaExplorerEvidenceProjection(
  repositories: KoreaEvidenceRepositories,
  input: KoreaExplorerEvidenceSelectionInput,
) {
  return buildKoreaExplorerEvidenceProjectionBase(repositories, input, {
    includeBuildings: true,
    includeBuildingStats: true,
    districtSlug: 'gangnam-gu',
  });
}

function rentRecord(index: number, transaction: 'jeonse' | 'monthly' = 'jeonse'): KoreaRentRecord {
  return {
    sourceHousingType: 'apartment',
    areaSqm: transaction === 'monthly' ? 60 + index : 35 + index * 15,
    depositWon: transaction === 'monthly'
      ? (index + 1) * 10_000_000
      : (index + 1) * 100_000_000,
    monthlyRentWon: transaction === 'monthly' ? (index + 1) * 100_000 : 0,
    contractDate: `2026-07-${String(index + 1).padStart(2, '0')}`,
    contractType: 'new',
    recordStatus: 'active',
    legalDong: '대치동',
    buildingLabel: '검증아파트',
  };
}

function saleRecord(index: number): KoreaSaleRecord {
  return {
    sourceHousingType: 'apartment',
    areaSqm: 45 + index,
    priceWon: (index + 1) * 200_000_000,
    contractDate: `2026-07-${String(index + 1).padStart(2, '0')}`,
    recordStatus: 'active',
    legalDong: '대치동',
    buildingLabel: '검증아파트',
  };
}

async function fixtures() {
  const rent = await buildKoreaRentEvidenceArtifact(buildKoreaRentEvidence({
    period,
    completedMonths: months,
    generatedAt,
    records: [
      ...Array.from({ length: 5 }, (_, index) => ({
        districtSlug: 'gangnam-gu' as const,
        record: rentRecord(index),
      })),
      ...Array.from({ length: 5 }, (_, index) => ({
        districtSlug: 'gangnam-gu' as const,
        record: rentRecord(index, 'monthly'),
      })),
    ],
  }));
  const sale = await buildKoreaSaleEvidenceArtifact(buildKoreaSaleEvidence({
    period,
    completedMonths: months,
    generatedAt,
    records: Array.from({ length: 5 }, (_, index) => ({
      districtSlug: 'gangnam-gu' as const,
      record: saleRecord(index),
    })),
  }));
  return { rent, sale };
}

function registry(
  input: Awaited<ReturnType<typeof fixtures>>,
  datasets: readonly ('rent' | 'sale')[] = ['rent', 'sale'],
) {
  const snapshots = [];
  if (datasets.includes('rent')) snapshots.push({
    marketId: 'kr-seoul', dataset: 'kr-rent',
    schemaVersion: 'signedprice-korea-rent-evidence-v2',
    sourceVersion: MOLIT_ENDPOINT_VERSION, parserVersion: MOLIT_PARSER_VERSION,
    rightsPolicyId: MOLIT_RIGHTS_POLICY_ID, period, generatedAt,
    objectUrl: 'installed://kr-rent', sha256: input.rent.sha256,
    recordCount: input.rent.recordCount,
  });
  if (datasets.includes('sale')) snapshots.push({
    marketId: 'kr-seoul', dataset: 'kr-sale',
    schemaVersion: 'signedprice-korea-sale-evidence-v1',
    sourceVersion: MOLIT_SALE_ENDPOINT_VERSION, parserVersion: MOLIT_SALE_PARSER_VERSION,
    rightsPolicyId: MOLIT_SALE_RIGHTS_POLICY_ID, period, generatedAt,
    objectUrl: 'installed://kr-sale', sha256: input.sale.sha256,
    recordCount: input.sale.recordCount,
  });
  return { registryVersion: 'signedprice-installed-snapshots-v1', snapshots };
}

function resolver(input: Awaited<ReturnType<typeof fixtures>>) {
  return (objectUrl: string): unknown => ({
    'installed://kr-rent': input.rent.artifact,
    'installed://kr-sale': input.sale.artifact,
  })[objectUrl];
}

describe('installed Korea evidence repositories', () => {
  it('reuses immutable deployment evidence for strict Check requests without reusing it when disabled', () => {
    const first = koreaEvidenceRepositoriesFromEnvironment({
      useCheckedInSnapshot: true, retainLastVerified: false,
    });
    expect(first.rent).not.toBeNull();
    expect(first.sale).not.toBeNull();
    expect(koreaEvidenceRepositoriesFromEnvironment({
      useCheckedInSnapshot: true, retainLastVerified: false,
    })).toBe(first);
    expect(koreaEvidenceRepositoriesFromEnvironment({
      useCheckedInSnapshot: false, retainLastVerified: false,
    })).toEqual({ rent: null, sale: null });
  }, 15_000);
  it('does not resolve checked-in payloads when fixture isolation disables them', () => {
    const repositories = koreaEvidenceRepositoriesFromEnvironment({
      registrySource: resolveInstalledSnapshotRegistry(),
      useCheckedInSnapshot: false,
      retainLastVerified: false,
    });

    expect(repositories).toEqual({ rent: null, sale: null });
  });

  it('serializes only one bounded building page from the installed full inventory', () => {
    const repositories = koreaEvidenceRepositoriesFromEnvironment({
      useCheckedInSnapshot: true,
    });
    expect(koreaEvidenceRepositoriesFromEnvironment({
      useCheckedInSnapshot: true,
    })).toBe(repositories);
    const projection = buildKoreaExplorerEvidenceProjectionBase(repositories, {
      transaction: 'jeonse', areaBand: 'all', housingType: 'all', contractGroup: 'all',
    }, {
      includeBuildings: true,
      includeBuildingStats: true,
      districtSlug: 'gangnam-gu',
    });
    expect(projection.status).toBe('ready');
    if (projection.status !== 'ready' || projection.buildingPage === null) {
      throw new Error('Installed Explore building page must be ready.');
    }
    expect(projection.buildingPage.buildings).toHaveLength(50);
    expect(projection.buildingPage.buildings[0]?.primary.published).toBe(true);
    expect(projection.buildingPage.buildings[0]!.primary.n)
      .toBeGreaterThanOrEqual(projection.buildingPage.buildings[1]!.primary.n);
    expect(projection.buildingPage.total).toBeGreaterThan(50);
    expect(projection.buildingPage.mapGroups!.reduce((sum, group) => sum + group.count, 0)
      + projection.buildingPage.buildings.length).toBe(projection.buildingPage.total);
    expect(projection.buildingPage.neighborhoods!.reduce((sum, item) => sum + item.count, 0))
      .toBe(projection.buildingPage.total);
    expect(projection.buildingPage.neighborhoods!.some(({ count }) => count > 50)).toBe(true);
    expect(projection.buildingStats?.observed).toBeGreaterThan(
      projection.buildingPage.buildings.length,
    );
    const model = buildKoreaEvidenceAreaExploreModel('gangnam-gu', projection);
    expect(model.buildingAvailability).toMatchObject({
      status: 'ready', page: 1, pageSize: 50, total: projection.buildingPage.total,
      mapGroups: projection.buildingPage.mapGroups,
    });
    expect(JSON.stringify(model).length).toBeLessThan(500_000);
  }, 15_000);

  it('filters a selected neighborhood on the server while retaining district-wide counts', () => {
    const repositories = koreaEvidenceRepositoriesFromEnvironment({ useCheckedInSnapshot: true });
    const input = {
      transaction: 'jeonse' as const,
      areaBand: 'all' as const,
      housingType: 'all' as const,
      contractGroup: 'all' as const,
    };
    const district = buildKoreaExplorerEvidenceProjectionBase(repositories, input, {
      includeBuildings: true,
      districtSlug: 'gangnam-gu',
    });
    if (district.status !== 'ready' || district.buildingPage === null) {
      throw new Error('Installed Explore district page must be ready.');
    }
    const neighborhood = district.buildingPage.neighborhoods?.[0];
    if (neighborhood === undefined) throw new Error('A neighborhood count is required.');

    const selected = buildKoreaExplorerEvidenceProjectionBase(repositories, input, {
      includeBuildings: true,
      districtSlug: 'gangnam-gu',
      neighborhoodId: neighborhood.id,
    });
    if (selected.status !== 'ready' || selected.buildingPage === null) {
      throw new Error('Installed Explore neighborhood page must be ready.');
    }

    expect(selected.buildingPage.total).toBe(neighborhood.count);
    expect(selected.buildingPage.buildings.every((building) => (
      building.neighborhoodId === neighborhood.id
    ))).toBe(true);
    expect(selected.buildingPage.neighborhoods).toEqual(district.buildingPage.neighborhoods);
  }, 15_000);

  it('resolves a selected building to its page instead of trusting a stale page number', () => {
    const repositories = koreaEvidenceRepositoriesFromEnvironment({
      useCheckedInSnapshot: true,
    });
    const input = Object.freeze({
      transaction: 'jeonse' as const,
      areaBand: 'all' as const,
      housingType: 'all' as const,
      contractGroup: 'all' as const,
    });
    const secondPage = buildKoreaExplorerEvidenceProjectionBase(repositories, input, {
      includeBuildings: true,
      districtSlug: 'gangnam-gu',
      buildingPage: 2,
    });
    if (secondPage.status !== 'ready' || secondPage.buildingPage === null) {
      throw new Error('Second installed Explore page must be ready.');
    }
    const selectedBuilding = secondPage.buildingPage.buildings[0];
    if (selectedBuilding === undefined) throw new Error('Second page must contain a building.');

    const restored = buildKoreaExplorerEvidenceProjectionBase(repositories, input, {
      includeBuildings: true,
      districtSlug: 'gangnam-gu',
      buildingPage: 1,
      selectedBuildingId: selectedBuilding.buildingId,
    });

    expect(restored.status).toBe('ready');
    if (restored.status !== 'ready' || restored.buildingPage === null) return;
    expect(restored.buildingPage.page).toBe(2);
    expect(restored.buildingPage.buildings.map(({ buildingId }) => buildingId))
      .toContain(selectedBuilding.buildingId);
  }, 15_000);

  it('keeps a URL-selected building beyond the first ten results in the rendered row and card', () => {
    const repositories = koreaEvidenceRepositoriesFromEnvironment({
      useCheckedInSnapshot: true,
    });
    const projection = buildKoreaExplorerEvidenceProjectionBase(repositories, {
      transaction: 'jeonse', areaBand: 'all', housingType: 'all', contractGroup: 'all',
    }, {
      includeBuildings: true,
      includeBuildingStats: true,
      districtSlug: 'gangnam-gu',
    });
    if (projection.status !== 'ready' || projection.buildingPage === null) {
      throw new Error('Installed Explore page must be ready.');
    }
    const selectedBuilding = projection.buildingPage.buildings[24];
    if (selectedBuilding === undefined) throw new Error('Fixture must contain 25 buildings.');
    const model = buildKoreaEvidenceAreaExploreModel('gangnam-gu', projection);
    const html = renderToStaticMarkup(createElement(AreaExplorer, {
      model,
      initialSelection: {
        market: 'kr',
        transaction: 'jeonse',
        district: 'gangnam-gu',
        neighborhood: selectedBuilding.neighborhoodId,
        buildingId: selectedBuilding.buildingId,
      },
    }));

    expect(html).toContain(`data-building-row="${selectedBuilding.buildingId}"`);
    expect(html).toContain(`data-selected-building-card="${selectedBuilding.buildingId}"`);
  }, 15_000);

  it('activates rent and sale independently and exposes exact-cohort lookups', async () => {
    const source = await fixtures();
    const loader = createKoreaEvidenceRepositoryLoader();
    const both = loader.load({ registrySource: registry(source), resolveObject: resolver(source) });
    expect(both.rent?.getAreaRecord('seoul:all').cohorts).toHaveLength(40);
    expect(both.sale?.getAreaRecord('seoul:all').cohorts).toHaveLength(5);
    const rentBuilding = both.rent?.listBuildingRecords()[0];
    const saleBuilding = both.sale?.listBuildingRecords()[0];
    expect(both.rent?.getBuilding('gangnam-gu', rentBuilding!.buildingId)).toBe(rentBuilding);
    expect(both.sale?.getBuilding('gangnam-gu', saleBuilding!.buildingId)).toBe(saleBuilding);

    const rentOnly = createKoreaEvidenceRepositoryLoader().load({
      registrySource: registry(source, ['rent']),
      resolveObject: resolver(source),
    });
    expect(rentOnly.rent).not.toBeNull();
    expect(rentOnly.sale).toBeNull();
  });

  it('reuses verified repositories, building indexes, and cohort stats across SSR requests', async () => {
    const source = await fixtures();
    const loaded = createKoreaEvidenceRepositoryLoader().load({
      registrySource: registry(source), resolveObject: resolver(source),
    });
    if (loaded.rent === null || loaded.sale === null) throw new Error('Fixtures must load.');
    const rentBuildingRecords = vi.fn(() => loaded.rent!.listBuildingRecords());
    const saleBuildingRecords = vi.fn(() => loaded.sale!.listBuildingRecords());
    const repositories: KoreaEvidenceRepositories = Object.freeze({
      rent: Object.freeze({ ...loaded.rent, listBuildingRecords: rentBuildingRecords }),
      sale: Object.freeze({ ...loaded.sale, listBuildingRecords: saleBuildingRecords }),
    });
    const options = Object.freeze({
      includeBuildings: true,
      includeBuildingStats: true,
      districtSlug: 'gangnam-gu',
    });
    const input = Object.freeze({
      transaction: 'jeonse', areaBand: 'all', housingType: 'all', contractGroup: 'all',
    });
    const first = buildKoreaExplorerEvidenceProjectionBase(repositories, input, options);
    const second = buildKoreaExplorerEvidenceProjectionBase(repositories, input, options);

    expect(rentBuildingRecords).toHaveBeenCalledTimes(1);
    expect(saleBuildingRecords).toHaveBeenCalledTimes(1);
    expect(first.status).toBe('ready');
    expect(second.status).toBe('ready');
    if (first.status !== 'ready' || second.status !== 'ready') return;
    expect(second.buildingStats).toBe(first.buildingStats);
  });

  it.each([
    ['digest', { sha256: 'f'.repeat(64) }],
    ['period', { period: '2025-01/2025-07' }],
    ['count', { recordCount: 999 }],
  ] as const)('keeps rent ready when only sale %s verification fails', async (_label, overrides) => {
    const source = await fixtures();
    const modified = registry(source) as { snapshots: Array<Record<string, unknown>> };
    Object.assign(modified.snapshots.find(({ dataset }) => dataset === 'kr-sale')!, overrides);
    const loaded = createKoreaEvidenceRepositoryLoader().load({
      registrySource: modified,
      resolveObject: resolver(source),
    });
    expect(loaded.rent).not.toBeNull();
    expect(loaded.sale).toBeNull();
  });

  it('retains each last-known-good repository when a later activation is malformed', async () => {
    const source = await fixtures();
    const loader = createKoreaEvidenceRepositoryLoader();
    const first = loader.load({ registrySource: registry(source), resolveObject: resolver(source) });
    const second = loader.load({
      registrySource: { registryVersion: 'broken', snapshots: [] },
      resolveObject: () => undefined,
    });
    expect(second.rent).toBe(first.rent);
    expect(second.sale).toBe(first.sale);
  });

  it('projects exact all-area, monthly-rent, and sale cohorts without cross-fallbacks', async () => {
    const source = await fixtures();
    const repositories = createKoreaEvidenceRepositoryLoader().load({
      registrySource: registry(source),
      resolveObject: resolver(source),
    });

    const monthly = buildKoreaExplorerEvidenceProjection(repositories, {
      transaction: 'monthly',
      areaBand: '60-85',
      housingType: 'apartment',
      contractGroup: 'all',
    });
    expect(monthly.status).toBe('ready');
    if (monthly.status !== 'ready') throw new Error('Monthly projection must be ready.');
    expect(monthly.selection).toEqual({
      transaction: 'monthly', areaBand: '60-85', housingType: 'apartment',
      contractGroup: 'all',
    });
    expect(monthly.city.primary).toMatchObject({ published: true, n: 5 });
    expect(monthly.city.filedDeposit).toMatchObject({ published: true, n: 5 });
    expect(monthly.buildingPage?.buildings[0]).toMatchObject({
      transaction: 'monthly', primaryMetric: 'monthly-rent',
    });

    const sale = buildKoreaExplorerEvidenceProjection(repositories, {
      transaction: 'sale', areaBand: 'all', housingType: 'all', contractGroup: 'new',
    });
    expect(sale.status).toBe('ready');
    if (sale.status !== 'ready') throw new Error('Sale projection must be ready.');
    expect(sale.selection.contractGroup).toBe('not-applicable');
    expect(sale.city.primary).toMatchObject({ published: true, n: 5 });
    expect(sale.city.filedDeposit).toBeNull();
    expect(sale.buildingPage?.buildings[0]?.transaction).toBe('sale');

    const rentOnly = createKoreaEvidenceRepositoryLoader().load({
      registrySource: registry(source, ['rent']), resolveObject: resolver(source),
    });
    expect(buildKoreaExplorerEvidenceProjection(rentOnly, {
      transaction: 'sale', areaBand: 'all', housingType: 'all', contractGroup: 'all',
    })).toMatchObject({ status: 'unavailable', availability: { sale: false, jeonse: true, monthly: true } });
  });

  it('bridges a selected exact cohort into the 25-district Explore route model', async () => {
    const source = await fixtures();
    const repositories = createKoreaEvidenceRepositoryLoader().load({
      registrySource: registry(source), resolveObject: resolver(source),
    });
    const projection = buildKoreaExplorerEvidenceProjection(repositories, {
      transaction: 'monthly', areaBand: '60-85', housingType: 'apartment',
      contractGroup: 'all',
    });
    if (projection.status !== 'ready') throw new Error('Projection must be ready.');

    const model = buildKoreaEvidenceAreaExploreModel('gangnam-gu', projection);
    expect(model).toMatchObject({
      status: 'ready', selectedSlug: 'gangnam-gu',
      evidenceSelection: {
        transaction: 'monthly', areaBand: '60-85', housingType: 'apartment',
        contractGroup: 'all',
      },
      transactionAvailability: { jeonse: true, monthly: true, sale: true },
      source: { band: '60–85㎡ · monthly rent' },
      coverage: { eligibleContracts: 5 },
    });
    expect(model.districts).toHaveLength(25);
    expect(model.districts.find(({ slug }) => slug === 'gangnam-gu')).toMatchObject({
      state: 'published', medianLabel: '₩300,000', sampleLabel: '5 reported contracts',
    });
    if (model.status !== 'ready') throw new Error('Explore model must be ready.');
    expect(model.buildingAvailability).toMatchObject({
      status: 'ready',
      buildings: [{
        transaction: 'monthly', primaryMetric: 'monthly-rent',
        filedDepositMedianLabel: '₩30,000,000',
      }],
    });
  });

  it('describes an exact monthly-rent Explore cohort without legacy jeonse copy', async () => {
    const source = await fixtures();
    const repositories = createKoreaEvidenceRepositoryLoader().load({
      registrySource: registry(source), resolveObject: resolver(source),
    });
    const projection = buildKoreaExplorerEvidenceProjection(repositories, {
      transaction: 'monthly', areaBand: '60-85', housingType: 'apartment',
      contractGroup: 'all',
    });
    if (projection.status !== 'ready') throw new Error('Projection must be ready.');
    const model = buildKoreaEvidenceAreaExploreModel('gangnam-gu', projection);
    const html = renderToStaticMarkup(createElement(AreaExplorer, {
      model,
      initialSelection: {
        market: 'kr', transaction: 'monthly', area: '60-85',
        propertyType: 'apartment', district: 'gangnam-gu',
      },
    }));

    expect(html).toContain('>Explore</h1>');
    expect(html).toContain('Median reported monthly rent');
    expect(html).toContain('Reported monthly-rent contracts; filed deposit is shown separately.');
    expect(html).not.toContain('45–55㎡');
    expect(html).not.toContain('Refundable zero-rent jeonse');
  });

  it('keeps sale Explore free of rental contract-group controls', async () => {
    const source = await fixtures();
    const repositories = createKoreaEvidenceRepositoryLoader().load({
      registrySource: registry(source), resolveObject: resolver(source),
    });
    const projection = buildKoreaExplorerEvidenceProjection(repositories, {
      transaction: 'sale', areaBand: 'all', housingType: 'apartment',
      contractGroup: 'new',
    });
    if (projection.status !== 'ready') throw new Error('Projection must be ready.');
    const model = buildKoreaEvidenceAreaExploreModel('gangnam-gu', projection);
    const html = renderToStaticMarkup(createElement(AreaExplorer, {
      model,
      initialSelection: {
        market: 'kr', transaction: 'sale', area: 'all',
        propertyType: 'apartment', district: 'gangnam-gu',
      },
    }));

    expect(html).toContain('>Explore</h1>');
    expect(html).toContain('MOLIT reported sale contracts');
    expect(html).not.toContain('data-contract-group=');
    expect(html).not.toContain('New, renewal and combined');
    expect(html).not.toContain('contractType=');
    const building = projection.buildingPage?.buildings[0];
    if (building === undefined) throw new Error('Sale Explore must include a building.');
    expect(repositories.rent?.getBuilding('gangnam-gu', building.buildingId)).toBeDefined();
    const encodedHref = html.match(new RegExp(`href="([^"]*${building.buildingId}[^"]*)"`))?.[1];
    if (encodedHref === undefined) throw new Error('Sale Explore must link to its building Detail.');
    const detailUrl = new URL(encodedHref.replaceAll('&amp;', '&'), 'https://signedprice.invalid');
    expect(detailUrl.searchParams.get('transaction')).toBe('sale');
    const detail = buildKoreaExplorerBuildingDetailModel(repositories, 'gangnam-gu', building.buildingId, {
      transaction: detailUrl.searchParams.get('transaction') as 'sale',
      areaBand: 'all', housingType: 'apartment', contractGroup: 'all',
    });
    expect(detail).toMatchObject({ selection: { transaction: 'sale' }, evidence: { primaryMetric: 'sale-price' } });
    expect(html).toContain(`data-building-save="gangnam-gu/${building.buildingId}"`);
  });

  it('builds sale rankings from the selected exact evidence cohort', async () => {
    const source = await fixtures();
    const repositories = createKoreaEvidenceRepositoryLoader().load({
      registrySource: registry(source), resolveObject: resolver(source),
    });
    const projection = buildKoreaExplorerEvidenceProjection(repositories, {
      transaction: 'sale', areaBand: 'all', housingType: 'apartment',
      contractGroup: 'all',
    });
    if (projection.status !== 'ready') throw new Error('Projection must be ready.');
    const rankingModule = await import('../lib/public-market/rankings-route-model.server');
    const candidate = (rankingModule as unknown as Readonly<Record<string, unknown>>)
      .buildKoreaEvidenceAreaRankingsModel;
    const model = typeof candidate === 'function'
      ? (candidate as (...args: readonly unknown[]) => unknown)(
          projection,
          '2026-09-01T00:00:00.000Z',
        )
      : null;

    expect(model).toMatchObject({
      status: 'ready',
      evidenceSelection: {
        transaction: 'sale', areaBand: 'all', housingType: 'apartment',
        contractGroup: 'not-applicable',
      },
      transactionAvailability: { sale: true, jeonse: true, monthly: true },
      median: [{
        slug: 'gangnam-gu',
        valueLabel: '₩600,000,000',
        href: '/kr/seoul/explore/gangnam-gu/?area=all&propertyType=apartment&district=gangnam-gu',
      }],
      sample: [{ slug: 'gangnam-gu', valueLabel: '5' }],
      withheldDistrictCount: 24,
      source: { band: 'All filed areas · sale' },
    });
  });

  it('renders exact ranking filters and sale-specific metric copy', async () => {
    const source = await fixtures();
    const repositories = createKoreaEvidenceRepositoryLoader().load({
      registrySource: registry(source), resolveObject: resolver(source),
    });
    const projection = buildKoreaExplorerEvidenceProjection(repositories, {
      transaction: 'sale', areaBand: 'all', housingType: 'apartment',
      contractGroup: 'all',
    });
    if (projection.status !== 'ready') throw new Error('Projection must be ready.');
    const rankedBuilding = repositories.sale?.listBuildingRecords()[0];
    if (rankedBuilding === undefined) throw new Error('Sale building fixture must exist.');
    const model = buildKoreaEvidenceAreaRankingsModel(
      projection,
      '2026-09-01T00:00:00.000Z',
      1,
      20,
      repositories,
    );
    const html = renderToStaticMarkup(createElement(DistrictRankings, { model }));
    const koreanHtml = renderToStaticMarkup(createElement(DistrictRankings, { model, locale: 'ko' }));

    expect(html).toContain('data-ranking-filters="exact-cohort"');
    expect(html).toContain('name="transaction"');
    expect(html).toContain('name="area"');
    expect(html).toContain('value="all"');
    expect(html).toContain('name="propertyType"');
    expect(html).toContain('Median reported sale price');
    expect(html).toContain('MOLIT reported sale contracts');
    expect(html).toContain('>Seoul building price rankings</h1>');
    expect(html).toContain('data-building-ranking-row=');
    expect(html).toContain('검증아파트');
    expect(html).toContain('Daechi-dong');
    expect(html).toContain('5 reported sales');
    expect(html).toContain(`/kr/seoul/explore/gangnam-gu/${rankedBuilding.buildingId}?transaction=sale&amp;area=all&amp;propertyType=apartment`);
    expect(html).not.toContain('45–55㎡');
    expect(html).not.toContain('zero-rent jeonse');
    expect(koreanHtml).toContain('>서울 건물 가격 순위</h1>');
    expect(koreanHtml).toContain('data-building-ranking-row=');
    expect(koreanHtml).toContain(`/ko/kr/seoul/explore/gangnam-gu/${rankedBuilding.buildingId}?transaction=sale&amp;area=all&amp;propertyType=apartment`);
  });

  it('shows published building rows for the default checked-in ranking filters', async () => {
    const repositories = koreaEvidenceRepositoriesFromEnvironment({
      useCheckedInSnapshot: true,
      retainLastVerified: false,
    });
    const pageModule = await import('../app/(en)/kr/seoul/rankings/page');
    const model = pageModule.resolveKoreaRankingsPageModel(
      {},
      repositories,
      '2026-09-01T00:00:00.000Z',
    );

    expect(model.status).toBe('ready');
    if (model.status !== 'ready') return;
    expect(model.evidenceSelection).toMatchObject({
      transaction: 'sale', areaBand: 'all', housingType: 'all',
    });
    expect(model.buildingRankings.status).toBe('ready');
    if (model.buildingRankings.status !== 'ready') return;
    expect(model.buildingRankings.rows.length).toBeGreaterThan(0);
    const html = renderToStaticMarkup(createElement(DistrictRankings, { model }));
    expect(html).toContain('>Seoul building price rankings</h1>');
    expect(html).toContain('data-building-ranking-row=');

    const independentlyPaged = pageModule.resolveKoreaRankingsPageModel(
      { page: '2', buildingPage: '2' },
      repositories,
      '2026-09-01T00:00:00.000Z',
    );
    expect(independentlyPaged.status).toBe('ready');
    if (independentlyPaged.status !== 'ready') return;
    expect(independentlyPaged.pagination.page).toBe(2);
    expect(independentlyPaged.buildingRankings.status).toBe('ready');
    if (independentlyPaged.buildingRankings.status !== 'ready') return;
    expect(independentlyPaged.buildingRankings.pagination.page).toBe(2);
  }, 15_000);

  it('resolves ranking search parameters to the exact installed cohort', async () => {
    const source = await fixtures();
    const repositories = createKoreaEvidenceRepositoryLoader().load({
      registrySource: registry(source), resolveObject: resolver(source),
    });
    const pageModule = await import('../app/(en)/kr/seoul/rankings/page');
    const candidate = (pageModule as unknown as Readonly<Record<string, unknown>>)
      .resolveKoreaRankingsPageModel;
    const model = typeof candidate === 'function'
      ? (candidate as (...args: readonly unknown[]) => unknown)(
          {
            transaction: 'sale', area: 'all', propertyType: 'apartment',
            contractType: 'renewal',
          },
          repositories,
          '2026-09-01T00:00:00.000Z',
        )
      : null;

    expect(model).toMatchObject({
      status: 'ready',
      evidenceSelection: {
        transaction: 'sale', areaBand: 'all', housingType: 'apartment',
        contractGroup: 'not-applicable',
      },
      median: [{ slug: 'gangnam-gu', valueLabel: '₩600,000,000' }],
    });
  });

  it('builds a building detail from the selected monthly-rent area cohort', async () => {
    const source = await fixtures();
    const repositories = createKoreaEvidenceRepositoryLoader().load({
      registrySource: registry(source), resolveObject: resolver(source),
    });
    const buildingId = repositories.rent?.listBuildingRecords()[0]?.buildingId;
    if (buildingId === undefined) throw new Error('Fixture building must exist.');
    const model = buildKoreaExplorerBuildingDetailModel(
      repositories,
      'gangnam-gu',
      buildingId,
      {
        transaction: 'monthly', areaBand: '60-85',
        housingType: 'apartment', contractGroup: 'all',
      },
    );

    expect(model).toMatchObject({
      status: 'ready',
      period,
      building: {
        buildingId,
        officialName: '검증아파트',
        neighborhoodName: '대치동',
        housingType: 'apartment',
      },
      selection: {
        transaction: 'monthly', areaBand: '60-85', contractGroup: 'all',
      },
      evidence: {
        state: 'published',
        primaryMetric: 'monthly-rent',
        sampleLabel: '5 reported contracts',
        medianWon: 300_000,
        medianLabel: '₩300,000',
        filedDepositMedianWon: 30_000_000,
        filedDepositMedianLabel: '₩30,000,000',
      },
    });
    expect(model?.sizeCohorts).toContainEqual({ group: 'Apartment · Monthly rent · All contracts', size: '60–85 m²', count: 5, median: 300_000 });
    expect(model?.sizeCohorts).toContainEqual({ group: 'Apartment · Monthly rent · All contracts', size: 'Under 40 m²', count: 0, median: null });
    const recent = (model as Readonly<{ recentTransactions: readonly unknown[] }>).recentTransactions;
    expect(recent).toHaveLength(5);
    expect(recent[0]).toMatchObject({
      transaction: 'monthly',
      primaryLabel: expect.stringMatching(/^₩/),
      filedDepositLabel: expect.stringMatching(/^₩/),
    });
  });

  it('renders exact monthly evidence without the retired 45–55㎡ boundary', async () => {
    const source = await fixtures();
    const repositories = createKoreaEvidenceRepositoryLoader().load({
      registrySource: registry(source), resolveObject: resolver(source),
    });
    const buildingId = repositories.rent?.listBuildingRecords()[0]?.buildingId;
    if (buildingId === undefined) throw new Error('Fixture building must exist.');
    const model = buildKoreaExplorerBuildingDetailModel(
      repositories,
      'gangnam-gu',
      buildingId,
      {
        transaction: 'monthly', areaBand: '60-85',
        housingType: 'apartment', contractGroup: 'all',
      },
    );
    if (model === null) throw new Error('Exact building detail must be ready.');
    const detailModule = await import('../components/public-market/observed-building-detail');
    const candidate = (detailModule as unknown as Readonly<Record<string, unknown>>)
      .KoreaEvidenceBuildingDetail;
    const html = typeof candidate === 'function'
      ? renderToStaticMarkup(createElement(
          candidate as ComponentType<Readonly<{
            model: KoreaExplorerBuildingDetailModel;
            backHref: string;
          }>>,
          {
            model,
            backHref: '/kr/seoul/explore?transaction=monthly&area=60-85&district=gangnam-gu',
          },
        ))
      : '';

    expect(html).toContain('data-building-detail="exact-evidence"');
    const summaryHtml = html.slice(html.indexOf('data-building-summary="true"'), html.indexOf('data-detail-order="media"'));
    expect(summaryHtml.match(/₩300K/g)).toHaveLength(1);
    expect(summaryHtml).toContain(model.period);
    expect(summaryHtml).not.toContain('Median price per m²');
    expect(summaryHtml).toContain('₩300K /month');
    expect(html).toContain('Price / m² /month');
    const koreanHtml = renderToStaticMarkup(createElement(detailModule.KoreaEvidenceBuildingDetail, {
      model: { ...model, recentTransactions: model.recentTransactions.map((row, index) => ({ ...row, contractType: index % 2 ? 'renewal' : 'new' })) },
      backHref: '/ko/kr/seoul/explore/?transaction=monthly', locale: 'ko',
    }));
    expect(koreanHtml).toContain('<td>신규</td>');
    expect(koreanHtml).toContain('<td>갱신</td>');
    expect(koreanHtml).toContain('㎡당 금액 /월');
    expect(html).toContain('검증아파트');
    expect(html).toContain('Monthly rent');
    expect(html).toContain('60–85㎡');
    expect(html).toContain('₩300,000');
    expect(summaryHtml).toContain('Deposit median');
    expect(html).toContain('₩30,000,000');
    expect(html).toContain('5 reported contracts');
    expect(html).toContain('href="/kr/seoul/explore?transaction=monthly&amp;area=60-85&amp;district=gangnam-gu"');
    expect(html).toContain('href="/kr/seoul/check?market=kr-seoul');
    expect(html).toContain(`entity=${buildingId}`);
    expect(html).toContain(`building=${buildingId}`);
    const detailOrder = [
      'data-detail-order="identity"',
      'data-detail-order="history"',
      'data-detail-order="comparable-range"', 'data-detail-order="facts"',
      'data-detail-order="tools"', 'data-detail-order="sources"',
    ].map((needle) => html.indexOf(needle));
    expect(detailOrder.every((position) => position >= 0)).toBe(true);
    expect([...detailOrder].sort((left, right) => left - right)).toEqual(detailOrder);
    expect(html).not.toContain('45–55㎡');
  });

  it('resolves an exact building route while preserving the selected filters', async () => {
    const source = await fixtures();
    const repositories = createKoreaEvidenceRepositoryLoader().load({
      registrySource: registry(source), resolveObject: resolver(source),
    });
    const building = repositories.rent?.listBuildingRecords()[0];
    if (building === undefined) throw new Error('Fixture building must exist.');
    const routeModule = await import(
      '../app/(en)/kr/seoul/explore/[district]/[buildingId]/page'
    );
    const candidate = (routeModule as unknown as Readonly<Record<string, unknown>>)
      .resolveKoreaEvidenceBuildingRoute;
    const resolved = typeof candidate === 'function'
      ? (candidate as (...args: readonly unknown[]) => unknown)(
          'gangnam-gu',
          building.buildingId,
          {
            transaction: 'monthly', area: '60-85', propertyType: 'apartment',
            district: 'gangnam-gu', neighborhood: building.neighborhoodId,
            buildingId: building.buildingId, contractType: 'all',
          },
          repositories,
        )
      : null;

    expect(resolved).toMatchObject({
      model: {
        building: { buildingId: building.buildingId },
        selection: { transaction: 'monthly', areaBand: '60-85', contractGroup: 'all' },
      },
      backHref: `/kr/seoul/explore/?transaction=monthly&area=60-85&propertyType=apartment&district=gangnam-gu&neighborhood=${building.neighborhoodId}&buildingId=${building.buildingId}&contractType=all`,
    });
  });
});
