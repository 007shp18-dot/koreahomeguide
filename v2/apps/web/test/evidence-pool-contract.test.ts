import { describe, expect, it } from 'vitest';
import { parseEvidence, parseSource, readiness, parseCommand } from '../lib/evidence-pool/contract';

export const sampleEvidence = {
  conditions: 'Annual common area charges',
  sourceId: '11111111-1111-4111-8111-111111111111', market: 'dubai', tier: 'supporting',
  metric: 'service_charge', basis: 'invoiced', amount: 12000, currency: 'AED', unit: 'annual',
  area: 'Dubai Marina', building: 'Example Tower', sizeSqm: 80,
  observedOn: '2026-09-01', expiresOn: '2026-12-01', url: 'https://example.com/charges',
} as const;

describe('evidence pool input boundaries', () => {
  it('keeps valid structured values without coercing prices', () => {
    expect(parseEvidence(sampleEvidence)).toEqual(sampleEvidence);
    expect(parseEvidence({ ...sampleEvidence, amount: '12000' })).toBeNull();
  });
  it.each([
    { author: 'person' }, { rawPost: 'text' }, { amount: -1 }, { amount: Infinity },
    { observedOn: '2026-02-30' }, { expiresOn: '2026-08-01' }, { sizeSqm: 0 },
    { url: 'javascript:alert(1)' }, { url: 'https://user:password@example.com' }, { currency: 'KRW' },
  ])('rejects unsafe or inconsistent fields %j', (change) => {
    expect(parseEvidence({ ...sampleEvidence, ...change })).toBeNull();
  });
  it('does not let source registration approve itself', () => {
    const source = { name: 'DLD', url: 'https://example.com', kind: 'official' };
    expect(parseSource(source)).toEqual(source);
    expect(parseSource({ ...source, status: 'approved' })).toBeNull();
  });
  it('requires optimistic versions and a reason for review', () => {
    expect(parseCommand({ action: 'review', entity: 'evidence', id: sampleEvidence.sourceId, version: 1, status: 'approved', reason: 'Checked source' })).not.toBeNull();
    expect(parseCommand({ action: 'review', entity: 'evidence', id: sampleEvidence.sourceId, version: 0, status: 'approved', reason: '' })).toBeNull();
  });
  it('excludes expired, withdrawn-source and community reports from quantitative use', () => {
    const row = { ...sampleEvidence, status: 'approved', sourceStatus: 'approved', sourceKind: 'official' } as const;
    expect(readiness(row, '2026-09-09').ready).toBe(true);
    expect(readiness({ ...row, sourceStatus: 'withdrawn' }, '2026-09-09').ready).toBe(false);
    expect(readiness({ ...row, sourceKind: 'community' }, '2026-09-09').ready).toBe(false);
    expect(readiness(row, '2026-12-02').reasons).toContain('유효기간 만료');
    expect(readiness({ ...row, building: '' }, '2026-09-09').reasons).toContain('주소 또는 지역·단지명 필요');
  });
});
