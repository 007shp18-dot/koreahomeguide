import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createPolicyRepository,
  validatePolicyLifecycle,
} from '../lib/policy/policy-repository.server';
import type { PolicyRecord } from '../lib/policy/policy-types';

function policy(overrides: Partial<PolicyRecord> = {}): PolicyRecord {
  return Object.freeze({
    id: 'policy-1', slug: 'policy-one', marketId: 'kr-seoul',
    title: 'Policy one', summary: 'A reviewed policy lifecycle.', status: 'effective',
    announcedOn: '2025-01-01', enactedOn: '2025-02-01', effectiveOn: '2025-03-01',
    expiresOn: null, lastCheckedOn: '2025-03-02', affectedGroups: ['Renters'],
    source: Object.freeze({
      publisher: 'Official authority', title: 'Official policy notice',
      href: 'https://example.gov/policy', checkedAt: '2025-03-02',
    }),
    events: Object.freeze([
      Object.freeze({ type: 'announcement', date: '2025-01-01', label: 'Announced' }),
      Object.freeze({ type: 'enacted', date: '2025-02-01', label: 'Enacted' }),
      Object.freeze({ type: 'effective', date: '2025-03-01', label: 'Effective' }),
    ]),
    beforeAfter: null,
    ...overrides,
  });
}

describe('policy lifecycle', () => {
  it('rejects effective policies without an effective date', () => {
    expect(() => validatePolicyLifecycle(policy({ effectiveOn: null })))
      .toThrow('effective date');
  });

  it('rejects expiry before announcement and non-official source URLs', () => {
    expect(() => validatePolicyLifecycle(policy({
      status: 'expired', expiresOn: '2024-12-31',
    }))).toThrow('expiry');
    expect(() => validatePolicyLifecycle(policy({
      source: { ...policy().source, href: 'http://example.gov/policy' },
    }))).toThrow('source');
  });

  it('groups effective-soon, recently changed, active, and archived policies', () => {
    const repository = createPolicyRepository([
      policy({ id: 'soon', slug: 'soon', status: 'announced', effectiveOn: '2025-05-20' }),
      policy({ id: 'recent', slug: 'recent', status: 'amended', announcedOn: '2023-01-01', enactedOn: null, effectiveOn: '2024-01-01', events: [
        { type: 'announcement', date: '2023-01-01', label: 'Announced' },
        { type: 'effective', date: '2024-01-01', label: 'Effective' },
        { type: 'amended', date: '2025-03-15', label: 'Amended' },
      ] }),
      policy({ id: 'active', slug: 'active' }),
      policy({ id: 'expired', slug: 'expired', status: 'expired', expiresOn: '2025-01-01' }),
    ]);
    const groups = repository.group('2025-04-01');

    expect(groups.effectiveSoon.map(({ id }) => id)).toEqual(['soon']);
    expect(groups.recentlyChanged.map(({ id }) => id)).toEqual(['recent']);
    expect(groups.active.map(({ id }) => id)).toContain('active');
    expect(groups.archive.map(({ id }) => id)).toEqual(['expired']);
  });
});
