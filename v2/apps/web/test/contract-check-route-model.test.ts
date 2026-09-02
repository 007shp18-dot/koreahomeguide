import { createHash } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  buildContractCheckRouteModel,
  diagnoseConversionEnvironment,
} from '../lib/contract-check/route-model.server';
import type { KoreaEvidenceRepositories } from '../lib/public-market/korea-evidence-repositories.server';
import { createInstalledSnapshotRepository } from '../lib/snapshots/installed-snapshot-repository.server';

const SHA256 = 'a'.repeat(64);
const REFERENCE_INSTANT = '2026-09-01T00:00:00.000Z';

function validSource(): Record<string, unknown> {
  return {
    artifactVersion: 1,
    generatedAt: '2026-08-31T00:00:00.000Z',
    provenance: {
      marketId: 'kr-seoul', period: '2026-03/2026-08', provider: 'MOLIT',
      endpointVersion: 'v1', parserVersion: 'kr-molit-rent-parser-v2',
      rightsPolicyId: 'kr-molit-rent-v1', sourceComplete: true, sha256: SHA256,
    },
    readiness: { state: 'ready', maximumAgeDays: 45, minimumPairsPerAnchor: 120 },
    totals: {
      eligiblePairCount: 620,
      excluded: { cancelled: 4, invalidMoney: 2, differentBuildingOrArea: 10 },
    },
    curves: [
      {
        housingType: 'apartment',
        observedMinDepositWon: 30_000_000,
        observedMaxDepositWon: 100_000_000,
        anchors: [
          { depositWon: 30_000_000, annualRate: 0.05, pairCount: 140 },
          { depositWon: 100_000_000, annualRate: 0.04, pairCount: 160 },
        ],
      },
      {
        housingType: 'officetel',
        observedMinDepositWon: 20_000_000,
        observedMaxDepositWon: 80_000_000,
        anchors: [
          { depositWon: 20_000_000, annualRate: 0.06, pairCount: 150 },
          { depositWon: 80_000_000, annualRate: 0.05, pairCount: 170 },
        ],
      },
    ],
  };
}

function serialized(source = validSource()): string {
  return JSON.stringify(source);
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalJson(record[key])}`
  )).join(',')}}`;
}

function installedConversionRepository(source = validSource()) {
  return createInstalledSnapshotRepository({
    registrySource: {
      registryVersion: 'signedprice-installed-snapshots-v1',
      snapshots: [{
        marketId: 'kr-seoul',
        dataset: 'kr-conversion',
        schemaVersion: '1',
        sourceVersion: 'molit-rent-v1',
        parserVersion: 'kr-molit-rent-parser-v2',
        rightsPolicyId: 'kr-molit-rent-v1',
        period: '2026-03/2026-08',
        generatedAt: '2026-08-31T00:00:00.000Z',
        objectUrl: 'installed://kr-conversion',
        sha256: createHash('sha256').update(canonicalJson(source)).digest('hex'),
        recordCount: 620,
      }],
    },
    resolveObject: (objectUrl) => objectUrl === 'installed://kr-conversion'
      ? source
      : undefined,
  });
}

function evidenceRepositories(input: Readonly<{
  sale?: boolean;
  rent?: boolean;
  salePeriod?: string;
  rentPeriod?: string;
  rentBuildingId?: string;
}> = {}): KoreaEvidenceRepositories {
  const building = {
    buildingId: 'gangnam-gu-stable-building',
    districtSlug: 'gangnam-gu',
    neighborhoodId: 'yeoksam',
    neighborhoodName: 'Yeoksam-dong',
    officialName: 'Stable Apartments',
    housingType: 'apartment',
  } as const;
  const saleBuilding = Object.freeze({
    ...building,
    cohorts: Object.freeze([]),
    recentSales: Object.freeze([0, 1, 2, 3, 4, 5].map((index) => Object.freeze({
      filedMonth: `2026-0${index + 2}`,
      areaSqm: 84 + index / 10,
      priceWon: 1_000_000_000 + index * 100_000_000,
    }))),
  });
  const rentBuilding = Object.freeze({
    ...building,
    buildingId: input.rentBuildingId ?? building.buildingId,
    cohorts: Object.freeze([]),
    recentTransactions: Object.freeze([
      ...[0, 1, 2, 3, 4, 5].map((index) => Object.freeze({
        filedMonth: `2026-0${index + 2}`,
        areaSqm: 84 + index / 10,
        transaction: 'jeonse' as const,
        depositWon: 100_000_000 + index * 10_000_000,
        monthlyRentWon: 0,
        contractType: 'new' as const,
      })),
      ...[0, 1, 2, 3, 4, 5].map((index) => Object.freeze({
        filedMonth: `2026-0${index + 2}`,
        areaSqm: 84 + index / 10,
        transaction: 'monthly' as const,
        depositWon: 50_000_000 + index * 5_000_000,
        monthlyRentWon: 2_000_000 - index * 30_000,
        contractType: 'new' as const,
      })),
    ]),
  });
  return Object.freeze({
    sale: input.sale === false ? null : {
      getArtifact: () => ({ period: input.salePeriod ?? '2026-02/2026-08' }),
      listAreaRecords: () => [],
      getAreaRecord: () => { throw new Error('unused'); },
      listBuildingRecords: () => [saleBuilding],
      getBuilding: (_district: string, buildingId: string) => {
        if (buildingId !== saleBuilding.buildingId) throw new Error('missing');
        return saleBuilding;
      },
    } as never,
    rent: input.rent === false ? null : {
      getArtifact: () => ({ period: input.rentPeriod ?? '2026-02/2026-08' }),
      listAreaRecords: () => [],
      getAreaRecord: () => { throw new Error('unused'); },
      listBuildingRecords: () => [rentBuilding],
      getBuilding: (_district: string, buildingId: string) => {
        if (buildingId !== rentBuilding.buildingId) throw new Error('missing');
        return rentBuilding;
      },
    } as never,
  });
}

