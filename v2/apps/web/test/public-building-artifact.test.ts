import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  PUBLIC_BUILDING_SUMMARY_ARTIFACT_VERSION,
  parsePublicBuildingSummaryArtifact,
} from '../lib/public-market/building-summary-schema';

const period = '2026-01/2026-07';

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalJson(record[key])}`
  )).join(',')}}`;
}

function distribution() {
  return {
    n: 6,
    published: true,
    min: 300_000_000,
    p25: 310_000_000,
    med: 320_000_000,
    p75: 330_000_000,
    max: 340_000_000,
    chg3m: 1.2,
  };
}

function unsignedArtifact() {
  return {
    artifactVersion: PUBLIC_BUILDING_SUMMARY_ARTIFACT_VERSION,
    generatedAt: '2026-08-31T01:13:24.787Z',
    provenance: {
      marketId: 'kr-seoul',
      period,
      provider: 'MOLIT',
      dataset: 'reported rent contracts',
      endpointVersion: 'v1',
      parserVersion: 'kr-molit-building-parser-v1',
      rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true,
      displayRights: true,
      exclusions: ['Canceled records', 'Private fields'],
    },
    totalRecordCount: 1,
    records: [{
      buildingId: 'gangnam-evidence-tower',
      districtSlug: 'gangnam-gu',
      name: 'Evidence Tower',
      housingType: 'apartment',
      supportedDeals: ['jeonse'],
      period,
      generatedAt: '2026-08-31T01:13:24.787Z',
      publicationMinimum: 5,
      overall: distribution(),
      areaBands: [{ band: '45-55sqm', summary: distribution() }],
      recentContracts: [
        { filedMonth: '2026-07', areaSqm: 50, deal: 'jeonse', depositWon: 320_000_000, monthlyRentWon: 0 },
        { filedMonth: '2026-06', areaSqm: 49.5, deal: 'jeonse', depositWon: 315_000_000, monthlyRentWon: 0 },
      ],
    }],
  };
}

function signedArtifact() {
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

function parse(source: unknown = signedArtifact()) {
  return parsePublicBuildingSummaryArtifact(source, { marketId: 'kr-seoul', period });
}

describe('public building artifact boundary', () => {
  it('accepts one exact rights-cleared artifact and deeply freezes it', () => {
    const artifact = parse();

    expect(artifact).toMatchObject({
      artifactVersion: 'signedprice-public-building-summary-v1',
      marketId: 'kr-seoul',
      period,
      totalRecordCount: 1,
      records: [{ buildingId: 'gangnam-evidence-tower', districtSlug: 'gangnam-gu' }],
    });
    expect(Object.isFrozen(artifact)).toBe(true);
    expect(Object.isFrozen(artifact.records)).toBe(true);
    expect(Object.isFrozen(artifact.records[0]?.recentContracts)).toBe(true);
  });

  it.each([
    ['root', (value: Record<string, unknown>) => { value.extra = true; }],
    ['provenance', (value: Record<string, unknown>) => {
      (value.provenance as Record<string, unknown>).extra = true;
    }],
    ['record', (value: Record<string, unknown>) => {
      ((value.records as Record<string, unknown>[])[0]!).extra = true;
    }],
    ['summary', (value: Record<string, unknown>) => {
      (((value.records as Record<string, unknown>[])[0]!).overall as Record<string, unknown>).extra = true;
    }],
    ['area band', (value: Record<string, unknown>) => {
      ((((value.records as Record<string, unknown>[])[0]!).areaBands as Record<string, unknown>[])[0]!).extra = true;
    }],
    ['recent contract', (value: Record<string, unknown>) => {
      ((((value.records as Record<string, unknown>[])[0]!).recentContracts as Record<string, unknown>[])[0]!).extra = true;
    }],
  ])('rejects extra keys at the %s boundary', (_, mutate) => {
    const source = structuredClone(signedArtifact()) as Record<string, unknown>;
    mutate(source);
    resign(source);
    expect(() => parse(source)).toThrow('Invalid public building artifact.');
  });

  it.each([
    ['duplicate building IDs', (value: Record<string, unknown>) => {
      const records = value.records as Record<string, unknown>[];
      records.push(structuredClone(records[0]!));
      value.totalRecordCount = 2;
    }],
    ['unknown district', (value: Record<string, unknown>) => {
      ((value.records as Record<string, unknown>[])[0]!).districtSlug = 'not-a-district';
    }],
    ['unsafe money', (value: Record<string, unknown>) => {
      (((value.records as Record<string, unknown>[])[0]!).overall as Record<string, unknown>).med = Number.MAX_SAFE_INTEGER + 1;
    }],
    ['negative money', (value: Record<string, unknown>) => {
      ((((value.records as Record<string, unknown>[])[0]!).recentContracts as Record<string, unknown>[])[0]!).depositWon = -1;
    }],
    ['reversed period', (value: Record<string, unknown>) => {
      (value.provenance as Record<string, unknown>).period = '2026-07/2026-01';
    }],
    ['unsorted contracts', (value: Record<string, unknown>) => {
      const contracts = ((value.records as Record<string, unknown>[])[0]!).recentContracts as unknown[];
      contracts.reverse();
    }],
    ['record count mismatch', (value: Record<string, unknown>) => { value.totalRecordCount = 2; }],
    ['rights blocked', (value: Record<string, unknown>) => {
      (value.provenance as Record<string, unknown>).displayRights = false;
    }],
    ['digest mismatch', (value: Record<string, unknown>) => { value.sha256 = 'b'.repeat(64); }],
  ])('rejects %s', (name, mutate) => {
    const source = structuredClone(signedArtifact()) as Record<string, unknown>;
    mutate(source);
    if (name !== 'digest mismatch') resign(source);
    expect(() => parse(source)).toThrow('Invalid public building artifact.');
  });

  it('rejects a fixture-shaped record with null evidence', () => {
    const source = structuredClone(signedArtifact()) as Record<string, unknown>;
    (source.records as unknown[]) = [{
      id: 'noryangjin-dream-square',
      districtCode: '11590',
      neighborhoodId: 'noryangjin-dong',
      nameKo: '노량진 드림스퀘어 복합빌딩',
      nameEn: 'Noryangjin Dream Square Complex',
      lat: null,
      lng: null,
      evidence: { summary: null },
    }];
    resign(source);
    expect(() => parse(source)).toThrow('Invalid public building artifact.');
  });
});
