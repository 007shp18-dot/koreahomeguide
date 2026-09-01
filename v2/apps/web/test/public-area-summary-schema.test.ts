import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import {
  PUBLIC_AREA_SUMMARY_ARTIFACT_VERSION,
  parsePublicAreaSummaryArtifact,
} from '../lib/public-market/area-summary-schema';

const period = '2026-01/2026-07';

function publishedSummary(
  area: string,
  parent: string,
  index: number,
  n: number,
  offset = 0,
) {
  const base = 100_000_000 + offset + index * 10_000_000;
  return {
    marketId: 'kr-seoul',
    area,
    parent,
    deal: 'jeonse',
    band: '45-55sqm',
    period,
    n,
    published: true,
    min: base,
    p25: base + 10_000_000,
    med: base + 20_000_000,
    p75: base + 30_000_000,
    max: base + 40_000_000,
    chg3m: index % 2 === 0 ? null : 1.2,
  };
}

function group(n: number, offset: number) {
  const districtSummaries = SEOUL_RENT_CHECK_DISTRICTS.map((district, index) =>
    publishedSummary(district.slug, 'seoul', index, n, offset));
  return {
    citySummary: publishedSummary('seoul', 'kr', 0, n * 25, offset),
    districtSummaries,
  };
}

function validArtifact() {
  return {
    artifactVersion: 'signedprice-public-area-summary-v2',
    generatedAt: '2026-08-31T01:13:24.787Z',
    provenance: {
      marketId: 'kr-seoul',
      period,
      provider: 'MOLIT',
      endpointVersion: 'v1',
      parserVersion: 'kr-molit-rent-parser-v2',
      rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true,
    },
    groups: {
      all: group(10, 0),
      new: group(5, -20_000_000),
      renewal: group(5, 20_000_000),
    },
    unknownContractCounts: {
      city: 0,
      districts: Array.from({ length: 25 }, () => 0),
    },
  };
}

