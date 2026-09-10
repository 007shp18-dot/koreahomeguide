import 'server-only';
import { randomUUID } from 'node:crypto';
import { contentDatabase, publicContentDatabase } from '../db/postgres.server';
import type { MarketRefreshSqlPort } from '../market-data/refresh-repository.server';
import { scopeKey, type JapanRecord, type JapanScope, type JapanSnapshot } from './source.server';
import { TOKYO_WARDS } from './query';

export type JapanRun = { runId: string; leaseToken: string; releaseId: string };
export function japanSqlPort(publicRead = false): MarketRefreshSqlPort | null {
  const sql = publicRead ? publicContentDatabase() : contentDatabase();
  if (sql === null) return null;
  return { query: (statement, params = []) => sql.query(statement, [...params]),
    transaction: (statements) => sql.transaction(tx => statements.map(({ statement, parameters = [] }) => tx.query(statement, [...parameters]))) };
}
export function createJapanRepository(port: MarketRefreshSqlPort, batchSize = 2000) {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 2000) throw new TypeError('invalid_batch_size');
  return {
    async start(): Promise<JapanRun | null> {
      const leaseToken = randomUUID();
      const rows = await port.query(`/* japan:start */
        WITH acquired AS (
          INSERT INTO market_data_refresh_leases (job, lease_token, acquired_at, expires_at)
          VALUES ('jp-tokyo-sale', $1, now(), now() + interval '10 minutes')
          ON CONFLICT (job) DO UPDATE SET lease_token = excluded.lease_token,
            acquired_at = excluded.acquired_at, expires_at = excluded.expires_at
          WHERE market_data_refresh_leases.expires_at < now() RETURNING lease_token
        ), abandoned AS (
          UPDATE market_data_refresh_runs SET state = 'failed', error_code = 'lease_expired', completed_at = now()
          WHERE job = 'jp-tokyo-sale' AND state = 'running' AND lease_token <> $1 AND EXISTS (SELECT 1 FROM acquired)
        ) INSERT INTO market_data_refresh_runs (job, market_id, dataset_id, state, lease_token)
          SELECT 'jp-tokyo-sale', 'jp-tokyo', 'jp-mlit-transactions', 'running', lease_token FROM acquired
          RETURNING id::text AS run_id`, [leaseToken]);
      if (!rows[0]) return null;
      return { runId: String(rows[0].run_id), leaseToken, releaseId: `jp-area-${randomUUID()}` };
    },
    async stage(run: JapanRun, snapshot: JapanSnapshot) {
      const { scope } = snapshot;
      await port.transaction([
        { statement: `INSERT INTO geographies (id, market_id, kind, official_name, provider_code)
          VALUES ($1, 'jp-tokyo', 'district', $2, $3) ON CONFLICT (id) DO NOTHING`,
        parameters: [`jp-tokyo:ward:${scope.city}`, snapshot.records[0]?.municipality || scope.city, scope.city] },
        { statement: `/* japan:stage */
          WITH source AS (
            INSERT INTO source_records (dataset_id, business_key, content_hash, object_reference, observed_at, raw_metadata)
            VALUES ('jp-mlit-transactions', $1, $2, $3, $4::timestamptz, $5::jsonb)
            ON CONFLICT (dataset_id, business_key, content_hash) DO UPDATE SET dataset_id = excluded.dataset_id
            RETURNING id
          ) INSERT INTO japan_area_releases (id, run_id, source_record_id, geography_id, city, year, quarter,
            expected_count, snapshot_hash, raw_hash, raw_payload, source_url, retrieved_at, parser_version)
          SELECT $6, $7::bigint, source.id, $8, $9, $10::integer, $11::integer,
            $12::integer, $13, $2, $14, $15, $4::timestamptz, $16 FROM source`,
        parameters: [scopeKey(scope), snapshot.rawHash, `neon://japan_area_releases/${run.releaseId}/raw_payload`,
          snapshot.retrievedAt, JSON.stringify({ request: scope, priceClassification: '01', language: 'en',
            parserVersion: snapshot.parserVersion, runId: run.runId, ...snapshot.responseMetadata }),
          run.releaseId, run.runId, `jp-tokyo:ward:${scope.city}`, scope.city, scope.year, scope.quarter,
          snapshot.records.length, snapshot.snapshotHash, snapshot.rawPayload, snapshot.sourceUrl, snapshot.parserVersion] },
      ]);
      for (let offset = 0; offset < snapshot.records.length; offset += batchSize) {
        // Every chunk remains invisible until the separate fenced activation succeeds.
        await port.query(`/* japan:chunk */ INSERT INTO japan_area_records (release_id, record_reference, record)
          SELECT $1, item->>'recordReference', item FROM jsonb_array_elements($2::jsonb) AS item
          ON CONFLICT (release_id, record_reference) DO NOTHING`,
        [run.releaseId, JSON.stringify(snapshot.records.slice(offset, offset + batchSize))]);
      }
    },
    async activate(run: JapanRun, allowLargeReduction = false) {
      const rows = await port.query('/* japan:activate */ SELECT activate_japan_area_release($1, $2, $3) AS release_id',
        [run.releaseId, run.leaseToken, allowLargeReduction]);
      if (rows[0]?.release_id !== run.releaseId) throw new Error('activation_failed');
    },
    async fail(run: JapanRun, code: string) {
      await port.transaction([
        { statement: `UPDATE japan_area_releases SET state = 'failed' WHERE id = $1 AND state = 'staged'`, parameters: [run.releaseId] },
        { statement: `UPDATE market_data_refresh_runs SET state = 'failed', error_code = $3, completed_at = now()
          WHERE id = $1::bigint AND lease_token = $2 AND state = 'running'`, parameters: [run.runId, run.leaseToken, code] },
        { statement: `DELETE FROM market_data_refresh_leases WHERE job = 'jp-tokyo-sale' AND lease_token = $1`, parameters: [run.leaseToken] },
      ]);
    },
  };
}

