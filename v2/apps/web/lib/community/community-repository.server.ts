import 'server-only';

import {
  COMMUNITY_DIRECTIONS,
  COMMUNITY_REASONS,
  type CommunityEvidenceScope,
  type CommunityDirection,
  type CommunityReason,
  type CommunitySelection,
} from './community-types';
import type { RawCommunityAggregate } from './community-aggregate';
import { parseEvidenceResponseInput } from './community-schema';
import type { CommunitySqlPort, CommunitySqlRow } from './community-sql-port.server';

export type StoredCommunityResponse = CommunityEvidenceScope & Readonly<{
  respondentKey: string;
  direction: CommunityDirection;
  reason: CommunityReason | null;
}>;

export type CommunityRepository = Readonly<{
  upsert(response: StoredCommunityResponse): Promise<void>;
  delete(scope: CommunityEvidenceScope, respondentKey: string): Promise<void>;
  getSelection(
    scope: CommunityEvidenceScope,
    respondentKey: string,
  ): Promise<CommunitySelection | null>;
  aggregate(scope: CommunityEvidenceScope): Promise<RawCommunityAggregate>;
}>;

export class CommunityStorageUnavailableError extends Error {
  readonly code = 'community_storage_unavailable' as const;

  constructor() {
    super('Community storage is unavailable.');
    this.name = 'CommunityStorageUnavailableError';
  }
}

const RESPONDENT_KEY = /^[A-Za-z0-9_-]{1,128}$/;

const UPSERT_SQL = `
  /* community:upsert */
  INSERT INTO signedprice_evidence_responses (
    market_id, scope_type, scope_id, evidence_id, respondent_key, direction, reason
  ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  ON CONFLICT (market_id, scope_type, scope_id, evidence_id, respondent_key)
  DO UPDATE SET direction = EXCLUDED.direction, reason = EXCLUDED.reason, updated_at = now()
`;

const DELETE_SQL = `
  /* community:delete */
  DELETE FROM signedprice_evidence_responses
  WHERE market_id = $1 AND scope_type = $2 AND scope_id = $3
    AND evidence_id = $4 AND respondent_key = $5
`;

const SELECTION_SQL = `
  /* community:selection */
  SELECT direction, reason
  FROM signedprice_evidence_responses
  WHERE market_id = $1 AND scope_type = $2 AND scope_id = $3
    AND evidence_id = $4 AND respondent_key = $5
  LIMIT 1
`;

const DIRECTIONS_SQL = `
  /* community:directions */
  SELECT direction, count(*)::text AS count
  FROM signedprice_evidence_responses
  WHERE market_id = $1 AND scope_type = $2 AND scope_id = $3 AND evidence_id = $4
  GROUP BY direction
`;

const REASONS_SQL = `
  /* community:reasons */
  SELECT reason, count(*)::text AS count
  FROM signedprice_evidence_responses
  WHERE market_id = $1 AND scope_type = $2 AND scope_id = $3 AND evidence_id = $4
    AND reason IS NOT NULL
  GROUP BY reason
`;

function unavailable(): never {
  throw new CommunityStorageUnavailableError();
}

function assertScope(scope: CommunityEvidenceScope): void {
  parseEvidenceResponseInput({
    schemaVersion: 1,
    ...scope,
    direction: 'SIMILAR',
    reason: null,
  });
}

function assertRespondentKey(respondentKey: string): void {
  if (!RESPONDENT_KEY.test(respondentKey)) unavailable();
}

function parametersFor(scope: CommunityEvidenceScope): readonly string[] {
  assertScope(scope);
  return Object.freeze([
    scope.marketId,
    scope.scopeType,
    scope.scopeId,
    scope.evidenceId,
  ]);
}

function parsedCount(value: unknown): number {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return value;
  if (typeof value === 'string' && /^(?:0|[1-9]\d*)$/.test(value)) {
    const count = Number(value);
    if (Number.isSafeInteger(count)) return count;
  }
  unavailable();
}

