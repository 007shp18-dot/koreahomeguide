import { describe, expect, it } from 'vitest';

async function interpretation() {
  return import('../lib/public-market/evidence-interpretation');
}

describe('district evidence interpretation', () => {
  it.each([
    ['below the narrow boundary', 27, 'narrow'],
    ['at the moderate boundary', 28, 'moderate'],
    ['below the wide boundary', 54, 'moderate'],
    ['at the wide boundary', 55, 'wide'],
  ] as const)('classifies spread %s', async (_name, width, bucket) => {
    const { spreadVerdict } = await interpretation();

    const verdict = spreadVerdict({ p25: 100, med: 100, p75: 100 + width });

    expect(verdict).toMatchObject({
      status: 'interpretable',
      bucket,
      ratio: width / 100,
    });
    expect(Object.isFrozen(verdict)).toBe(true);
  });

  it.each([
    ['zero', 0],
    ['NaN', Number.NaN],
    ['positive infinity', Number.POSITIVE_INFINITY],
    ['negative infinity', Number.NEGATIVE_INFINITY],
  ])('does not interpret a %s median', async (_name, med) => {
    const { spreadVerdict } = await interpretation();

    const verdict = spreadVerdict({ p25: 80, med, p75: 120 });
    expect(verdict).toEqual({
      status: 'unavailable',
      bucket: null,
      ratio: null,
      label: 'Spread not interpretable',
      explanation: 'A positive finite median is required to interpret the middle-half spread.',
    });
    expect(Object.isFrozen(verdict)).toBe(true);
  });

  it.each([
    [
      'positive 10% equality',
      { pct: 10, nPrior: 40, nLatest: 40 },
      ['The absolute change is at least 10%.'],
    ],
    [
      'negative 10% equality',
      { pct: -10, nPrior: 40, nLatest: 40 },
      ['The absolute change is at least 10%.'],
    ],
    [
      'prior count below 30',
      { pct: 2, nPrior: 29, nLatest: 30 },
      ['The prior three-month sample is below 30.'],
    ],
    [
      'latest count below 30',
      { pct: 2, nPrior: 30, nLatest: 29 },
      ['The latest three-month sample is below 30.'],
    ],
    [
      'sample movement at 25% equality',
      { pct: 2, nPrior: 40, nLatest: 50 },
      ['The sample size changed by at least 25%.'],
    ],
    [
      'zero prior count',
      { pct: 2, nPrior: 0, nLatest: 40 },
      ['The prior three-month sample is below 30.'],
    ],
  ] as const)('marks %s as shaky', async (_name, input, reasons) => {
    const { changeReliability } = await interpretation();

    const verdict = changeReliability(input);

    expect(verdict.status).toBe('shaky');
    expect(verdict.reasons).toEqual(reasons);
    expect(verdict.label).toBe(`${input.pct > 0 ? '+' : ''}${input.pct.toFixed(1)}% · n ${input.nPrior} → ${input.nLatest}`);
    expect(verdict.sampleLabel).toBe(`n ${input.nPrior} → ${input.nLatest}`);
    expect(Object.isFrozen(verdict)).toBe(true);
    expect(Object.isFrozen(verdict.reasons)).toBe(true);
  });

  it('keeps values just inside every reliability boundary reliable', async () => {
    const { changeReliability } = await interpretation();

    expect(changeReliability({ pct: 9.9, nPrior: 40, nLatest: 49 })).toEqual({
      status: 'reliable',
      label: '+9.9% · n 40 → 49',
      sampleLabel: 'n 40 → 49',
      reasons: [],
    });
    expect(changeReliability({ pct: 9.9, nPrior: 30, nLatest: 30 }).status)
      .toBe('reliable');
  });

  it('fails closed when retained prior/latest counts are unavailable', async () => {
    const { changeReliability } = await interpretation();

    const verdict = changeReliability({ pct: 4.2, nPrior: null, nLatest: null });
    expect(verdict).toEqual({
      status: 'not_assessable',
      label: '3-month change not assessable',
      sampleLabel: null,
      reasons: ['Prior/latest sample counts were not retained in this snapshot.'],
    });
    expect(Object.isFrozen(verdict)).toBe(true);
    expect(Object.isFrozen(verdict.reasons)).toBe(true);
  });

  it.each([
    ['prior count alone', { pct: 4.2, nPrior: null, nLatest: 40 }],
    ['latest count alone', { pct: 4.2, nPrior: 40, nLatest: null }],
  ] as const)('fails closed when the %s is unavailable', async (_name, input) => {
    const { changeReliability } = await interpretation();

    expect(() => changeReliability(input)).not.toThrow();
    expect(changeReliability(input)).toEqual({
      status: 'not_assessable',
      label: '3-month change not assessable',
      sampleLabel: null,
      reasons: ['Prior/latest sample counts were not retained in this snapshot.'],
    });
  });

  it('classifies the exact 60-whole-day month boundary as complete', async () => {
    const { classifyCalendarMonth } = await interpretation();

    expect(classifyCalendarMonth('2026-07', '2026-09-30T00:00:00.000Z')).toBe('complete');
    expect(classifyCalendarMonth('2026-07', '2026-09-29T23:59:59.999Z'))
      .toBe('filing_in_progress');
  });

  it('classifies current and future calendar months as filing in progress', async () => {
    const { classifyCalendarMonth } = await interpretation();
    const referenceInstant = '2026-09-01T00:00:00.000Z';

    expect(classifyCalendarMonth('2026-09', referenceInstant)).toBe('filing_in_progress');
    expect(classifyCalendarMonth('2026-10', referenceInstant)).toBe('filing_in_progress');
  });

  it('freezes the declared period, month rows, and legend presentation', async () => {
    const { evidencePeriod } = await interpretation();

    const period = evidencePeriod('2026-01/2026-07', '2026-09-01T00:00:00.000Z');

    expect(Object.isFrozen(period)).toBe(true);
    expect(Object.isFrozen(period.months)).toBe(true);
    expect(period.months.every(Object.isFrozen)).toBe(true);
    expect(Object.isFrozen(period.legend)).toBe(true);
    expect(period.legend.every(Object.isFrozen)).toBe(true);
  });

  it.each([
    ['malformed', '2026-13/2026-14'],
    ['reversed', '2026-07/2026-01'],
  ] as const)('fails closed without throwing for a %s period', async (_name, period) => {
    const { evidencePeriod } = await interpretation();

    expect(() => evidencePeriod(period, '2026-09-01T00:00:00.000Z')).not.toThrow();
    const result = evidencePeriod(period, '2026-09-01T00:00:00.000Z');
    expect(result).toEqual({
      months: [],
      legend: [
        { state: 'complete', label: 'Complete' },
        { state: 'filing_in_progress', label: 'Filing in progress' },
      ],
      caveat: 'Declared period classification unavailable.',
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.months)).toBe(true);
    expect(Object.isFrozen(result.legend)).toBe(true);
  });
});
