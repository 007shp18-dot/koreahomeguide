import { describe, expect, test } from 'vitest';

import {
  KR_MOLIT_RENT_RIGHTS,
  parseKoreaConversionArtifact,
  toBrowserConversionCurves,
  type KoreaConversionArtifactExpectation,
  type MolitRightsLookup,
} from '../src';

const SHA256 = 'a'.repeat(64);
const REFERENCE_INSTANT = '2026-09-01T00:00:00.000Z';
const rightsLookup: MolitRightsLookup = (policyId) =>
  policyId === KR_MOLIT_RENT_RIGHTS.id ? KR_MOLIT_RENT_RIGHTS : undefined;

const expectation = Object.freeze({
  marketId: 'kr-seoul',
  period: '2026-03/2026-08',
  sha256: SHA256,
  rightsLookup,
} as const satisfies KoreaConversionArtifactExpectation);

function validArtifact(): Record<string, unknown> {
  return {
    artifactVersion: 1,
    generatedAt: '2026-08-31T00:00:00.000Z',
    provenance: {
      marketId: 'kr-seoul',
      period: '2026-03/2026-08',
      provider: 'MOLIT',
      endpointVersion: 'v1',
      parserVersion: 'kr-molit-rent-parser-v2',
      rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true,
      sha256: SHA256,
    },
    readiness: {
      state: 'ready',
      maximumAgeDays: 45,
      minimumPairsPerAnchor: 120,
    },
    totals: {
      eligiblePairCount: 620,
      excluded: {
        cancelled: 4,
        invalidMoney: 2,
        differentBuildingOrArea: 10,
      },
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

function withoutKey(path: readonly string[]): Record<string, unknown> {
  const value = structuredClone(validArtifact());
  let cursor: Record<string, unknown> = value;
  for (const segment of path.slice(0, -1)) {
    if (/^\d+$/.test(segment)) {
      const array = cursor as unknown as unknown[];
      cursor = array[Number(segment)] as Record<string, unknown>;
    } else {
      cursor = cursor[segment] as Record<string, unknown>;
    }
  }
  delete cursor[path.at(-1)!];
  return value;
}

function parse(source: unknown = validArtifact()) {
  return parseKoreaConversionArtifact(source, expectation, REFERENCE_INSTANT);
}

describe('parseKoreaConversionArtifact', () => {
  test('accepts complete current evidence and deeply freezes the verified result', () => {
    const result = parse();

    expect(result).toMatchObject({
      artifactVersion: 1,
      generatedAt: '2026-08-31T00:00:00.000Z',
      marketId: 'kr-seoul',
      period: '2026-03/2026-08',
      sha256: SHA256,
      eligiblePairCount: 620,
    });
    expect(result.curves.map((curve) => curve.housingType)).toEqual([
      'apartment',
      'officetel',
    ]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.curves)).toBe(true);
    expect(result.curves.every((curve) => Object.isFrozen(curve))).toBe(true);
    expect(result.curves.every((curve) => Object.isFrozen(curve.anchors))).toBe(true);
    expect(result.curves.flatMap((curve) => curve.anchors).every(Object.isFrozen)).toBe(true);
  });

  test.each([
    ['artifactVersion'],
    ['generatedAt'],
    ['provenance'],
    ['readiness'],
    ['totals'],
    ['curves'],
    ['provenance', 'marketId'],
    ['provenance', 'period'],
    ['provenance', 'provider'],
    ['provenance', 'endpointVersion'],
    ['provenance', 'parserVersion'],
    ['provenance', 'rightsPolicyId'],
    ['provenance', 'sourceComplete'],
    ['provenance', 'sha256'],
    ['readiness', 'state'],
    ['readiness', 'maximumAgeDays'],
    ['readiness', 'minimumPairsPerAnchor'],
    ['totals', 'eligiblePairCount'],
    ['totals', 'excluded'],
    ['totals', 'excluded', 'cancelled'],
    ['totals', 'excluded', 'invalidMoney'],
    ['totals', 'excluded', 'differentBuildingOrArea'],
    ['curves', '0', 'housingType'],
    ['curves', '0', 'observedMinDepositWon'],
    ['curves', '0', 'observedMaxDepositWon'],
    ['curves', '0', 'anchors'],
    ['curves', '0', 'anchors', '0', 'depositWon'],
    ['curves', '0', 'anchors', '0', 'annualRate'],
    ['curves', '0', 'anchors', '0', 'pairCount'],
  ])('rejects a missing exact-schema key at %s', (...segments) => {
    expect(() => parse(withoutKey(segments))).toThrow('Invalid Korea conversion artifact');
  });

  test('rejects unknown keys at every artifact level', () => {
    const root = validArtifact();
    root.extra = true;
    const provenance = validArtifact();
    (provenance.provenance as Record<string, unknown>).extra = true;
    const anchor = validArtifact();
    const firstCurve = (anchor.curves as Record<string, unknown>[])[0]!;
    (firstCurve.anchors as Record<string, unknown>[])[0]!.extra = true;

    for (const candidate of [root, provenance, anchor]) {
      expect(() => parse(candidate)).toThrow('Invalid Korea conversion artifact');
    }
  });

  test.each([
    ['wrong artifact version', (value: Record<string, unknown>) => { value.artifactVersion = 2; }],
    ['wrong market', (value: Record<string, unknown>) => { (value.provenance as Record<string, unknown>).marketId = 'sg-singapore'; }],
    ['wrong period', (value: Record<string, unknown>) => { (value.provenance as Record<string, unknown>).period = '2026-04/2026-08'; }],
    ['wrong digest', (value: Record<string, unknown>) => { (value.provenance as Record<string, unknown>).sha256 = 'b'.repeat(64); }],
    ['incomplete source', (value: Record<string, unknown>) => { (value.provenance as Record<string, unknown>).sourceComplete = false; }],
    ['unready evidence', (value: Record<string, unknown>) => { (value.readiness as Record<string, unknown>).state = 'building'; }],
    ['future generation', (value: Record<string, unknown>) => { value.generatedAt = '2026-09-02T00:00:00.000Z'; }],
    ['stale generation', (value: Record<string, unknown>) => { value.generatedAt = '2026-06-01T00:00:00.000Z'; }],
  ] as const)('rejects %s', (_label, mutate) => {
    const value = validArtifact();
    mutate(value);
    expect(() => parse(value)).toThrow('Invalid Korea conversion artifact');
  });

  test('rejects revoked current display or commercial rights', () => {
    const noRights: KoreaConversionArtifactExpectation = {
      ...expectation,
      rightsLookup: () => undefined,
    };
    expect(() => parseKoreaConversionArtifact(
      validArtifact(),
      noRights,
      REFERENCE_INSTANT,
    )).toThrow('Invalid Korea conversion artifact');
  });

  test.each([
    ['unsupported housing type', (curve: Record<string, unknown>) => { curve.housingType = 'villa'; }],
    ['range minimum mismatch', (curve: Record<string, unknown>) => { curve.observedMinDepositWon = 1; }],
    ['range maximum mismatch', (curve: Record<string, unknown>) => { curve.observedMaxDepositWon = 1; }],
    ['one anchor', (curve: Record<string, unknown>) => { curve.anchors = [(curve.anchors as unknown[])[0]]; }],
    ['unordered anchors', (curve: Record<string, unknown>) => { curve.anchors = [...(curve.anchors as unknown[])].reverse(); }],
    ['zero rate', (curve: Record<string, unknown>) => { ((curve.anchors as Record<string, unknown>[])[0]!).annualRate = 0; }],
    ['rate of one', (curve: Record<string, unknown>) => { ((curve.anchors as Record<string, unknown>[])[0]!).annualRate = 1; }],
    ['pair count below threshold', (curve: Record<string, unknown>) => { ((curve.anchors as Record<string, unknown>[])[0]!).pairCount = 119; }],
  ] as const)('rejects %s', (_label, mutate) => {
    const value = validArtifact();
    mutate((value.curves as Record<string, unknown>[])[0]!);
    expect(() => parse(value)).toThrow('Invalid Korea conversion artifact');
  });

  test('rejects duplicate housing curves and contradictory total pair counts', () => {
    const duplicate = validArtifact();
    (duplicate.curves as Record<string, unknown>[])[1]!.housingType = 'apartment';
    const count = validArtifact();
    (count.totals as Record<string, unknown>).eligiblePairCount = 619;

    expect(() => parse(duplicate)).toThrow('Invalid Korea conversion artifact');
    expect(() => parse(count)).toThrow('Invalid Korea conversion artifact');
  });
});

describe('toBrowserConversionCurves', () => {
  test('projects only calculation evidence and excludes provider/digest/rights details', () => {
    const projection = toBrowserConversionCurves(parse());

    expect(projection).toEqual([
      {
        housingType: 'apartment',
        period: '2026-03/2026-08',
        generatedAt: '2026-08-31T00:00:00.000Z',
        anchors: [
          { deposit: 30_000_000, annualRate: 0.05, pairCount: 140 },
          { deposit: 100_000_000, annualRate: 0.04, pairCount: 160 },
        ],
      },
      {
        housingType: 'officetel',
        period: '2026-03/2026-08',
        generatedAt: '2026-08-31T00:00:00.000Z',
        anchors: [
          { deposit: 20_000_000, annualRate: 0.06, pairCount: 150 },
          { deposit: 80_000_000, annualRate: 0.05, pairCount: 170 },
        ],
      },
    ]);
    expect(JSON.stringify(projection)).not.toMatch(/MOLIT|sha256|rightsPolicyId|excluded/);
    expect(Object.isFrozen(projection)).toBe(true);
    expect(projection.every((curve) => Object.isFrozen(curve))).toBe(true);
    expect(projection.every((curve) => Object.isFrozen(curve.anchors))).toBe(true);
  });
});
