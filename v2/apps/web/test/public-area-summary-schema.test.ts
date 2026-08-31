import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import {
  PUBLIC_AREA_SUMMARY_ARTIFACT_VERSION,
  parsePublicAreaSummaryArtifact,
} from '../lib/public-market/area-summary-schema';

const period = '2026-01/2026-07';

function publishedSummary(area: string, parent: string, index = 0) {
  const base = 100_000_000 + index * 10_000_000;
  return {
    marketId: 'kr-seoul',
    area,
    parent,
    deal: 'jeonse',
    band: '45-55sqm',
    period,
    n: 5,
    published: true,
    min: base,
    p25: base + 10_000_000,
    med: base + 20_000_000,
    p75: base + 30_000_000,
    max: base + 40_000_000,
    chg3m: index % 2 === 0 ? null : 1.2,
  };
}

function validArtifact() {
  const districtSummaries = SEOUL_RENT_CHECK_DISTRICTS.map((district, index) =>
    publishedSummary(district.slug, 'seoul', index));
  return {
    artifactVersion: 'signedprice-public-area-summary-v1',
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
    citySummary: {
      ...publishedSummary('seoul', 'kr'),
      n: 125,
    },
    districtSummaries,
  };
}

describe('public area summary artifact schema', () => {
  it('accepts one city and exactly 25 districts in canonical legal-code order', () => {
    expect(PUBLIC_AREA_SUMMARY_ARTIFACT_VERSION)
      .toBe('signedprice-public-area-summary-v1');

    const parsed = parsePublicAreaSummaryArtifact(validArtifact(), {
      marketId: 'kr-seoul',
      period,
    });

    expect(parsed.generatedAt).toBe('2026-08-31T01:13:24.787Z');
    expect(parsed.citySummary.n).toBe(125);
    expect(parsed.districtSummaries).toHaveLength(25);
    expect(parsed.districtSummaries.map(({ area }) => area)).toEqual(
      SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => slug),
    );
    expect(parsed.citySummary.n).toBe(
      parsed.districtSummaries.reduce((sum, summary) => sum + summary.n, 0),
    );
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.districtSummaries)).toBe(true);
  });

  it.each([
    ['extra root key', (artifact: ReturnType<typeof validArtifact>) => {
      Object.assign(artifact, { raw: true });
    }],
    ['extra provenance key', (artifact: ReturnType<typeof validArtifact>) => {
      Object.assign(artifact.provenance, { endpointUrl: 'https://example.test' });
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
      artifact.districtSummaries.pop();
      artifact.citySummary.n -= 5;
    }],
    ['duplicate district slug', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.districtSummaries[1]!.area = artifact.districtSummaries[0]!.area;
    }],
    ['district order drift', (artifact: ReturnType<typeof validArtifact>) => {
      [artifact.districtSummaries[0], artifact.districtSummaries[1]] =
        [artifact.districtSummaries[1]!, artifact.districtSummaries[0]!];
    }],
    ['wrong district parent', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.districtSummaries[0]!.parent = 'kr';
    }],
    ['wrong deal', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.districtSummaries[0]!.deal = 'rent';
    }],
    ['wrong band', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.districtSummaries[0]!.band = 'all-homes';
    }],
    ['city count mismatch', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.citySummary.n += 1;
    }],
    ['impossible five-number tuple', (artifact: ReturnType<typeof validArtifact>) => {
      artifact.districtSummaries[0]!.p25 =
        artifact.districtSummaries[0]!.med + 1;
    }],
  ])('rejects %s with one sanitized error', (_name, mutate) => {
    const artifact = structuredClone(validArtifact());
    mutate(artifact);
    expect(() => parsePublicAreaSummaryArtifact(artifact, {
      marketId: 'kr-seoul',
      period,
    })).toThrow('Invalid public area summary artifact.');
  });

  it('accepts exact withholding but rejects any withheld money key', () => {
    const artifact = structuredClone(validArtifact());
    artifact.districtSummaries[0] = {
      marketId: 'kr-seoul',
      area: 'jongno-gu',
      parent: 'seoul',
      deal: 'jeonse',
      band: '45-55sqm',
      period,
      n: 4,
      published: false,
    } as unknown as (typeof artifact.districtSummaries)[number];
    artifact.citySummary.n = 124;

    const parsed = parsePublicAreaSummaryArtifact(artifact, {
      marketId: 'kr-seoul',
      period,
    });
    expect(parsed.districtSummaries[0]).toEqual({
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
    const leakingDistrict = leaking.districtSummaries[0] as unknown as Record<
      string,
      unknown
    >;
    leakingDistrict.med = 999_000_000;
    expect(() => parsePublicAreaSummaryArtifact(leaking, {
      marketId: 'kr-seoul',
      period,
    })).toThrow('Invalid public area summary artifact.');
  });

  it.each([Number.POSITIVE_INFINITY, -100, 1.23])(
    'rejects invalid published change %s',
    (chg3m) => {
      const artifact = structuredClone(validArtifact());
      artifact.districtSummaries[0]!.chg3m = chg3m;
      expect(() => parsePublicAreaSummaryArtifact(artifact, {
        marketId: 'kr-seoul',
        period,
      })).toThrow('Invalid public area summary artifact.');
    },
  );

  it.each([null, -99.9, 0, 1.2, 400])('accepts valid published change %s', (chg3m) => {
    const artifact = structuredClone(validArtifact());
    artifact.districtSummaries[0]!.chg3m = chg3m;
    expect(parsePublicAreaSummaryArtifact(artifact, {
      marketId: 'kr-seoul',
      period,
    }).districtSummaries[0]).toMatchObject({ chg3m });
  });
});
