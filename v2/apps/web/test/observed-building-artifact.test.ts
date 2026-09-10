import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import type { KoreaObservedBuildingInventory } from '@signedprice/korea-rent';
import { buildObservedBuildingArtifact } from '../lib/public-market/observed-building-artifact-builder.server';
import {
  OBSERVED_BUILDING_ARTIFACT_VERSION,
  parseObservedBuildingArtifact,
} from '../lib/public-market/observed-building-schema';
import {
  ObservedBuildingInventoryUnavailableError,
  createObservedBuildingRepository,
  observedBuildingRepositoryFromEnvironment,
} from '../lib/public-market/observed-building-repository.server';

const period = '2026-01/2026-07';
const generatedAt = '2026-09-01T00:00:00.000Z';

afterEach(() => {
  vi.unstubAllEnvs();
});

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalJson(record[key])}`
  )).join(',')}}`;
}

function unsignedArtifact() {
  return {
    artifactVersion: OBSERVED_BUILDING_ARTIFACT_VERSION,
    generatedAt,
    provenance: {
      marketId: 'kr-seoul',
      period,
      provider: 'MOLIT',
      dataset: 'reported rent contracts',
      endpointVersion: 'v1',
      parserVersion: 'kr-molit-building-parser-v2',
      rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true,
      displayRights: true,
      exclusions: ['Canceled records', 'Records without a stable building identity'],
    },
    stats: {
      sourceRecordCount: 3,
      observedRecordCount: 2,
      observedBuildingCount: 2,
      cancelledRecordCount: 1,
      missingIdentityRecordCount: 0,
      coordinateReadyCount: 1,
      coordinatePendingCount: 1,
    },
    records: [{
      buildingId: 'gangnam-gu-observed-one',
      districtSlug: 'gangnam-gu',
      neighborhoodId: 'gangnam-gu-dong-one',
      neighborhoodName: '대치동',
      officialName: '관측 아파트',
      housingType: 'apartment',
      observationCount: 1,
      jeonseObservationCount: 1,
      monthlyObservationCount: 0,
      firstObservedMonth: '2026-07',
      lastObservedMonth: '2026-07',
      coordinate: { state: 'ready', latitude: 37.4995, longitude: 127.0574 },
    }, {
      buildingId: 'jongno-gu-observed-two',
      districtSlug: 'jongno-gu',
      neighborhoodId: 'jongno-gu-dong-two',
      neighborhoodName: '청운동',
      officialName: '관측 단독주택',
      housingType: 'detached',
      observationCount: 1,
      jeonseObservationCount: 0,
      monthlyObservationCount: 1,
      firstObservedMonth: '2026-06',
      lastObservedMonth: '2026-06',
      coordinate: { state: 'pending', reason: 'coordinate_not_resolved' },
    }],
  };
}

function signedArtifact(): Record<string, unknown> {
  const unsigned = unsignedArtifact();
  return {
    ...unsigned,
    sha256: createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
  };
}

function resign(value: Record<string, unknown>): void {
  const unsigned = { ...value };
  delete unsigned.sha256;
  value.sha256 = createHash('sha256').update(canonicalJson(unsigned)).digest('hex');
}

function inventory(): KoreaObservedBuildingInventory {
  const artifact = unsignedArtifact();
  return {
    marketId: 'kr-seoul',
    period,
    generatedAt,
    stats: artifact.stats,
    records: artifact.records,
  } as KoreaObservedBuildingInventory;
}

