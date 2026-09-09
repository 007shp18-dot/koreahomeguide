import 'server-only';

import { randomUUID } from 'node:crypto';

import type {
  NormalizedToolResearchSnapshot,
  ResearchMarket,
  ResearchToolId,
} from './contract';
import {
  canonicalToolResearchSnapshot,
  RESEARCH_TOOL_IDS,
} from './contract';

export type ToolResearchSubmitInput = Readonly<{
  ownerHash: string;
  retryId: string;
  scenarioHash: string;
  snapshot: NormalizedToolResearchSnapshot;
  source: 'user_scenario';
  purpose: 'product_research';
  consentVersion: 'tool-research-consent-2026-09-09';
  now: Date;
}>;

export type ToolResearchSubmitResult = Readonly<{
  state: 'stored' | 'duplicate';
  expiresAt: string;
}>;

export type ToolResearchAggregate = Readonly<{
  market: ResearchMarket;
  tool: ResearchToolId;
  count: number;
}>;

export type ToolResearchRepository = Readonly<{
  submit(input: ToolResearchSubmitInput): Promise<ToolResearchSubmitResult>;
  deleteOwner(ownerHash: string): Promise<number>;
  expire(now: Date): Promise<number>;
  summarizeRetained(input?: Readonly<{
    market?: ResearchMarket;
    tool?: ResearchToolId;
    limit?: number;
    now?: Date;
  }>): Promise<readonly ToolResearchAggregate[]>;
}>;

type ToolResearchSqlRow = Readonly<Record<string, unknown>>;
export type ToolResearchSqlPort = Readonly<{
  query(statement: string, parameters?: readonly unknown[]): Promise<readonly ToolResearchSqlRow[]>;
}>;

export class ToolResearchStorageUnavailableError extends Error {
  readonly code = 'tool_research_storage_unavailable' as const;

  constructor() {
    super('Tool research storage is unavailable.');
    this.name = 'ToolResearchStorageUnavailableError';
  }
}

const HASH = /^[0-9a-f]{64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MARKETS: readonly ResearchMarket[] = ['global', 'kr-seoul', 'sg-singapore', 'ae-dubai'];
const INSERT_SQL = `
  /* tool-research:insert */
  INSERT INTO tool_research_submissions (
    id, owner_hash, retry_id, scenario_hash, schema_version, source, purpose,
    consent_version, consent_granted_at, tool, market, currency, payload,
    submission_date, created_at, expires_at
  ) VALUES ($1::uuid, $2, $3::uuid, $4, 1, $5, $6, $7, $8::timestamptz, $9, $10, $11, $12::jsonb, $13::date, $14::timestamptz, $14::timestamptz + interval '90 days')
  ON CONFLICT DO NOTHING
  RETURNING expires_at
`;

const DUPLICATE_SQL = `
  /* tool-research:duplicate */
  SELECT expires_at
  FROM tool_research_submissions
  WHERE owner_hash = $1
    AND (retry_id = $2::uuid OR (submission_date = $3::date AND scenario_hash = $4))
  ORDER BY created_at ASC
  LIMIT 1
`;

const DELETE_SQL = `
  /* tool-research:delete-owner */
  DELETE FROM tool_research_submissions
  WHERE owner_hash = $1
  RETURNING id
`;

const EXPIRE_SQL = `
  /* tool-research:expire */
  DELETE FROM tool_research_submissions
  WHERE expires_at <= $1::timestamptz
  RETURNING id
`;

const SUMMARY_SQL = `
  /* tool-research:retained-summary */
  SELECT market, tool, count(*)::text AS count
  FROM tool_research_submissions
  WHERE expires_at > $1::timestamptz
    AND ($2::text IS NULL OR market = $2)
    AND ($3::text IS NULL OR tool = $3)
  GROUP BY market, tool
  ORDER BY count(*) DESC, market ASC, tool ASC
  LIMIT $4
`;

function unavailable(): never {
  throw new ToolResearchStorageUnavailableError();
}

function iso(value: unknown): string {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (Number.isFinite(parsed.getTime())) return parsed.toISOString();
  }
  unavailable();
}

function count(value: unknown): number {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return value;
  if (typeof value === 'bigint' && value >= BigInt(0) && value <= BigInt(Number.MAX_SAFE_INTEGER)) return Number(value);
  if (typeof value === 'string' && /^(?:0|[1-9]\d*)$/.test(value)) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed)) return parsed;
  }
  unavailable();
}

function assertHash(value: string): void {
  if (!HASH.test(value)) unavailable();
}

export function createToolResearchRepository(
  port: ToolResearchSqlPort,
  dependencies: Readonly<{ id?: () => string }> = {},
): ToolResearchRepository {
  const run = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ToolResearchStorageUnavailableError) throw error;
      unavailable();
    }
  };

  return Object.freeze({
    submit(input): Promise<ToolResearchSubmitResult> {
      return run(async () => {
        assertHash(input.ownerHash);
        assertHash(input.scenarioHash);
        if (!UUID.test(input.retryId) || input.source !== 'user_scenario' || input.purpose !== 'product_research'
          || input.consentVersion !== 'tool-research-consent-2026-09-09') unavailable();
        const payload = canonicalToolResearchSnapshot(input.snapshot);
        const createdAt = iso(input.now);
        const submissionDate = createdAt.slice(0, 10);
        const id = (dependencies.id ?? randomUUID)();
        if (!UUID.test(id)) unavailable();

        const inserted = await port.query(INSERT_SQL, [
          id,
          input.ownerHash,
          input.retryId,
          input.scenarioHash,
          input.source,
          input.purpose,
          input.consentVersion,
          createdAt,
          input.snapshot.tool,
          input.snapshot.market,
          input.snapshot.currency,
          payload,
          submissionDate,
          createdAt,
        ]);
        if (inserted.length === 1) {
          return Object.freeze({ state: 'stored' as const, expiresAt: iso(inserted[0]!.expires_at) });
        }
        if (inserted.length !== 0) unavailable();
        const duplicate = await port.query(DUPLICATE_SQL, [
          input.ownerHash, input.retryId, submissionDate, input.scenarioHash,
        ]);
        if (duplicate.length !== 1) unavailable();
        return Object.freeze({ state: 'duplicate' as const, expiresAt: iso(duplicate[0]!.expires_at) });
      });
    },

    deleteOwner(ownerHash): Promise<number> {
      return run(async () => {
        assertHash(ownerHash);
        return (await port.query(DELETE_SQL, [ownerHash])).length;
      });
    },

    expire(now): Promise<number> {
      return run(async () => (await port.query(EXPIRE_SQL, [iso(now)])).length);
    },

    summarizeRetained(input = {}): Promise<readonly ToolResearchAggregate[]> {
      return run(async () => {
        const limit = input.limit ?? 50;
        if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) unavailable();
        if (input.market !== undefined && !MARKETS.includes(input.market)) unavailable();
        if (input.tool !== undefined && !RESEARCH_TOOL_IDS.includes(input.tool)) unavailable();
        const rows = await port.query(SUMMARY_SQL, [
          iso(input.now ?? new Date()), input.market ?? null, input.tool ?? null, limit,
        ]);
        return Object.freeze(rows.map((row) => {
          if (!MARKETS.includes(row.market as ResearchMarket)
            || !RESEARCH_TOOL_IDS.includes(row.tool as ResearchToolId)) unavailable();
          return Object.freeze({
            market: row.market as ResearchMarket,
            tool: row.tool as ResearchToolId,
            count: count(row.count),
          });
        }));
      });
    },
  });
}