describe('conversion environment diagnostics', () => {
  test.each([
    [undefined, '2026-03/2026-08', SHA256, 'artifact_missing'],
    [serialized(), undefined, SHA256, 'period_missing'],
    [serialized(), '2026-03/2026-08', undefined, 'sha_missing'],
    ['{', '2026-03/2026-08', SHA256, 'artifact_json_invalid'],
  ] as const)('reports deterministic setup state %#', (artifact, period, sha256, code) => {
    expect(diagnoseConversionEnvironment({
      serialized: artifact,
      period,
      sha256,
      referenceInstant: REFERENCE_INSTANT,
    })).toEqual({ code });
  });

  test('distinguishes invalid contracts, missing required curves, and ready evidence', () => {
    const invalid = validSource();
    (invalid.provenance as Record<string, unknown>).sha256 = 'b'.repeat(64);
    const single = validSource();
    single.curves = (single.curves as unknown[]).slice(0, 1);
    (single.totals as Record<string, unknown>).eligiblePairCount = 300;

    expect(diagnoseConversionEnvironment({
      serialized: serialized(invalid),
      period: '2026-03/2026-08',
      sha256: SHA256,
      referenceInstant: REFERENCE_INSTANT,
    })).toEqual({ code: 'artifact_contract_invalid' });
    expect(diagnoseConversionEnvironment({
      serialized: serialized(single),
      period: '2026-03/2026-08',
      sha256: SHA256,
      referenceInstant: REFERENCE_INSTANT,
    })).toEqual({ code: 'curve_missing' });
    expect(diagnoseConversionEnvironment({
      serialized: serialized(),
      period: '2026-03/2026-08',
      sha256: SHA256,
      referenceInstant: REFERENCE_INSTANT,
    })).toEqual({ code: 'ready' });
  });
});