describe('observed building artifact boundary', () => {
  it('builds, verifies, deeply freezes, and serves a privacy-safe v1 artifact', async () => {
    const built = await buildObservedBuildingArtifact(inventory());
    const parsed = parseObservedBuildingArtifact(JSON.parse(built.serialized), {
      marketId: 'kr-seoul', period,
    });
    const repository = createObservedBuildingRepository({
      source: built.artifact,
      expected: { marketId: 'kr-seoul', period },
    });

    expect(parsed.stats).toEqual(unsignedArtifact().stats);
    expect(parsed.records).toHaveLength(2);
    expect(repository.listByDistrict('gangnam-gu')).toHaveLength(1);
    expect(repository.listByDistrict('gangnam-gu')).toBe(
      repository.listByDistrict('gangnam-gu'),
    );
    expect(repository.getById('jongno-gu-observed-two')).toMatchObject({
      housingType: 'detached',
      coordinate: { state: 'pending' },
    });
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.records[0]?.coordinate)).toBe(true);
    expect(built.serialized).not.toMatch(/serviceKey|sourceRecordId|raw xml/i);
  });

  it.each([
    ['root key', (value: Record<string, unknown>) => { value.extra = true; }],
    ['duplicate ID', (value: Record<string, unknown>) => {
      const records = value.records as Record<string, unknown>[];
      records.push(structuredClone(records[0]!));
      (value.stats as Record<string, unknown>).observedBuildingCount = 3;
      (value.stats as Record<string, unknown>).observedRecordCount = 3;
      (value.stats as Record<string, unknown>).sourceRecordCount = 4;
    }],
    ['count mismatch', (value: Record<string, unknown>) => {
      (value.stats as Record<string, unknown>).observedBuildingCount = 3;
    }],
    ['invalid coordinate', (value: Record<string, unknown>) => {
      ((value.records as Record<string, unknown>[])[0]!.coordinate as Record<string, unknown>).latitude = 0;
    }],
    ['invalid pending reason', (value: Record<string, unknown>) => {
      ((value.records as Record<string, unknown>[])[1]!.coordinate as Record<string, unknown>).reason = 'unknown';
    }],
    ['reversed months', (value: Record<string, unknown>) => {
      (value.records as Record<string, unknown>[])[0]!.firstObservedMonth = '2026-08';
    }],
    ['negative count', (value: Record<string, unknown>) => {
      (value.records as Record<string, unknown>[])[0]!.observationCount = -1;
    }],
    ['wrong period', (value: Record<string, unknown>) => {
      (value.provenance as Record<string, unknown>).period = '2025-01/2025-07';
    }],
    ['digest mismatch', (value: Record<string, unknown>) => { value.sha256 = 'b'.repeat(64); }],
  ])('rejects %s', (name, mutate) => {
    const source = signedArtifact();
    mutate(source);
    if (name !== 'digest mismatch') resign(source);
    expect(() => parseObservedBuildingArtifact(source, { marketId: 'kr-seoul', period }))
      .toThrow('Invalid observed building artifact.');
  });

  it('fails closed instead of substituting the smaller price artifact', () => {
    expect(() => createObservedBuildingRepository({
      source: undefined,
      expected: { marketId: 'kr-seoul', period },
    })).toThrow(ObservedBuildingInventoryUnavailableError);
  });

  it('resolves the observed inventory through the installed snapshot registry first', () => {
    const source = signedArtifact();
    const registryDigest = createHash('sha256')
      .update(canonicalJson(source))
      .digest('hex');
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);
    vi.stubEnv('SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT', undefined);
    vi.stubEnv('SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY', JSON.stringify({
      registryVersion: 'signedprice-installed-snapshots-v1',
      snapshots: [{
        marketId: 'kr-seoul',
        dataset: 'kr-building-registry',
        schemaVersion: OBSERVED_BUILDING_ARTIFACT_VERSION,
        sourceVersion: 'molit-rent-v1',
        parserVersion: 'kr-molit-building-parser-v2',
        rightsPolicyId: 'kr-molit-rent-v1',
        period,
        generatedAt,
        objectUrl: 'installed://kr-building-registry',
        sha256: registryDigest,
        recordCount: 2,
      }],
    }));

    const repository = observedBuildingRepositoryFromEnvironment({
      resolveObject: (objectUrl) => objectUrl === 'installed://kr-building-registry'
        ? source
        : undefined,
    });

    expect(repository?.listRecords()).toHaveLength(2);
    expect(repository?.getArtifact().sha256).toBe(source.sha256);
  });

  it('uses the explicit observed fixture only when a valid scoped registry lacks its activation', () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);
    vi.stubEnv('SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT', JSON.stringify(signedArtifact()));
    vi.stubEnv('SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY', JSON.stringify({
      registryVersion: 'signedprice-installed-snapshots-v1',
      snapshots: [],
    }));

    expect(observedBuildingRepositoryFromEnvironment({
      useCheckedInSnapshot: false,
    })?.listRecords()).toHaveLength(2);
  });

  it('fails closed instead of masking a malformed installed registry with the explicit fixture', () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);
    vi.stubEnv('SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT', JSON.stringify(signedArtifact()));
    vi.stubEnv('SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY', JSON.stringify({
      registryVersion: 'signedprice-installed-snapshots-v1',
      snapshots: [{}],
    }));

    expect(observedBuildingRepositoryFromEnvironment({
      useCheckedInSnapshot: false,
    })).toBeNull();
  });

  it('fails closed instead of masking a corrupt observed activation with the explicit fixture', () => {
    const source = signedArtifact();
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);
    vi.stubEnv('SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT', JSON.stringify(source));
    vi.stubEnv('SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY', JSON.stringify({
      registryVersion: 'signedprice-installed-snapshots-v1',
      snapshots: [{
        marketId: 'kr-seoul',
        dataset: 'kr-building-registry',
        schemaVersion: OBSERVED_BUILDING_ARTIFACT_VERSION,
        sourceVersion: 'molit-rent-v1',
        parserVersion: 'kr-molit-building-parser-v2',
        rightsPolicyId: 'kr-molit-rent-v1',
        period,
        generatedAt,
        objectUrl: 'installed://kr-building-registry',
        sha256: '0'.repeat(64),
        recordCount: 2,
      }],
    }));

    expect(observedBuildingRepositoryFromEnvironment({
      resolveObject: () => source,
      useCheckedInSnapshot: false,
    })).toBeNull();
  });

  it('loads the checked-in inventory when no explicit artifact is supplied', () => {
    vi.stubEnv('SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY', undefined);
    vi.stubEnv('SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT', undefined);
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);

    const repository = observedBuildingRepositoryFromEnvironment({
      useCheckedInSnapshot: true,
    });

    expect(repository?.listRecords()).toHaveLength(48_999);
    expect(repository?.getArtifact().period).toBe('2026-02/2026-08');
    expect(new Set(repository?.listRecords().map(({ districtSlug }) => districtSlug)).size).toBe(25);
  });

  it('does not install the production snapshot implicitly in unit-test route models', () => {
    vi.stubEnv('SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY', undefined);
    vi.stubEnv('SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT', undefined);
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);

    expect(observedBuildingRepositoryFromEnvironment()).toBeNull();
  });
});
