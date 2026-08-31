import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  CommunityStorageUnavailableError,
  createCommunityRepository,
  type CommunityEvidenceScope,
  type StoredCommunityResponse,
} from '../lib/community/community-repository.server';
import type {
  CommunitySqlPort,
  CommunitySqlTransaction,
} from '../lib/community/community-sql-port.server';

type Row = {
  marketId: string;
  scopeType: string;
  scopeId: string;
  evidenceId: string;
  respondentKey: string;
  direction: string;
  reason: string | null;
};

const scope: CommunityEvidenceScope = {
  marketId: 'kr-seoul',
  scopeType: 'district',
  scopeId: 'jung-gu',
  evidenceId: 'kr-seoul:2026-01/2026-07:all',
};

function response(
  respondentKey: string,
  direction: 'HIGHER' | 'SIMILAR' | 'LOWER',
  overrides: Partial<StoredCommunityResponse> = {},
): StoredCommunityResponse {
  return { ...scope, respondentKey, direction, reason: null, ...overrides };
}

function keyFor(row: Row): string {
  return [row.marketId, row.scopeType, row.scopeId, row.evidenceId, row.respondentKey].join('|');
}

function sameScope(row: Row, values: readonly unknown[]): boolean {
  return row.marketId === values[0] && row.scopeType === values[1] &&
    row.scopeId === values[2] && row.evidenceId === values[3];
}

function createFakeSqlPort() {
  let rows = new Map<string, Row>();
  let failAfterMutation = false;
  const calls: Array<{ statement: string; parameters: readonly unknown[] }> = [];

  const transaction = async <T>(operation: (client: CommunitySqlTransaction) => Promise<T>) => {
    const snapshot = new Map(rows);
    const client: CommunitySqlTransaction = {
      async query(statement, parameters) {
        calls.push({ statement, parameters });
        if (statement.includes('community:upsert')) {
          const row: Row = {
            marketId: String(parameters[0]), scopeType: String(parameters[1]),
            scopeId: String(parameters[2]), evidenceId: String(parameters[3]),
            respondentKey: String(parameters[4]), direction: String(parameters[5]),
            reason: parameters[6] === null ? null : String(parameters[6]),
          };
          rows.set(keyFor(row), row);
          if (failAfterMutation) throw new Error('postgres://secret@host SQL upsert failed');
          return [];
        }
        if (statement.includes('community:delete')) {
          rows.delete([
            parameters[0], parameters[1], parameters[2], parameters[3], parameters[4],
          ].join('|'));
          return [];
        }
        if (statement.includes('community:selection')) {
          const row = rows.get([
            parameters[0], parameters[1], parameters[2], parameters[3], parameters[4],
          ].join('|'));
          return row === undefined ? [] : [{ direction: row.direction, reason: row.reason }];
        }
        if (statement.includes('community:directions')) {
          const counts = new Map<string, number>();
          for (const row of rows.values()) {
            if (sameScope(row, parameters)) {
              counts.set(row.direction, (counts.get(row.direction) ?? 0) + 1);
            }
          }
          return [...counts].map(([direction, count]) => ({ direction, count: String(count) }));
        }
        if (statement.includes('community:reasons')) {
          const counts = new Map<string, number>();
          for (const row of rows.values()) {
            if (sameScope(row, parameters) && row.reason !== null) {
              counts.set(row.reason, (counts.get(row.reason) ?? 0) + 1);
            }
          }
          return [...counts].map(([reason, count]) => ({ reason, count: String(count) }));
        }
        throw new Error('Unexpected SQL statement.');
      },
    };
    try {
      return await operation(client);
    } catch (error) {
      rows = snapshot;
      throw error;
    }
  };

  return {
    port: { transaction } satisfies CommunitySqlPort,
    calls,
    rowCount: () => rows.size,
    setFailAfterMutation(value: boolean) { failAfterMutation = value; },
  };
}

