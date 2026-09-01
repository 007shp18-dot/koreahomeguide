import { describe, expect, it } from 'vitest';

import { buildPublicCommunityAggregate } from '../lib/community/community-aggregate';

function counts(
  higher: number,
  similar: number,
  lower: number,
  reasons: readonly Readonly<{ reason: string; count: number }>[] = [],
) {
  return {
    total: higher + similar + lower,
    directions: [
      { direction: 'HIGHER', count: higher },
      { direction: 'SIMILAR', count: similar },
      { direction: 'LOWER', count: lower },
    ],
    reasons,
  };
}

describe('public Community aggregate', () => {
  it.each([
    counts(0, 0, 0),
    counts(2, 1, 1),
  ])('reveals no exact count or breakdown below five', (input) => {
    const aggregate = buildPublicCommunityAggregate(input);

    expect(aggregate).toEqual({ status: 'collecting' });
    expect(JSON.stringify(aggregate)).not.toMatch(/total|count|HIGHER|SIMILAR|LOWER/);
    expect(Object.isFrozen(aggregate)).toBe(true);
  });

  it('publishes all three directions at five', () => {
    const aggregate = buildPublicCommunityAggregate(counts(2, 2, 1));

    expect(aggregate).toEqual({
      status: 'published',
      total: 5,
      directions: [
        { direction: 'HIGHER', count: 2, percent: 40 },
        { direction: 'SIMILAR', count: 2, percent: 40 },
        { direction: 'LOWER', count: 1, percent: 20 },
      ],
      reasons: [],
      otherResponses: 5,
    });
    if (aggregate.status !== 'published') throw new Error('Expected published aggregate.');
    expect(aggregate.directions.reduce((sum, item) => sum + item.percent, 0)).toBe(100);
    expect(Object.isFrozen(aggregate)).toBe(true);
    expect(Object.isFrozen(aggregate.directions)).toBe(true);
  });

  it('uses deterministic largest-remainder rounding to exactly one hundred', () => {
    const aggregate = buildPublicCommunityAggregate(counts(2, 2, 3));
    if (aggregate.status !== 'published') throw new Error('Expected published aggregate.');

    expect(aggregate.directions.map(({ percent }) => percent)).toEqual([29, 28, 43]);
    expect(aggregate.directions.reduce((sum, item) => sum + item.percent, 0)).toBe(100);
  });

  it('publishes only reason labels whose own count reaches five', () => {
    const aggregate = buildPublicCommunityAggregate(counts(7, 5, 3, [
      { reason: 'LINE', count: 5 },
      { reason: 'VIEW', count: 4 },
      { reason: 'NOISE', count: 1 },
    ]));
    if (aggregate.status !== 'published') throw new Error('Expected published aggregate.');

    expect(aggregate.reasons).toEqual([{ reason: 'LINE', count: 5 }]);
    expect(aggregate.otherResponses).toBe(10);
    expect(JSON.stringify(aggregate)).not.toMatch(/VIEW|NOISE/);
    expect(Object.isFrozen(aggregate.reasons)).toBe(true);
  });

  it.each([
    ['negative total', { ...counts(2, 2, 1), total: -1 }],
    ['unsafe total', { ...counts(2, 2, 1), total: Number.MAX_SAFE_INTEGER + 1 }],
    ['direction sum mismatch', { ...counts(2, 2, 1), total: 6 }],
    ['duplicate direction', {
      ...counts(2, 2, 1),
      directions: [
        { direction: 'HIGHER', count: 2 },
        { direction: 'HIGHER', count: 2 },
        { direction: 'LOWER', count: 1 },
      ],
    }],
    ['unknown direction', {
      ...counts(2, 2, 1),
      directions: [
        { direction: 'HIGHER', count: 2 },
        { direction: 'SIMILAR', count: 2 },
        { direction: 'UP', count: 1 },
      ],
    }],
    ['reason sum exceeds total', counts(2, 2, 1, [{ reason: 'LINE', count: 6 }])],
    ['duplicate reason', counts(7, 3, 1, [
      { reason: 'LINE', count: 5 },
      { reason: 'LINE', count: 5 },
    ])],
    ['unknown reason', counts(3, 2, 1, [{ reason: 'PRICE', count: 5 }])],
    ['fractional count', counts(2, 2, 1, [{ reason: 'LINE', count: 1.5 }])],
  ])('rejects invalid raw counts: %s', (_name, input) => {
    expect(() => buildPublicCommunityAggregate(input)).toThrow(
      'Invalid Community aggregate counts.',
    );
  });
});