export type JapanFilters = { q: string; neighbourhood?: string; type: string; minArea: number | null; maxArea: number | null; page: number; release: string | null };
export type JapanPublished = { releaseId: string; retrievedAt: string; publishedAt: string; sourceUrl: string;
  sourceCount: number; filteredCount: number; records: JapanRecord[]; scope: JapanScope; filters: JapanFilters };

export type JapanPublishedScope = JapanScope & { sourceCount: number };
export async function readJapanCoverage(port = japanSqlPort(true)): Promise<JapanPublishedScope[]> {
  if (port === null) throw new Error('database_not_configured');
  // Only current, activated publications. No transaction rows or staged candidates
  // are loaded; the supported 23 wards and year range bound the metadata response.
  const rows = await port.query(`/* japan:coverage */
    SELECT p.city, p.year, p.quarter, r.expected_count
    FROM japan_area_publications p JOIN japan_area_releases r
      ON r.id = p.release_id AND r.city = p.city AND r.year = p.year AND r.quarter = p.quarter
    WHERE r.state = 'published' AND p.city = ANY($1::text[])
      AND p.year BETWEEN 2024 AND $2::integer
    ORDER BY p.year DESC, p.quarter DESC, p.city`,
  [TOKYO_WARDS.map(([code]) => code), new Date().getUTCFullYear()]);
  return rows.map(row => ({ city: String(row.city), year: String(row.year), quarter: String(row.quarter),
    sourceCount: Number(row.expected_count) }));
}

export async function readJapanPublication(scope: JapanScope, filters: JapanFilters, port = japanSqlPort(true)): Promise<JapanPublished | null> {
  if (port === null) throw new Error('database_not_configured');
  // One statement gives the metadata, count and rows the same MVCC snapshot.
  const rows = await port.query(`/* japan:public */
    WITH release AS (
      SELECT r.* FROM japan_area_releases r JOIN japan_area_publications p
        ON p.city = r.city AND p.year = r.year AND p.quarter = r.quarter
      WHERE p.city = $1 AND p.year = $2::integer AND p.quarter = $3::integer
        AND r.id = COALESCE($10::text, p.release_id) AND r.state IN ('published','superseded')
    ), filtered AS (
      SELECT a.* FROM japan_area_records a JOIN release r ON a.release_id = r.id
      WHERE ($4 = '' OR concat_ws(' ', a.record->>'district', a.record->>'municipality', a.record->>'floorPlan', a.record->>'buildingYear') ILIKE '%' || $4 || '%')
        AND ($11 = '' OR a.record->>'district' = $11)
        AND ($5 = '' OR a.record->>'type' = $5)
        AND ($6::numeric IS NULL OR (a.record->>'areaSqm')::numeric >= $6::numeric)
        AND ($7::numeric IS NULL OR (a.record->>'areaSqm')::numeric <= $7::numeric)
    ), page AS (
      SELECT record FROM filtered ORDER BY (record->>'price')::bigint DESC, record_reference
      LIMIT $8::integer OFFSET $9::integer
    ) SELECT r.id, r.retrieved_at::text, r.published_at::text, r.source_url, r.expected_count,
      (SELECT count(*) FROM filtered)::integer AS filtered_count,
      COALESCE((SELECT jsonb_agg(record) FROM page), '[]'::jsonb) AS records FROM release r`,
  [scope.city, scope.year, scope.quarter, filters.q, filters.type, filters.minArea, filters.maxArea, 20, (filters.page - 1) * 20, filters.release, filters.neighbourhood ?? '']);
  const row = rows[0];
  if (!row) return null;
  return { releaseId: String(row.id), retrievedAt: String(row.retrieved_at), publishedAt: String(row.published_at),
    sourceUrl: String(row.source_url), sourceCount: Number(row.expected_count), filteredCount: Number(row.filtered_count),
    records: row.records as JapanRecord[], scope, filters };
}
