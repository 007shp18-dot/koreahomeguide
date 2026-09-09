import { describe, expect, it, vi } from 'vitest';
import { applyEvidenceBackfill, planEvidenceBackfill, type Corroboration, type ExistingEvidence } from '../lib/evidence-pool/backfill.server';
vi.mock('server-only', () => ({}));
const row: ExistingEvidence = { id: 'a6090900-0002-4000-8000-000000000002', version: 1, status: 'pending', data: {
 sourceId: 'a6090900-0002-4000-8000-000000000002', market: 'singapore', tier: 'essential', metric: 'rent', basis: 'reported',
 amount: 2500, currency: 'SGD', unit: 'monthly', area: 'BEDOK', building: '1 BEDOK ROAD', sizeSqm: null, observedOn: '2026-09-09', expiresOn: '2026-12-08', url: 'https://data.gov.sg/' } };
const candidate: Corroboration = { ...row.data, observedOn: undefined, month: '2026-08', address: '1 BEDOK ROAD, Singapore', housingType: 'HDB 3-ROOM', conditions: 'Approval month 2026-08; floor area not provided', reference: 'source:1' };
describe('official evidence backfill', () => {
 it('preserves unavailable rental area and records month precision without pretending the collection date is the transaction date', () => {
  const result = planEvidenceBackfill([row], [candidate]);
  expect(result.corrections[0]!.after).toMatchObject({ sizeSqm: null, basis: 'registered', observedOn: '2026-08-01', observedPeriod: '2026-08', observedPrecision: 'month' });
  expect(result.corrections[0]!.before.observedOn).toBe('2026-09-09');
  expect(planEvidenceBackfill([{ ...row, data: result.corrections[0]!.after }], [candidate]).unchanged).toBe(1);
 });
 it('keeps ambiguous source records unresolved even when amounts match', () => {
  expect(planEvidenceBackfill([row], [candidate, { ...candidate, month: '2026-07' }]).unresolved[0]!.reason).toBe('ambiguous-source-record');
 });
 it('does not match wrong prices, areas, transaction dates, or withdrawn evidence', () => {
  for (const altered of [{ ...candidate, amount: 1 }, { ...candidate, area: 'OTHER' }, { ...candidate, observedOn: '2026-07-01' }]) {
   expect(planEvidenceBackfill([row], [altered]).corrections).toHaveLength(0);
  }
  expect(planEvidenceBackfill([{ ...row, status: 'withdrawn' }], [candidate]).corrections).toHaveLength(0);
 });
 it('fails on optimistic version conflict, with no automatic review approval', async () => {
  const plan = planEvidenceBackfill([row], [candidate]);
  const calls: string[] = [];
  await expect(applyEvidenceBackfill({ query: async (sql) => { calls.push(sql); return [{ changed: 0 }]; } }, plan.corrections, 'test')).rejects.toThrow('backfill-conflict');
  expect(calls[0]).toContain("status='pending'");
  expect(calls[0]).toContain("'before'"); expect(calls[0]).toContain("'after'");
 });
});
