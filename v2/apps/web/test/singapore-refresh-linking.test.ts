import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { collectSingaporeEvidence } from '../lib/market-data/singapore-collector.server';
import { createMarketRefreshRepository, type MarketRefreshSqlStatement } from '../lib/market-data/refresh-repository.server';

const run = { job: 'sg-private-rent', runId: '1', leaseToken: 'test' } as const;
const batch = () => collectSingaporeEvidence({
  job: run.job, accessKey: 'test', reference: new Date('2026-09-09'),
  fetchRentalEnvelope: async (quarter) => ({ Status: 'Success', Message: '', Result: [{
    project: 'EXAMPLE COURT', street: 'EXAMPLE ROAD', rental: [{ district: '09',
      leaseDate: quarter === '26q2' ? '0626' : '0826', propertyType: 'Condominium',
      areaSqm: '>300', areaSqft: '>3000', noOfBedRoom: 'NA', rent: 7000 }],
  }] }),
});

describe('Singapore rental project joins and complete-scope replacement', () => {
  it.each([false, true])('links only a unique name/street/district match (ambiguous=%s)', async (ambiguous) => {
    const known = { id: 'sg-singapore:project:known', canonical_name: 'Example Court', street: 'Example Road', district: '09' };
    const query = vi.fn(async (sql: string, _parameters?: readonly unknown[]) => sql.includes('rental-projects')
      ? [known, ...(ambiguous ? [{ ...known, id: 'sg-singapore:project:other' }] : [])] : []);
    const transaction = vi.fn(async (statements: readonly MarketRefreshSqlStatement[]) => statements.map((_, i) => (
      i === statements.length - 1 ? [{ received: '2', inserted: '2', updated: '0', unchanged: '0', unlinked: '0' }] : []
    )));
    await createMarketRefreshRepository({ query, transaction }).persist(run, await batch());
    const entities = JSON.parse(String(transaction.mock.calls[0]![0].find((s) => s.statement.includes('INSERT INTO property_entities'))!.parameters![0]));
    expect(entities[0].id).toMatch(ambiguous ? /^sg-singapore:rent-project:/ : /^sg-singapore:project:known$/);
    const reconciliation = query.mock.calls.find(([sql]) => sql.includes('reconcile-ura'));
    expect(reconciliation?.[1]?.[2]).toEqual(expect.arrayContaining([expect.stringContaining(`|${entities[0].id}`)]));
  });

  it('does not retire prior scope records after a failed write', async () => {
    const query = vi.fn(async () => []);
    const transaction = vi.fn(async () => { throw new Error('write failed'); });
    await expect(createMarketRefreshRepository({ query, transaction }).persist(run, await batch())).rejects.toThrow('write failed');
    expect(query).toHaveBeenCalledTimes(1); // only the read-only project match
  });

  it('rejects records outside the claimed complete months before writing', async () => {
    const query = vi.fn(); const transaction = vi.fn();
    await expect(createMarketRefreshRepository({ query, transaction }).persist(run, {
      ...await batch(), reconciliationMonths: ['2026-07-01'],
    })).rejects.toThrow('scope');
    expect(transaction).not.toHaveBeenCalled();
  });
});
