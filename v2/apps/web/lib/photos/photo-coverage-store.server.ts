import 'server-only';

import { contentDatabase } from '../db/postgres.server';

type SqlRow = Readonly<Record<string, unknown>>;

export type PhotoCoverageSqlPort = Readonly<{
  query(statement: string, parameters?: readonly unknown[]): Promise<readonly SqlRow[]>;
}>;

export type PhotoCoverageState =
  | 'exact-photo'
  | 'provider-photo'
  | 'parent-photo'
  | 'street-view'
  | 'unavailable';

export type PhotoCoverageSummary = Readonly<{
  total: number;
  exactPhoto: number;
  providerPhoto: number;
  parentPhoto: number;
  streetView: number;
  unavailable: number;
  complete: number;
}>;

const SYNC_SQL = `
  /* photo-coverage:sync */
  WITH ranked_photos AS (
    SELECT
      entity.id AS entity_id,
      entity.market_id,
      photo.id AS building_photo_id,
      photo.provider,
      CASE
        WHEN photo.provider = 'google-place' THEN 'provider-photo'
        ELSE 'exact-photo'
      END AS state,
      photo.checked_at,
      photo.checked_at + interval '365 days' AS next_retry_at,
      row_number() OVER (
        PARTITION BY entity.id
        ORDER BY photo.position, photo.id
      ) AS preference
    FROM property_entities AS entity
    INNER JOIN buildings AS building
      ON building.key = entity.local_attributes ->> 'legacyBuildingKey'
    INNER JOIN building_photos AS photo
      ON photo.building_key = building.key
      AND photo.status = 'approved'
      AND photo.approved_at IS NOT NULL
      AND photo.approved_by IS NOT NULL
      AND photo.visual_reviewed_at IS NOT NULL
    WHERE entity.market_id IN ('kr-seoul', 'sg-singapore')
      AND ($1::text IS NULL OR entity.market_id = $1)
      AND entity.identity_status = 'verified'
  ), best_photos AS (
    SELECT entity_id, market_id, building_photo_id, provider, state,
      NULL::text AS reason, checked_at, next_retry_at
    FROM ranked_photos
    WHERE preference = 1
  ), terminal_attempts AS (
    SELECT
      entity.id AS entity_id,
      entity.market_id,
      NULL::bigint AS building_photo_id,
      NULL::text AS provider,
      'unavailable'::text AS state,
      'no-approved-exact-photo'::text AS reason,
      greatest(wikimedia.attempted_at, google.attempted_at, naver.attempted_at) AS checked_at,
      least(wikimedia.next_retry_at, google.next_retry_at, naver.next_retry_at) AS next_retry_at
    FROM property_entities AS entity
    INNER JOIN buildings AS building
      ON building.key = entity.local_attributes ->> 'legacyBuildingKey'
    INNER JOIN building_enrichment_attempts AS wikimedia
      ON wikimedia.building_key = building.key
      AND wikimedia.pipeline = 'photo-wikimedia'
      AND wikimedia.status IN ('succeeded', 'no-candidate')
    INNER JOIN building_enrichment_attempts AS google
      ON google.building_key = building.key
      AND google.pipeline = 'photo-google'
      AND google.status IN ('succeeded', 'no-candidate')
    INNER JOIN building_enrichment_attempts AS naver
      ON naver.building_key = building.key
      AND naver.pipeline = 'photo-naver-search'
      AND naver.status IN ('succeeded', 'no-candidate')
    WHERE entity.market_id IN ('kr-seoul', 'sg-singapore')
      AND ($1::text IS NULL OR entity.market_id = $1)
      AND entity.identity_status = 'verified'
      AND NOT EXISTS (
        SELECT 1 FROM building_photos AS pending
        WHERE pending.building_key = building.key
          AND pending.status IN ('candidate', 'review_required')
      )
      AND NOT EXISTS (
        SELECT 1 FROM best_photos AS approved
        WHERE approved.entity_id = entity.id
      )
  ), proposed AS (
    SELECT entity_id, market_id, building_photo_id, provider, state, reason, checked_at, next_retry_at
    FROM best_photos
    UNION ALL
    SELECT entity_id, market_id, building_photo_id, provider, state, reason, checked_at, next_retry_at
    FROM terminal_attempts
  ), eligible AS (
    SELECT proposed.*
    FROM proposed
    LEFT JOIN building_photo_coverage AS current ON current.entity_id = proposed.entity_id
    WHERE current.entity_id IS NULL
      OR (current.market_id, current.state, current.building_photo_id, current.provider,
          current.reason, current.policy_version, current.checked_at, current.next_retry_at)
        IS DISTINCT FROM
         (proposed.market_id, proposed.state, proposed.building_photo_id, proposed.provider,
          proposed.reason, 'photo-identity-v1', proposed.checked_at, proposed.next_retry_at)
  ), selected AS (
    SELECT * FROM eligible
    ORDER BY entity_id
    LIMIT $2
  ), upserted AS (
    INSERT INTO building_photo_coverage (
      entity_id, market_id, state, building_photo_id, provider, reason,
      policy_version, checked_at, next_retry_at, attempt_count, updated_at
    )
    SELECT
      entity_id, market_id, state, building_photo_id, provider, reason,
      'photo-identity-v1', checked_at, next_retry_at, 1, now()
    FROM selected
    ON CONFLICT (entity_id) DO UPDATE SET
      market_id = excluded.market_id,
      state = excluded.state,
      building_photo_id = excluded.building_photo_id,
      parent_entity_id = NULL,
      provider = excluded.provider,
      reason = excluded.reason,
      policy_version = excluded.policy_version,
      checked_at = excluded.checked_at,
      next_retry_at = excluded.next_retry_at,
      attempt_count = building_photo_coverage.attempt_count + 1,
      updated_at = now()
    RETURNING entity_id
  )
  SELECT count(*)::text AS updated FROM upserted
`;