function selectionFrom(rows: readonly CommunitySqlRow[]): CommunitySelection | null {
  if (rows.length === 0) return null;
  if (rows.length !== 1) unavailable();
  const row = rows[0]!;
  if (
    !COMMUNITY_DIRECTIONS.includes(row.direction as CommunityDirection) ||
    !(
      row.reason === null ||
      COMMUNITY_REASONS.includes(row.reason as CommunityReason)
    )
  ) {
    unavailable();
  }
  return Object.freeze({
    direction: row.direction as CommunityDirection,
    reason: row.reason as CommunityReason | null,
  });
}

function aggregateFrom(
  directionRows: readonly CommunitySqlRow[],
  reasonRows: readonly CommunitySqlRow[],
): RawCommunityAggregate {
  const countsByDirection = new Map<CommunityDirection, number>();
  for (const row of directionRows) {
    const direction = row.direction as CommunityDirection;
    if (
      !COMMUNITY_DIRECTIONS.includes(direction) ||
      countsByDirection.has(direction)
    ) {
      unavailable();
    }
    countsByDirection.set(direction, parsedCount(row.count));
  }
  const directions = Object.freeze(COMMUNITY_DIRECTIONS.map((direction) => Object.freeze({
    direction,
    count: countsByDirection.get(direction) ?? 0,
  })));

  const countsByReason = new Map<CommunityReason, number>();
  for (const row of reasonRows) {
    const reason = row.reason as CommunityReason;
    if (!COMMUNITY_REASONS.includes(reason) || countsByReason.has(reason)) unavailable();
    countsByReason.set(reason, parsedCount(row.count));
  }
  const reasons = Object.freeze(COMMUNITY_REASONS.flatMap((reason) => {
    const count = countsByReason.get(reason);
    return count === undefined ? [] : [Object.freeze({ reason, count })];
  }));
  const total = directions.reduce((sum, item) => sum + item.count, 0);
  if (reasons.reduce((sum, item) => sum + item.count, 0) > total) unavailable();
  return Object.freeze({ total, directions, reasons });
}

export function createCommunityRepository(port: CommunitySqlPort): CommunityRepository {
  const run = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await operation();
    } catch {
      unavailable();
    }
  };

  return Object.freeze({
    async upsert(response: StoredCommunityResponse): Promise<void> {
      return run(async () => {
        const parsed = parseEvidenceResponseInput({
          schemaVersion: 1,
          marketId: response.marketId,
          scopeType: response.scopeType,
          scopeId: response.scopeId,
          evidenceId: response.evidenceId,
          direction: response.direction,
          reason: response.reason,
        });
        assertRespondentKey(response.respondentKey);
        await port.transaction(async (client) => {
          await client.query(UPSERT_SQL, [
            parsed.marketId,
            parsed.scopeType,
            parsed.scopeId,
            parsed.evidenceId,
            response.respondentKey,
            parsed.direction,
            parsed.reason,
          ]);
        });
      });
    },

    async delete(scope: CommunityEvidenceScope, respondentKey: string): Promise<void> {
      return run(async () => {
        const parameters = parametersFor(scope);
        assertRespondentKey(respondentKey);
        await port.transaction(async (client) => {
          await client.query(DELETE_SQL, [...parameters, respondentKey]);
        });
      });
    },

    async getSelection(
      scope: CommunityEvidenceScope,
      respondentKey: string,
    ): Promise<CommunitySelection | null> {
      return run(async () => {
        const parameters = parametersFor(scope);
        assertRespondentKey(respondentKey);
        return port.transaction(async (client) => selectionFrom(
          await client.query(SELECTION_SQL, [...parameters, respondentKey]),
        ));
      });
    },

    async aggregate(scope: CommunityEvidenceScope): Promise<RawCommunityAggregate> {
      return run(async () => {
        const parameters = parametersFor(scope);
        return port.transaction(async (client) => {
          const directionRows = await client.query(DIRECTIONS_SQL, parameters);
          const reasonRows = await client.query(REASONS_SQL, parameters);
          return aggregateFrom(directionRows, reasonRows);
        });
      });
    },
  });
}

export type { CommunityEvidenceScope, CommunitySelection } from './community-types';
