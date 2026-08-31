import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { buildPublicAreaRankingsModel } from '../lib/public-market/rankings-route-model.server';
import {
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaFixture,
} from './public-area-fixture';

function rankedArtifact() {
  return createPublicAreaFixture({
    publishedMedians: {
      'jongno-gu': 200_000_000,
      'jung-gu': 100_000_000,
      'yongsan-gu': 100_000_000,
      'seongdong-gu': 300_000_000,
    },
    publishedOverrides: {
      'jongno-gu': {
        n: 7,
        min: 160_000_000,
        p25: 180_000_000,
        med: 200_000_000,
        p75: 220_000_000,
        max: 240_000_000,
        chg3m: -5,
      },
      'jung-gu': {
        n: 9,
        min: 60_000_000,
        p25: 80_000_000,
        med: 100_000_000,
        p75: 150_000_000,
        max: 170_000_000,
        chg3m: 2,
      },
      'yongsan-gu': {
        n: 9,
        min: 70_000_000,
        p25: 90_000_000,
        med: 100_000_000,
        p75: 110_000_000,
        max: 130_000_000,
        chg3m: null,
      },
      'seongdong-gu': {
        n: 5,
        min: 100_000_000,
        p25: 200_000_000,
        med: 300_000_000,
        p75: 400_000_000,
        max: 500_000_000,
        chg3m: 0,
      },
    },
  });
}

function build(source: unknown = rankedArtifact(), period = PUBLIC_AREA_FIXTURE_PERIOD) {
  return buildPublicAreaRankingsModel({ source, period });
}

describe('Seoul public district rankings model', () => {
  it('derives all four raw-number rankings with legal-code tie breaks', () => {
    const model = build();
    expect(model.status).toBe('ready');
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    expect(model.cheapest.map(({ slug }) => slug)).toEqual([
      'jung-gu',
      'yongsan-gu',
      'jongno-gu',
      'seongdong-gu',
    ]);
    expect(model.change.map(({ slug }) => slug)).toEqual([
      'jongno-gu',
      'seongdong-gu',
      'jung-gu',
    ]);
    expect(model.spread.map(({ slug, metric }) => [slug, metric])).toEqual([
      ['seongdong-gu', 200_000_000],
      ['jung-gu', 70_000_000],
      ['jongno-gu', 40_000_000],
      ['yongsan-gu', 20_000_000],
    ]);
    expect(model.sample.map(({ slug }) => slug)).toEqual([
      'jung-gu',
      'yongsan-gu',
      'jongno-gu',
      'seongdong-gu',
    ]);
    expect(model.cheapest.map(({ rank }) => rank)).toEqual([1, 2, 3, 4]);
  });

  it('omits withheld rows everywhere and null change only from change', () => {
    const model = build();
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    expect(model.withheldDistrictCount).toBe(21);
    expect(model.changeExcludedDistrictCount).toBe(22);
    expect(model.cheapest).toHaveLength(4);
    expect(model.change).toHaveLength(3);
    expect(model.spread).toHaveLength(4);
    expect(model.sample).toHaveLength(4);
  });

  it('uses legal-code order when every primary metric ties', () => {
    const artifact = createPublicAreaFixture({
      publishedMedians: { 'jongno-gu': 100_000_000, 'jung-gu': 100_000_000 },
      publishedOverrides: {
        'jongno-gu': { n: 7, chg3m: 1 },
        'jung-gu': { n: 7, chg3m: 1 },
      },
    });
    const model = build(artifact);
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    for (const rows of [model.cheapest, model.change, model.spread, model.sample]) {
      expect(rows.map(({ slug }) => slug)).toEqual(['jongno-gu', 'jung-gu']);
    }
  });

  it('formats values and derives symmetric signed-bar geometry', () => {
    const model = build();
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    expect(model.cheapest[0]).toMatchObject({
      valueLabel: '₩100,000,000',
      metric: 100_000_000,
      bar: null,
    });
    expect(model.changeAxisLabel).toEqual({ minimum: '-5.0%', maximum: '+5.0%' });
    expect(model.change[0]).toMatchObject({
      valueLabel: '-5.0%',
      bar: { direction: 'negative', startPct: 0, endPct: 50, extentPct: 50 },
    });
    expect(model.change[1]).toMatchObject({
      valueLabel: '0.0%',
      bar: { direction: 'zero', startPct: 50, endPct: 50, extentPct: 0 },
    });
    expect(model.change[2]).toMatchObject({
      valueLabel: '+2.0%',
      bar: { direction: 'positive', startPct: 50, endPct: 70, extentPct: 20 },
    });
    expect(model.spread.at(0)?.valueLabel).toBe('₩200,000,000');
    expect(model.sample.at(0)?.valueLabel).toBe('9');
    expect(model.hasNegativeChange).toBe(true);
  });

  it.each([
    { name: 'positive-only', values: [1, 4], directions: ['positive', 'positive'], negative: false },
    { name: 'negative-only', values: [-4, -1], directions: ['negative', 'negative'], negative: true },
    { name: 'all-zero', values: [0, 0], directions: ['zero', 'zero'], negative: false },
  ])('handles $name change inputs', ({ name, values, directions, negative }) => {
    const artifact = createPublicAreaFixture({
      publishedMedians: { 'jongno-gu': 100_000_000, 'jung-gu': 110_000_000 },
      publishedOverrides: {
        'jongno-gu': { chg3m: values[0] },
        'jung-gu': { chg3m: values[1] },
      },
    });
    const model = build(artifact);
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    expect(model.change.map(({ bar }) => bar?.direction)).toEqual(directions);
    expect(model.hasNegativeChange).toBe(negative);
    if (name === 'all-zero') {
      expect(model.changeAxisLabel).toEqual({ minimum: '0.0%', maximum: '0.0%' });
      expect(model.change.every(({ bar }) => bar?.extentPct === 0)).toBe(true);
    }
  });

  it('returns explicit empty lists for a valid artifact with no published district', () => {
    const model = build(createPublicAreaFixture({ publishedMedians: {} }));
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    expect(model.cheapest).toEqual([]);
    expect(model.change).toEqual([]);
    expect(model.spread).toEqual([]);
    expect(model.sample).toEqual([]);
    expect(model.withheldDistrictCount).toBe(25);
    expect(model.changeExcludedDistrictCount).toBe(25);
  });

  it('does not mutate source data and recursively freezes ready output', () => {
    const artifact = rankedArtifact();
    const before = structuredClone(artifact);
    const model = build(artifact);
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    expect(artifact).toEqual(before);
    expect(Object.isFrozen(model)).toBe(true);
    expect(Object.isFrozen(model.cheapest)).toBe(true);
    expect(Object.isFrozen(model.cheapest[0])).toBe(true);
    expect(Object.isFrozen(model.change[0]?.bar)).toBe(true);
    expect(Object.isFrozen(model.changeAxisLabel)).toBe(true);
  });

  it.each([
    ['invalid artifact', { nope: true }, PUBLIC_AREA_FIXTURE_PERIOD],
    ['period mismatch', rankedArtifact(), '2025-01/2025-07'],
  ])('fails closed for %s', (_name, source, period) => {
    const model = build(source, period);

    expect(model).toMatchObject({
      status: 'unavailable',
      message: 'Verified district summary unavailable',
    });
    expect(model).not.toHaveProperty('cheapest');
    expect(JSON.stringify(model)).not.toMatch(/100000000|200000000|300000000/);
  });
});