describe('public area summary artifact schema', () => {
  it('accepts three reconciled city and 25-district groups in legal-code order', () => {
    expect(PUBLIC_AREA_SUMMARY_ARTIFACT_VERSION)
      .toBe('signedprice-public-area-summary-v2');

    const parsed = parsePublicAreaSummaryArtifact(validArtifact(), {
      marketId: 'kr-seoul',
      period,
    });

    expect(parsed.generatedAt).toBe('2026-08-31T01:13:24.787Z');
    expect(Object.keys(parsed.groups)).toEqual(['all', 'new', 'renewal']);
    expect(parsed.groups.all.citySummary.n).toBe(250);
    expect(parsed.groups.new.citySummary.n).toBe(125);
    expect(parsed.groups.renewal.citySummary.n).toBe(125);
    for (const value of Object.values(parsed.groups)) {
      expect(value.districtSummaries).toHaveLength(25);
      expect(value.districtSummaries.map(({ area }) => area)).toEqual(
        SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => slug),
      );
      expect(value.citySummary.n).toBe(
        value.districtSummaries.reduce((sum, summary) => sum + summary.n, 0),
      );
      expect(Object.isFrozen(value)).toBe(true);
      expect(Object.isFrozen(value.districtSummaries)).toBe(true);
    }
    expect(parsed.unknownContractCounts).toEqual({
      city: 0,
      districts: Array.from({ length: 25 }, () => 0),
    });
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.groups)).toBe(true);
    expect(Object.isFrozen(parsed.unknownContractCounts)).toBe(true);
    expect(Object.isFrozen(parsed.unknownContractCounts.districts)).toBe(true);
  });

  it.each([
    ['extra root key', (artifact: ReturnType<typeof validArtifact>) => {
      Object.assign(artifact, { raw: true });
    }],
    ['extra provenance key', (artifact: ReturnType<typeof validArtifact>) => {
      Object.assign(artifact.provenance, { endpointUrl: 'https://example.test' });
    }],
    ['extra group key', (artifact: ReturnType<typeof validArtifact>) => {
      Object.assign(artifact.groups, { unknown: group(5, 0) });
    }],
    ['missing group', (artifact: ReturnType<typeof validArtifact>) => {
      delete (artifact.groups as Partial<typeof artifact.groups>).renewal;
    }],
    ['wrong provider', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.provenance.provider = 'OTHER';
    }],
    ['non-canonical instant', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.generatedAt = '2026-08-31T01:13:24Z';
    }],
    ['wrong period', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.provenance.period = '2025-12/2026-06';
    }],
    ['missing district', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.groups.all.districtSummaries.pop();
    }],
    ['duplicate district slug', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.groups.new.districtSummaries[1]!.area =
        artifact.groups.new.districtSummaries[0]!.area;
    }],
    ['district order drift', (artifact: ReturnType<typeof validArtifact>) => {
      [artifact.groups.renewal.districtSummaries[0],
        artifact.groups.renewal.districtSummaries[1]] =
        [artifact.groups.renewal.districtSummaries[1]!,
          artifact.groups.renewal.districtSummaries[0]!];
    }],
    ['wrong district parent', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.groups.all.districtSummaries[0]!.parent = 'kr';
    }],
    ['wrong deal', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.groups.new.districtSummaries[0]!.deal = 'rent';
    }],
    ['wrong band', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.groups.renewal.districtSummaries[0]!.band = 'all-homes';
    }],
    ['group city count mismatch', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.groups.new.citySummary.n += 1;
    }],
    ['cross-group city mismatch', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.unknownContractCounts.city += 1;
    }],
    ['cross-group district mismatch', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.unknownContractCounts.districts[0]! += 1;
    }],
    ['invalid unknown count', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.unknownContractCounts.districts[0] = -1;
    }],
    ['impossible five-number tuple', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.groups.all.districtSummaries[0]!.p25 =
        artifact.groups.all.districtSummaries[0]!.med + 1;
    }],
  ])('rejects %s with one sanitized error', (_name, mutate) => {
    const artifact = structuredClone(validArtifact());
    mutate(artifact);
    expect(() => parsePublicAreaSummaryArtifact(artifact, {
      marketId: 'kr-seoul',
      period,
    })).toThrow('Invalid public area summary artifact.');
  });

  it('accepts an independently withheld split and rejects its money keys', () => {
    const artifact = structuredClone(validArtifact());
    artifact.groups.renewal.districtSummaries[0] = {
      marketId: 'kr-seoul',
      area: 'jongno-gu',
      parent: 'seoul',
      deal: 'jeonse',
      band: '45-55sqm',
      period,
      n: 4,
      published: false,
    } as unknown as (typeof artifact.groups.renewal.districtSummaries)[number];
    artifact.groups.renewal.citySummary.n = 124;
    artifact.unknownContractCounts.city = 1;
    artifact.unknownContractCounts.districts[0] = 1;

    const parsed = parsePublicAreaSummaryArtifact(artifact, {
      marketId: 'kr-seoul',
      period,
    });
    expect(parsed.groups.renewal.districtSummaries[0]).toEqual({
      marketId: 'kr-seoul',
      area: 'jongno-gu',
      parent: 'seoul',
      deal: 'jeonse',
      band: '45-55sqm',
      period,
      n: 4,
      published: false,
    });

    const leaking = structuredClone(artifact);
    Object.assign(leaking.groups.renewal.districtSummaries[0]!, {
      med: 999_000_000,
    });
    expect(() => parsePublicAreaSummaryArtifact(leaking, {
      marketId: 'kr-seoul',
      period,
    })).toThrow('Invalid public area summary artifact.');
  });

  it.each([Number.POSITIVE_INFINITY, -100, 1.23])(
    'rejects invalid published change %s',
    (chg3m) => {
      const artifact = structuredClone(validArtifact());
      artifact.groups.new.districtSummaries[0]!.chg3m = chg3m;
      expect(() => parsePublicAreaSummaryArtifact(artifact, {
        marketId: 'kr-seoul',
        period,
      })).toThrow('Invalid public area summary artifact.');
    },
  );

  it.each([null, -99.9, 0, 1.2, 400])('accepts valid published change %s', (chg3m) => {
    const artifact = structuredClone(validArtifact());
    artifact.groups.new.districtSummaries[0]!.chg3m = chg3m;
    expect(parsePublicAreaSummaryArtifact(artifact, {
      marketId: 'kr-seoul',
      period,
    }).groups.new.districtSummaries[0]).toMatchObject({ chg3m });
  });
});