describe('transactional Community repository', () => {
  it('upserts one active response per respondent and returns the replacement', async () => {
    const fake = createFakeSqlPort();
    const repository = createCommunityRepository(fake.port);

    await repository.upsert(response('r1', 'HIGHER', { reason: 'LINE' }));
    await repository.upsert(response('r1', 'LOWER', { reason: 'VIEW' }));

    expect(fake.rowCount()).toBe(1);
    expect(await repository.getSelection(scope, 'r1')).toEqual({
      direction: 'LOWER', reason: 'VIEW',
    });
    expect(await repository.aggregate(scope)).toEqual({
      total: 1,
      directions: [
        { direction: 'HIGHER', count: 0 },
        { direction: 'SIMILAR', count: 0 },
        { direction: 'LOWER', count: 1 },
      ],
      reasons: [{ reason: 'VIEW', count: 1 }],
    });
  });

  it('counts different respondents while isolating scope and evidence period', async () => {
    const repository = createCommunityRepository(createFakeSqlPort().port);
    await repository.upsert(response('r1', 'HIGHER'));
    await repository.upsert(response('r2', 'SIMILAR'));
    await repository.upsert(response('r3', 'LOWER', { scopeId: 'jongno-gu' }));
    await repository.upsert(response('r4', 'LOWER', {
      evidenceId: 'kr-seoul:2026-02/2026-08:all',
    }));

    expect((await repository.aggregate(scope)).total).toBe(2);
    expect((await repository.aggregate({ ...scope, scopeId: 'jongno-gu' })).total).toBe(1);
    expect((await repository.aggregate({
      ...scope, evidenceId: 'kr-seoul:2026-02/2026-08:all',
    })).total).toBe(1);
  });

  it('deletes idempotently without affecting another respondent', async () => {
    const repository = createCommunityRepository(createFakeSqlPort().port);
    await repository.upsert(response('r1', 'HIGHER'));
    await repository.upsert(response('r2', 'SIMILAR'));

    await repository.delete(scope, 'r1');
    await repository.delete(scope, 'r1');

    expect(await repository.getSelection(scope, 'r1')).toBeNull();
    expect(await repository.getSelection(scope, 'r2')).toEqual({
      direction: 'SIMILAR', reason: null,
    });
    expect((await repository.aggregate(scope)).total).toBe(1);
  });

  it('uses parameterized SQL and freezes returned aggregate data', async () => {
    const fake = createFakeSqlPort();
    const repository = createCommunityRepository(fake.port);
    await repository.upsert(response('r1', 'HIGHER'));
    const aggregate = await repository.aggregate(scope);

    expect(fake.calls.some(({ statement, parameters }) => (
      statement.includes('community:upsert') &&
      !statement.includes('jung-gu') &&
      parameters.includes('jung-gu')
    ))).toBe(true);
    expect(Object.isFrozen(aggregate)).toBe(true);
    expect(Object.isFrozen(aggregate.directions)).toBe(true);
    expect(aggregate.directions.every(Object.isFrozen)).toBe(true);
  });

  it('rolls back a failed mutation and redacts provider details', async () => {
    const fake = createFakeSqlPort();
    fake.setFailAfterMutation(true);
    const repository = createCommunityRepository(fake.port);

    await expect(repository.upsert(response('r1', 'HIGHER'))).rejects.toEqual(
      new CommunityStorageUnavailableError(),
    );
    expect(fake.rowCount()).toBe(0);
    await expect(repository.upsert(response('r1', 'HIGHER'))).rejects.not.toThrow(
      /postgres|secret|host|SQL/i,
    );
  });

  it('defines a privacy-bounded SQL schema with no personal-data columns', () => {
    const sql = readFileSync(new URL(
      '../lib/community/migrations/001_evidence_responses.sql', import.meta.url,
    ), 'utf8');

    expect(sql).toContain('CREATE TABLE signedprice_evidence_responses');
    expect(sql).toContain('PRIMARY KEY (market_id, scope_type, scope_id, evidence_id, respondent_key)');
    expect(sql).toContain("direction IN ('HIGHER', 'SIMILAR', 'LOWER')");
    expect(sql).not.toMatch(/\b(ip|email|name|address|price|comment|body|user_agent|cookie)\b/i);
  });
});