const SUMMARY_SQL = `
  /* photo-coverage:summary */
  SELECT
    count(*)::text AS total,
    count(*) FILTER (WHERE coverage.state = 'exact-photo')::text AS exact_photo,
    count(*) FILTER (WHERE coverage.state = 'provider-photo')::text AS provider_photo,
    count(*) FILTER (WHERE coverage.state = 'parent-photo')::text AS parent_photo,
    count(*) FILTER (WHERE coverage.state = 'street-view')::text AS street_view,
    count(*) FILTER (WHERE coverage.state = 'unavailable')::text AS unavailable,
    count(coverage.entity_id)::text AS complete
  FROM property_entities AS entity
  LEFT JOIN building_photo_coverage AS coverage ON coverage.entity_id = entity.id
  WHERE entity.market_id IN ('kr-seoul', 'sg-singapore')
`;

function count(value: unknown): number {
  if (typeof value !== 'string' || !/^(?:0|[1-9]\d*)$/u.test(value)) {
    throw new TypeError('Invalid photo coverage count.');
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new TypeError('Invalid photo coverage count.');
  return parsed;
}

export function createPhotoCoverageStore(port: PhotoCoverageSqlPort): Readonly<{
  sync(limit?: number, marketId?: 'kr-seoul' | 'sg-singapore'): Promise<Readonly<{
    checked: number;
    updated: number;
  }>>;
  readSummary(): Promise<PhotoCoverageSummary>;
}> {
  return Object.freeze({
    async sync(limit = 300, marketId) {
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 300) {
        throw new RangeError('Photo coverage limit must be between 1 and 300.');
      }
      const [row] = await port.query(SYNC_SQL, [marketId ?? null, limit]);
      if (row === undefined) throw new TypeError('Photo coverage synchronization result unavailable.');
      const updated = count(row.updated);
      return Object.freeze({ checked: updated, updated });
    },
    async readSummary() {
      const [row] = await port.query(SUMMARY_SQL);
      if (row === undefined) throw new TypeError('Photo coverage summary unavailable.');
      return Object.freeze({
        total: count(row.total),
        exactPhoto: count(row.exact_photo),
        providerPhoto: count(row.provider_photo),
        parentPhoto: count(row.parent_photo),
        streetView: count(row.street_view),
        unavailable: count(row.unavailable),
        complete: count(row.complete),
      });
    },
  });
}

function configuredStore() {
  const sql = contentDatabase();
  if (sql === null) throw new Error('database_not_configured');
  return createPhotoCoverageStore({
    query: (statement, parameters = []) => sql.query(statement, [...parameters]),
  });
}

export async function syncPhotoCoverage(
  limit = 300,
  marketId?: 'kr-seoul' | 'sg-singapore',
) {
  return configuredStore().sync(limit, marketId);
}

export async function readPhotoCoverageSummary() {
  return configuredStore().readSummary();
}
