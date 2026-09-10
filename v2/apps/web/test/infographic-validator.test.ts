import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  stableInfographicHash,
  validateInfographicRenderRecord,
  validateInfographicSpec,
} from '../lib/infographics/infographic-validator';
import { createInfographicRepository } from '../lib/infographics/infographic-repository.server';

function spec(overrides: Record<string, unknown> = {}) {
  return {
    id: 'seoul-district-comparison',
    template: 'district-comparison',
    locale: 'en',
    title: 'District evidence compared',
    accessibleSummary: 'Reported medians for two districts in one released period.',
    evidenceReleaseIds: ['release-seoul-2026-08'],
    unit: 'KRW',
    period: { start: '2026-08-01', end: '2026-08-31' },
    series: [{
      id: 'median', label: 'Reported median', currency: 'KRW',
      values: [
        { label: 'Gangnam-gu', value: 1_000_000_000, evidenceReleaseId: 'release-seoul-2026-08' },
        { label: 'Mapo-gu', value: 700_000_000, evidenceReleaseId: 'release-seoul-2026-08' },
      ],
    }],
    sourceLabel: 'MOLIT reported contracts',
    sampleLabel: '42 compatible reported contracts',
    relatedHref: '/kr/seoul/explore/',
    conversionProvenance: null,
    ...overrides,
  };
}

describe('infographic validation', () => {
  it('accepts a bounded evidence-linked spec and hashes it reproducibly', () => {
    const valid = validateInfographicSpec(spec());
    expect(valid.id).toBe('seoul-district-comparison');
    expect(stableInfographicHash(valid)).toMatch(/^[a-f0-9]{64}$/);
    expect(stableInfographicHash(valid)).toBe(stableInfographicHash(spec()));
  });

  it('rejects missing or out-of-release evidence links', () => {
    expect(() => validateInfographicSpec(spec({ evidenceReleaseIds: [] }))).toThrow('evidence release');
    expect(() => validateInfographicSpec(spec({
      series: [{ id: 'median', label: 'Median', values: [
        { label: 'Gangnam-gu', value: 1, evidenceReleaseId: 'unlinked-release' },
      ] }],
    }))).toThrow('linked evidence release');
  });

  it('rejects more than five series, empty labels, and invalid periods', () => {
    const oneSeries = spec().series[0];
    expect(() => validateInfographicSpec(spec({
      series: Array.from({ length: 6 }, (_, index) => ({ ...oneSeries, id: `series-${index}` })),
    }))).toThrow('five series');
    expect(() => validateInfographicSpec(spec({
      series: [{ ...oneSeries, label: ' ' }],
    }))).toThrow('label');
    expect(() => validateInfographicSpec(spec({
      period: { start: '2026-09-01', end: '2026-08-01' },
    }))).toThrow('period');
  });

  it('requires conversion provenance for mixed currencies', () => {
    const first = spec().series[0];
    expect(() => validateInfographicSpec(spec({
      evidenceReleaseIds: ['release-seoul-2026-08', 'release-sg-2026-q2'],
      series: [first, {
        ...first, id: 'singapore', label: 'Singapore median', currency: 'SGD',
        values: [{ label: 'OCR', value: 2_000_000, evidenceReleaseId: 'release-sg-2026-q2' }],
      }],
    }))).toThrow('conversion provenance');
  });

  it('validates reproducible publish-time render records', () => {
    const validSpec = validateInfographicSpec(spec());
    const render = validateInfographicRenderRecord({
      id: 'render-one', infographicId: validSpec.id, rendererVersion: 'infographic-renderer-v1',
      specHash: stableInfographicHash(validSpec), width: 1200, height: 675, format: 'png',
      generatedAt: '2026-09-04T00:00:00.000Z', objectUrl: 'https://cdn.signedprice.com/infographics/render-one.png',
      evidenceReleaseIds: validSpec.evidenceReleaseIds, ownership: 'owned',
    });
    expect(render.format).toBe('png');
    expect(() => validateInfographicRenderRecord({ ...render, specHash: 'bad' })).toThrow('hash');
    expect(() => validateInfographicRenderRecord({ ...render, objectUrl: 'http://example.com/a.png' })).toThrow('object URL');
    expect(() => validateInfographicRenderRecord({ ...render, ownership: 'external' })).toThrow('owned');
  });

  it('keeps render records attached to the exact registered specification hash', () => {
    const validSpec = validateInfographicSpec(spec());
    const repository = createInfographicRepository([validSpec]);
    const render = {
      id: 'render-one', infographicId: validSpec.id, rendererVersion: 'infographic-renderer-v1',
      specHash: stableInfographicHash(validSpec), width: 1200, height: 675, format: 'png' as const,
      generatedAt: '2026-09-04T00:00:00.000Z', objectUrl: 'https://cdn.signedprice.com/infographics/render-one.png',
      evidenceReleaseIds: validSpec.evidenceReleaseIds, ownership: 'owned' as const,
    };
    expect(repository.addRender(render).id).toBe('render-one');
    expect(repository.listRenders(validSpec.id)).toHaveLength(1);
    expect(() => repository.addRender({ ...render, id: 'render-two', specHash: '0'.repeat(64) }))
      .toThrow('specification hash');
  });
});