describe('Contract Check route model', () => {
  test('prefers an installed verified conversion snapshot over empty environment evidence', () => {
    const model = buildContractCheckRouteModel({
      source: undefined,
      period: '',
      sha256: '',
      referenceInstant: REFERENCE_INSTANT,
      installedRepository: installedConversionRepository(),
      evidenceRepositories: evidenceRepositories({ sale: false }),
    });

    expect(model).toMatchObject({
      status: 'ready',
      disclosure: {
        periods: {
          rent: { period: '2026-02/2026-08', completedMonthCount: 7 },
          conversion: '2026-03/2026-08',
        },
      },
    });
    if (model.status !== 'ready') throw new Error('Expected installed conversion evidence.');
    expect(model.curves.map(({ housingType }) => housingType)).toEqual([
      'apartment',
      'officetel',
    ]);
  });

  test('falls back to valid environment evidence when an installed snapshot is stale', () => {
    const stale = validSource();
    stale.generatedAt = '2025-01-01T00:00:00.000Z';
    const model = buildContractCheckRouteModel({
      source: validSource(),
      period: '2026-03/2026-08',
      sha256: SHA256,
      referenceInstant: REFERENCE_INSTANT,
      installedRepository: installedConversionRepository(stale),
      evidenceRepositories: evidenceRepositories({ sale: false }),
    });

    expect(model.status).toBe('ready');
    if (model.status !== 'ready') throw new Error('Expected environment fallback evidence.');
    expect(model.curves.map(({ housingType }) => housingType)).toEqual([
      'apartment',
      'officetel',
    ]);
  });

  test('exposes only calculation evidence, disclosure, and the approved IA', () => {
    const model = buildContractCheckRouteModel({
      source: validSource(),
      period: '2026-03/2026-08',
      sha256: SHA256,
      referenceInstant: REFERENCE_INSTANT,
      evidenceRepositories: evidenceRepositories({ sale: false }),
    });

    expect(model).toMatchObject({
      status: 'ready',
      disclosure: {
        source: 'MOLIT reported rental contracts',
        basis: 'Transaction-specific contracts matched by building, neighborhood, or district and filed area',
        periods: {
          sale: null,
          rent: {
            period: '2026-02/2026-08',
            startMonth: '2026-02',
            endMonth: '2026-08',
            completedMonthCount: 7,
          },
          conversion: '2026-03/2026-08',
        },
      },
      secondaryCheckHref: '/kr/seoul/tools/rent-check/',
      navigation: [
        { label: 'Check', href: '/kr/seoul/check/', available: true },
        { label: 'Explore', href: '/kr/seoul/explore/', available: true },
        { label: 'News', href: '/kr/seoul/news/', available: true },
        { label: 'Guide', href: '/kr/seoul/guide/', available: true },
      ],
    });
    if (model.status !== 'ready') throw new Error('Expected ready fixture.');
    expect(model.curves.map((curve) => curve.housingType)).toEqual([
      'apartment',
      'officetel',
    ]);
    expect(JSON.stringify(model)).not.toMatch(/sha256|rightsPolicyId|excluded|endpointVersion/);
  });

  test('returns a claim-free unavailable model when verified evidence is absent', () => {
    const model = buildContractCheckRouteModel({
      source: undefined,
      period: '',
      sha256: '',
      referenceInstant: REFERENCE_INSTANT,
    });

    expect(model).toEqual({
      status: 'unavailable',
      message: 'Verified transaction evidence is unavailable.',
      navigation: [
        { label: 'Check', href: '/kr/seoul/check/', available: true },
        { label: 'Explore', href: '/kr/seoul/explore/', available: true },
        { label: 'News', href: '/kr/seoul/news/', available: true },
        { label: 'Guide', href: '/kr/seoul/guide/', available: true },
      ],
    });
    expect(JSON.stringify(model)).not.toMatch(/72,291|29\.4|annualRate|pairCount/);
  });

  test('stays unavailable with a valid conversion curve but no transaction evidence', () => {
    const model = buildContractCheckRouteModel({
      source: validSource(),
      period: '2026-03/2026-08',
      sha256: SHA256,
      referenceInstant: REFERENCE_INSTANT,
      evidenceRepositories: Object.freeze({ sale: null, rent: null }),
    });

    expect(model).toMatchObject({
      status: 'unavailable',
      message: 'Verified transaction evidence is unavailable.',
    });
  });

  test('stays unavailable when installed transaction repositories have no usable records', () => {
    const emptyRepository = {
      getArtifact: () => ({ period: '2026-02/2026-08' }),
      listAreaRecords: () => [],
      getAreaRecord: () => { throw new Error('missing'); },
      listBuildingRecords: () => [],
      getBuilding: () => { throw new Error('missing'); },
    } as never;
    const model = buildContractCheckRouteModel({
      source: validSource(),
      period: '2026-03/2026-08',
      sha256: SHA256,
      referenceInstant: REFERENCE_INSTANT,
      evidenceRepositories: Object.freeze({
        sale: emptyRepository,
        rent: emptyRepository,
      }),
    });

    expect(model).toMatchObject({
      status: 'unavailable',
      message: 'Verified transaction evidence is unavailable.',
    });
  });

  test('does not count out-of-window records toward A/B route readiness', () => {
    const oldSaleRepository = {
      getArtifact: () => ({ period: '2024-01/2026-08' }),
      listAreaRecords: () => [],
      getAreaRecord: () => { throw new Error('missing'); },
      listBuildingRecords: () => [{
        buildingId: 'old-building', districtSlug: 'gangnam-gu', neighborhoodId: 'old',
        neighborhoodName: 'Old', officialName: 'Old', housingType: 'apartment', cohorts: [],
        recentSales: [0, 1, 2, 3, 4].map((index) => ({
          filedMonth: `2025-0${index + 1}`, areaSqm: 84, priceWon: 1_000_000_000,
        })),
      }],
      getBuilding: () => { throw new Error('missing'); },
    } as never;
    const model = buildContractCheckRouteModel({
      source: validSource(),
      period: '2026-03/2026-08',
      sha256: SHA256,
      referenceInstant: REFERENCE_INSTANT,
      evidenceRepositories: Object.freeze({ sale: oldSaleRepository, rent: null }),
    });

    expect(model).toMatchObject({
      status: 'unavailable',
      message: 'Verified transaction evidence is unavailable.',
    });
  });

  test('keeps sale and rent readiness independent of conversion readiness', () => {
    const saleOnly = buildContractCheckRouteModel({
      source: undefined,
      period: '',
      sha256: '',
      referenceInstant: REFERENCE_INSTANT,
      evidenceRepositories: evidenceRepositories({ rent: false }),
    });

    expect(saleOnly).toMatchObject({
      status: 'ready',
      availability: { sale: true, jeonse: false, monthly: false, conversion: false },
      curves: [],
    });
  });

  test('builds an all-type trade-off from transaction-specific installed evidence', () => {
    const model = buildContractCheckRouteModel({
      source: validSource(),
      period: '2026-03/2026-08',
      sha256: SHA256,
      referenceInstant: REFERENCE_INSTANT,
      evidenceRepositories: evidenceRepositories(),
      query: {
        compare: '1', district: 'gangnam-gu', building: 'gangnam-gu-stable-building',
        housing: 'apartment', area: '84',
        'a-transaction': 'sale', 'a-price': '1200000000',
        'b-transaction': 'monthly', 'b-deposit': '50000000', 'b-monthly-rent': '2000000',
      },
    });

    expect(model).toMatchObject({
      status: 'ready',
      submitted: true,
      selection: {
        offers: {
          a: { transaction: 'sale', salePriceWon: 1_200_000_000, depositWon: null, monthlyRentWon: null },
          b: { transaction: 'monthly', salePriceWon: null, depositWon: 50_000_000, monthlyRentWon: 2_000_000 },
        },
      },
      comparison: { status: 'ready', basis: 'tradeoff', winner: null },
    });
  });

  test('keeps transaction and conversion evidence periods separate', () => {
    const model = buildContractCheckRouteModel({
      source: validSource(),
      period: '2026-03/2026-08',
      sha256: SHA256,
      referenceInstant: REFERENCE_INSTANT,
      evidenceRepositories: evidenceRepositories({
        salePeriod: '2026-01/2026-07',
        rentPeriod: '2026-02/2026-08',
      }),
    });

    expect(model).toMatchObject({
      status: 'ready',
      disclosure: {
        periods: {
          sale: { period: '2026-01/2026-07', completedMonthCount: 7 },
          rent: { period: '2026-02/2026-08', completedMonthCount: 7 },
          conversion: '2026-03/2026-08',
        },
      },
    });
  });

  test('uses the artifact-specific recent window in each offer result', () => {
    const model = buildContractCheckRouteModel({
      source: validSource(),
      period: '2026-03/2026-08',
      sha256: SHA256,
      referenceInstant: REFERENCE_INSTANT,
      evidenceRepositories: evidenceRepositories({
        salePeriod: '2026-01/2026-07',
        rentPeriod: '2026-02/2026-08',
      }),
      query: {
        compare: '1', district: 'gangnam-gu', housing: 'apartment', area: '84',
        'a-transaction': 'sale', 'a-price': '1200000000',
        'b-transaction': 'jeonse', 'b-deposit': '120000000',
      },
    });

    expect(model).toMatchObject({
      status: 'ready',
      offerChecks: {
        a: { status: 'ready', period: '2026-01/2026-07', evidenceWindow: { completedMonthCount: 7 } },
        b: { status: 'ready', period: '2026-02/2026-08', evidenceWindow: { completedMonthCount: 7 } },
      },
    });
  });

  test('uses stable identity to widen across a selected-transaction building gap', () => {
    const model = buildContractCheckRouteModel({
      source: validSource(),
      period: '2026-03/2026-08',
      sha256: SHA256,
      referenceInstant: REFERENCE_INSTANT,
      evidenceRepositories: evidenceRepositories({ rentBuildingId: 'gangnam-gu-rent-peer' }),
      query: {
        compare: '1', district: 'gangnam-gu', building: 'gangnam-gu-stable-building',
        housing: 'apartment', area: '84',
        'a-transaction': 'jeonse', 'a-deposit': '120000000',
        'b-transaction': 'jeonse', 'b-deposit': '130000000',
      },
    });

    expect(model).toMatchObject({
      status: 'ready',
      buildingName: 'Stable Apartments',
      offerChecks: {
        a: { status: 'ready', filters: { scope: 'neighborhood' } },
        b: { status: 'ready', filters: { scope: 'neighborhood' } },
      },
    });
  });

  test('does not coerce a missing submitted field to zero or a default', () => {
    const model = buildContractCheckRouteModel({
      source: validSource(),
      period: '2026-03/2026-08',
      sha256: SHA256,
      referenceInstant: REFERENCE_INSTANT,
      evidenceRepositories: evidenceRepositories(),
      query: {
        compare: '1', district: 'gangnam-gu', housing: 'apartment', area: '84',
        'a-transaction': 'sale',
        'b-transaction': 'jeonse', 'b-deposit': '100000000',
      },
    });

    expect(model).toMatchObject({
      status: 'ready',
      selection: { offers: { a: { salePriceWon: null } } },
      comparison: { status: 'unavailable', reason: 'offer-evidence-unavailable' },
    });
  });
});
