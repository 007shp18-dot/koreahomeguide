import { describe, expect, it } from 'vitest';

import {
  createCorrectionLedger,
  createEvidenceDescriptor,
  createEvidenceEmptyState,
  type Correction,
} from '../src';

const readyEvidence = {
  marketId: 'kr-seoul',
  provider: 'MOLIT',
  dataset: 'reported rent contracts',
  period: '2026-01/2026-07',
  generatedAt: '2026-08-30T00:00:00.000Z',
  state: 'ready' as const,
  publicationMinimum: 5,
  methodologyId: 'kr-jeonse-45-55-v1',
  rightsPolicyId: 'kr-molit-rent-v1',
};

function correction(overrides: Partial<Correction> = {}): Correction {
  return {
    id: 'kr-2026-001',
    date: '2026-08-30',
    marketId: 'kr-seoul',
    scope: 'district-summary',
    status: 'FIXED',
    raisedBy: 'USER',
    summary: 'Corrected a district label without changing evidence values.',
    ...overrides,
  };
}

describe('global trust contracts', () => {
  it('creates a deeply frozen evidence descriptor without market-specific logic', () => {
    const descriptor = createEvidenceDescriptor(readyEvidence);
    const mutable = descriptor as unknown as { provider: string };

    try {
      mutable.provider = 'Invented provider';
    } catch {
      // Strict-mode mutation of a frozen contract is expected to throw.
    }

    expect(descriptor).toEqual(readyEvidence);
    expect(descriptor.provider).toBe('MOLIT');
    expect(Object.isFrozen(descriptor)).toBe(true);
  });

  it.each([
    [{ ...readyEvidence, marketId: ' ' }],
    [{ ...readyEvidence, generatedAt: 'yesterday' }],
    [{ ...readyEvidence, generatedAt: '2026-08-30' }],
    [{ ...readyEvidence, publicationMinimum: -1 }],
    [{ ...readyEvidence, publicationMinimum: 1.5 }],
    [{ ...readyEvidence, publicationMinimum: Number.MAX_SAFE_INTEGER + 1 }],
    [{ ...readyEvidence, state: 'unknown' }],
  ])('rejects an invalid evidence descriptor %#', (input) => {
    expect(() => createEvidenceDescriptor(input)).toThrow('Invalid evidence descriptor.');
  });

  it('maps insufficient evidence to a complete immutable empty state', () => {
    const state = createEvidenceEmptyState({
      code: 'INSUFFICIENT',
      count: 4,
      threshold: 5,
    });

    expect(state).toEqual({
      title: 'Evidence is not published',
      reason: '4 records met the filter; at least 5 are required.',
      nextAction: 'Broaden the evidence scope or return after the next completed period.',
      detail: { code: 'INSUFFICIENT', count: 4, threshold: 5 },
    });
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.detail)).toBe(true);
  });

  it.each([
    [{ code: 'INSUFFICIENT', count: 5, threshold: 5 }],
    [{ code: 'INSUFFICIENT', count: -1, threshold: 5 }],
    [{ code: 'NOT_REPORTABLE', note: ' ' }],
    [{ code: 'NOT_LOADED', market: '' }],
    [{ code: 'RIGHTS_BLOCKED', source: ' ' }],
    [{ code: 'SOURCE_UNAVAILABLE', retryable: 'yes' }],
    [{ code: 'UNKNOWN' }],
  ])('rejects an invalid empty reason %#', (reason) => {
    expect(() => createEvidenceEmptyState(reason)).toThrow(
      'Invalid evidence empty state.',
    );
  });

  it('sorts corrections newest first and freezes a cloned ledger', () => {
    const input = [
      correction({ id: 'older', date: '2026-08-01', status: 'UPHELD' }),
      correction({ id: 'newer', date: '2026-08-30', status: 'FIXED' }),
    ];
    const ledger = createCorrectionLedger(input);

    input.reverse();

    expect(ledger.map(({ id, status }) => ({ id, status }))).toEqual([
      { id: 'newer', status: 'FIXED' },
      { id: 'older', status: 'UPHELD' },
    ]);
    expect(Object.isFrozen(ledger)).toBe(true);
    expect(ledger.every(Object.isFrozen)).toBe(true);
  });

  it('accepts an empty correction ledger without inventing records', () => {
    const ledger = createCorrectionLedger([]);

    expect(ledger).toEqual([]);
    expect(Object.isFrozen(ledger)).toBe(true);
  });

  it.each([
    [[correction(), correction()]],
    [[correction({ id: '' })]],
    [[correction({ date: '30 August 2026' })]],
    [[correction({ status: 'OPEN' as Correction['status'] })]],
    [[correction({ raisedBy: 'PARTNER' as Correction['raisedBy'] })]],
    [[correction({ summary: ' ' })]],
  ])('rejects an invalid correction ledger %#', (records) => {
    expect(() => createCorrectionLedger(records)).toThrow('Invalid correction ledger.');
  });
});
