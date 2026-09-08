import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { buildPublicAreaRankingsModel } from '../lib/public-market/rankings-route-model.server';
import { DistrictRankings } from '../components/public-market/district-rankings';
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

const REFERENCE_INSTANT = '2026-09-01T00:00:00.000Z';

function build(source: unknown = rankedArtifact(), period = PUBLIC_AREA_FIXTURE_PERIOD, page = 1) {
  return buildPublicAreaRankingsModel({ source, period, referenceInstant: REFERENCE_INSTANT, page });
}

describe('Seoul public district rankings model', () => {
  it('ranks the median high to low with legal-code tie breaks', () => {
    const model = build();
    expect(model.status).toBe('ready');
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    expect(model.median.map(({ slug }) => slug)).toEqual([
      'seongdong-gu',
      'jongno-gu',
      'jung-gu',
      'yongsan-gu',
    ]);
    expect(model.change).toEqual([]);
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
    expect(model.median.map(({ rank }) => rank)).toEqual([1, 2, 3, 4]);
  });

  it('omits withheld rows everywhere and excludes every uncounted stored change', () => {
    const model = build();
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    expect(model.withheldDistrictCount).toBe(21);
    expect(model.changeExcludedDistrictCount).toBe(25);
    expect(model.median).toHaveLength(4);
    expect(model.change).toHaveLength(0);
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

    for (const rows of [model.median, model.spread, model.sample]) {
      expect(rows.map(({ slug }) => slug)).toEqual(['jongno-gu', 'jung-gu']);
    }
    expect(model.change).toEqual([]);
  });

  it('formats retained ranking values and explains why change is not assessable', () => {
    const model = build();
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    expect(model.median[0]).toMatchObject({
      valueLabel: '₩300,000,000',
      metric: 300_000_000,
      bar: null,
    });
    expect(model.changeAxisLabel).toEqual({ minimum: '0.0%', maximum: '0.0%' });
    expect(model.changeInterpretation).toEqual({
      status: 'not_assessable',
      title: 'Three-month change not assessable',
      definition: 'Prior/latest sample counts were not retained in this snapshot.',
      note: 'Stored change values are excluded from rankings until both comparison counts are retained.',
    });
    expect(model.spread.at(0)?.valueLabel).toBe('₩200,000,000');
    expect(model.spread.at(0)?.distribution).toMatchObject({
      published: true,
      min: 100_000_000,
      p25: 200_000_000,
      med: 300_000_000,
      p75: 400_000_000,
      max: 500_000_000,
    });
    expect(model.spread.at(0)?.plotAxis).toEqual({ min: 60_000_000, max: 500_000_000 });
    expect(model.median.every(({ distribution }) => distribution === null)).toBe(true);
    expect(model.sample.every(({ distribution }) => distribution === null)).toBe(true);
    expect(model.sample.at(0)?.valueLabel).toBe('9');
    expect(model.hasNegativeChange).toBe(false);
  });

  it.each([
    { name: 'positive-only', values: [1, 4] },
    { name: 'negative-only', values: [-4, -1] },
    { name: 'all-zero', values: [0, 0] },
  ])('excludes $name change inputs when prior/latest counts were not retained', ({ values }) => {
    const artifact = createPublicAreaFixture({
      publishedMedians: { 'jongno-gu': 100_000_000, 'jung-gu': 110_000_000 },
      publishedOverrides: {
        'jongno-gu': { chg3m: values[0] },
        'jung-gu': { chg3m: values[1] },
      },
    });
    const model = build(artifact);
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    expect(model.change).toEqual([]);
    expect(model.hasNegativeChange).toBe(false);
    expect(model.changeExcludedDistrictCount).toBe(25);
  });

  it('renders classified periods while leaving unsupported change metrics out of the public selector', () => {
    const model = build();
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    const html = renderToStaticMarkup(createElement(DistrictRankings, { model }));

    expect(html).not.toContain('Three-month change not assessable');
    expect(html).not.toContain('Prior/latest sample counts were not retained in this snapshot.');
    expect(html).not.toContain('Stored change values are excluded from rankings');
    expect(html).not.toMatch(/[+-](?:2\.0|5\.0)%/);
    expect(html).not.toContain('two completed windows');
    expect(html).not.toContain('Four comparisons');
    expect(html.match(/data-month-state="complete"/g)).toHaveLength(6);
    expect(html.match(/data-month-state="filing_in_progress"/g)).toHaveLength(1);
    expect(html).toContain('Complete');
    expect(html).toContain('Filing in progress');
    expect(html.match(/data-plot-variant="compact"/g)).toHaveLength(4);
    expect(html.match(/data-ranking-distribution=/g)).toHaveLength(4);
    expect(html).toContain('aria-describedby=');
  });

  it('returns explicit empty lists for a valid artifact with no published district', () => {
    const model = build(createPublicAreaFixture({ publishedMedians: {} }));
    if (model.status !== 'ready') throw new Error('Expected ready rankings');

    expect(model.median).toEqual([]);
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
    expect(Object.isFrozen(model.median)).toBe(true);
    expect(Object.isFrozen(model.median[0])).toBe(true);
    expect(Object.isFrozen(model.changeInterpretation)).toBe(true);
    expect(Object.isFrozen(model.period)).toBe(true);
    expect(Object.isFrozen(model.period.months)).toBe(true);
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
    expect(model).not.toHaveProperty('median');
    expect(JSON.stringify(model)).not.toMatch(/100000000|200000000|300000000/);
  });

  it('assigns stable global ranks before slicing adjacent pages', () => {
    const pageOne = build(createPublicAreaFixture(), PUBLIC_AREA_FIXTURE_PERIOD, 1);
    const pageTwo = build(createPublicAreaFixture(), PUBLIC_AREA_FIXTURE_PERIOD, 2);
    if (pageOne.status !== 'ready' || pageTwo.status !== 'ready') throw new Error('Expected ready rankings');

    expect(pageOne.median).toHaveLength(20);
    expect(pageOne.median.map(({ rank }) => rank)).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
    expect(pageTwo.median.map(({ rank }) => rank)).toEqual([21, 22, 23, 24, 25]);
    expect(pageOne.median.at(-1)?.metric).toBeGreaterThanOrEqual(pageTwo.median[0]!.metric);
    expect(new Set([...pageOne.median, ...pageTwo.median].map(({ lawdCd }) => lawdCd)).size).toBe(25);
    expect(pageTwo.pagination).toMatchObject({ page: 2, pageSize: 20, total: 25, pageCount: 2 });
  });
});
