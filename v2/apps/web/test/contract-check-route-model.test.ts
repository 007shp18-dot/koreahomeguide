import { createHash } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  buildContractCheckRouteModel,
  diagnoseConversionEnvironment,
} from '../lib/contract-check/route-model.server';
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
    });

    expect(model).toMatchObject({
      status: 'ready',
      disclosure: { period: '2026-03/2026-08' },
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
    });

    expect(model).toMatchObject({
      status: 'ready',
      disclosure: {
        source: 'MOLIT reported rental contracts',
        basis: 'Matched contracts in the same building and filed area',
        period: '2026-03/2026-08',
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
      message: 'Verified conversion evidence is unavailable.',
      navigation: [
        { label: 'Check', href: '/kr/seoul/check/', available: true },
        { label: 'Explore', href: '/kr/seoul/explore/', available: true },
        { label: 'News', href: '/kr/seoul/news/', available: true },
        { label: 'Guide', href: '/kr/seoul/guide/', available: true },
      ],
    });
    expect(JSON.stringify(model)).not.toMatch(/72,291|29\.4|annualRate|pairCount/);
  });
});
