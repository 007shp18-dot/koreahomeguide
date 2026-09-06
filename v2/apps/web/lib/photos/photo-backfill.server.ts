import 'server-only';

import { contentDatabase } from '../db/postgres.server';
import {
  discoverGooglePlacePhotoCandidates,
  discoverWikimediaCommonsPhotoCandidates,
} from './building-photo-store.server';
import { searchNaverBuildingImages } from './naver-image-search.server';
import { readPhotoCoverageSummary, syncPhotoCoverage } from './photo-coverage-store.server';

export type PhotoBackfillOptions = Readonly<{
  market: 'kr-seoul' | 'sg-singapore';
  provider: 'google' | 'wikimedia' | 'naver-search' | 'coverage';
  limit: number;
  dailyRequestCap: number;
  dailySpendCapUsd: number;
  dryRun: boolean;
}>;

type ProviderRunResult = Readonly<{
  state: 'ready' | 'not-configured' | 'provider-error';
  checked: number;
  candidates: number;
  entityIds: readonly string[];
  reason?: string;
}>;

export type PhotoBackfillResult = Readonly<{
  state: 'ready' | 'dry-run' | 'cap-reached' | 'provider-paused' | 'not-configured' | 'provider-error';
  checked: number;
  candidates: number;
  entityIds: readonly string[];
  requestLimit: number;
  reason?: string;
}>;

export type PhotoBackfillDependencies = Readonly<{
  readHealth(provider: PhotoBackfillOptions['provider']): Promise<Readonly<{
    state: 'ready' | 'paused' | 'not-configured';
    reason: string | null;
  }>>;
  readUsage(provider: PhotoBackfillOptions['provider'], usageDate: string): Promise<Readonly<{
    requestCount: number;
    estimatedCostUsd: number;
  }>>;
  runProvider(input: Readonly<{
    market: PhotoBackfillOptions['market'];
    provider: PhotoBackfillOptions['provider'];
    limit: number;
  }>): Promise<ProviderRunResult>;
  writeUsage(provider: PhotoBackfillOptions['provider'], usageDate: string, requestCount: number, estimatedCostUsd: number): Promise<void>;
  writeHealth(provider: PhotoBackfillOptions['provider'], state: 'ready' | 'paused' | 'not-configured', reason: string | null): Promise<void>;
  syncCoverage(limit: number, market: PhotoBackfillOptions['market']): Promise<Readonly<{ checked: number; updated: number }>>;
}>;

function usageDate(provider: PhotoBackfillOptions['provider'], now = new Date()): string {
  if (provider !== 'naver-search') return now.toISOString().slice(0, 10);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function requestCostUsd(provider: PhotoBackfillOptions['provider']): number {
  if (provider !== 'google') return 0;
  const configured = Number(process.env.GOOGLE_PLACES_ESTIMATED_REQUEST_COST_USD ?? '0.032');
  return Number.isFinite(configured) && configured > 0 ? configured : 0.032;
}

function validateOptions(options: PhotoBackfillOptions): void {
  if (!['kr-seoul', 'sg-singapore'].includes(options.market)
    || !['google', 'wikimedia', 'naver-search', 'coverage'].includes(options.provider)) {
    throw new RangeError('Unsupported photo backfill scope.');
  }
  if (!Number.isSafeInteger(options.limit) || options.limit < 1 || options.limit > 300) {
    throw new RangeError('Photo backfill limit must be between 1 and 300.');
  }
  if (!Number.isSafeInteger(options.dailyRequestCap) || options.dailyRequestCap < 1 || options.dailyRequestCap > 100_000) {
    throw new RangeError('Daily request cap must be between 1 and 100000.');
  }
  if (!Number.isFinite(options.dailySpendCapUsd) || options.dailySpendCapUsd < 0 || options.dailySpendCapUsd > 10_000) {
    throw new RangeError('Daily spend cap must be between 0 and 10000 USD.');
  }
}

export async function runOrderedProviderBatch<T, R>(
  values: readonly T[],
  worker: (value: T) => Promise<R>,
  options: Readonly<{
    concurrency?: number;
    shouldStop?: (result: R) => boolean;
    deadlineMs?: number;
    now?: () => number;
  }> = {},
): Promise<readonly R[]> {
  const concurrency = options.concurrency ?? 5;
  if (!Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > 10) {
    throw new RangeError('Provider concurrency must be between 1 and 10.');
  }
  const deadlineMs = options.deadlineMs ?? 45_000;
  const now = options.now ?? Date.now;
  const startedAt = now();
  const results: R[] = [];
  for (let index = 0; index < values.length; index += concurrency) {
    if (now() - startedAt >= deadlineMs) break;
    const group = await Promise.all(values.slice(index, index + concurrency).map(worker));
    results.push(...group);
    if (options.shouldStop !== undefined && group.some(options.shouldStop)) break;
  }
  return Object.freeze(results);
}

export function createPhotoBackfillRunner(dependencies: PhotoBackfillDependencies) {
  return async (options: PhotoBackfillOptions): Promise<PhotoBackfillResult> => {
    validateOptions(options);
    const date = usageDate(options.provider);
    const health = await dependencies.readHealth(options.provider);
    if (health.state === 'paused') {
      return Object.freeze({
        state: 'provider-paused', checked: 0, candidates: 0, entityIds: Object.freeze([]),
        requestLimit: 0, reason: health.reason ?? 'provider-paused',
      });
    }
    const usage = await dependencies.readUsage(options.provider, date);
    const cost = requestCostUsd(options.provider);
    const remainingRequests = Math.max(0, options.dailyRequestCap - usage.requestCount);
    const remainingBySpend = cost === 0
      ? options.limit
      : Math.max(0, Math.floor((options.dailySpendCapUsd - usage.estimatedCostUsd + Number.EPSILON) / cost));
    const requestLimit = Math.min(options.limit, remainingRequests, remainingBySpend);
    if (requestLimit < 1) {
      return Object.freeze({
        state: 'cap-reached', checked: 0, candidates: 0, entityIds: Object.freeze([]), requestLimit: 0,
      });
    }
    if (options.dryRun) {
      return Object.freeze({
        state: 'dry-run', checked: 0, candidates: 0, entityIds: Object.freeze([]), requestLimit,
      });
    }

    if (options.provider === 'coverage') {
      const synced = await dependencies.syncCoverage(requestLimit, options.market);
      return Object.freeze({
        state: 'ready', checked: synced.checked, candidates: synced.updated,
        entityIds: Object.freeze([]), requestLimit,
      });
    }

    const result = await dependencies.runProvider({ ...options, limit: requestLimit });
    if (result.checked > 0) {
      await dependencies.writeUsage(options.provider, date, result.checked, result.checked * cost);
    }
    if (result.state === 'provider-error' && ['http-401', 'http-403'].includes(result.reason ?? '')) {
      await dependencies.writeHealth(options.provider, 'paused', result.reason ?? 'authentication-failed');
      return Object.freeze({
        state: 'provider-paused', checked: result.checked, candidates: result.candidates,
        entityIds: Object.freeze([...result.entityIds]), requestLimit, reason: result.reason,
      });
    }
    await dependencies.writeHealth(
      options.provider,
      result.state === 'not-configured' ? 'not-configured' : 'ready',
      result.reason ?? null,
    );
    if (result.checked > 0) await dependencies.syncCoverage(Math.min(result.checked, 300), options.market);
    return Object.freeze({
      state: result.state,
      checked: result.checked,
      candidates: result.candidates,
      entityIds: Object.freeze([...result.entityIds]),
      requestLimit,
      ...(result.reason === undefined ? {} : { reason: result.reason }),
    });
  };
}

function databaseDependencies(): PhotoBackfillDependencies {
  const sql = contentDatabase();
  if (sql === null) throw new Error('database_not_configured');
  return Object.freeze({
    async readHealth(provider) {
      const [row] = await sql`
        SELECT state, reason
        FROM photo_provider_health
        WHERE provider = ${provider}
          AND (state <> 'paused' OR paused_until IS NULL OR paused_until > now())
      `;
      if (row === undefined) return Object.freeze({ state: 'ready' as const, reason: null });
      return Object.freeze({
        state: ['ready', 'paused', 'not-configured'].includes(String(row.state))
          ? row.state as 'ready' | 'paused' | 'not-configured'
          : 'ready',
        reason: typeof row.reason === 'string' ? row.reason : null,
      });
    },
    async readUsage(provider, date) {
      const [row] = await sql`
        SELECT request_count, estimated_cost_microusd
        FROM photo_provider_daily_usage
        WHERE provider = ${provider} AND usage_date = ${date}::date
      `;
      return Object.freeze({
        requestCount: Number(row?.request_count ?? 0),
        estimatedCostUsd: Number(row?.estimated_cost_microusd ?? 0) / 1_000_000,
      });
    },
    async runProvider({ market, provider, limit }) {
      const marketKey = market === 'kr-seoul' ? 'seoul' : 'singapore';
      if (provider === 'google') {
        const result = await discoverGooglePlacePhotoCandidates(limit, marketKey);
        return result;
      }
      if (provider === 'wikimedia') {
        const result = await discoverWikimediaCommonsPhotoCandidates(limit, marketKey);
        return result;
      }
      return runNaverAttemptBatch(market, limit);
    },
    async writeUsage(provider, date, requestCount, estimatedCostUsd) {
      await sql`
        INSERT INTO photo_provider_daily_usage (
          provider, usage_date, request_count, estimated_cost_microusd
        ) VALUES (
          ${provider}, ${date}::date, ${requestCount}, ${Math.round(estimatedCostUsd * 1_000_000)}
        )
        ON CONFLICT (provider, usage_date) DO UPDATE SET
          request_count = photo_provider_daily_usage.request_count + excluded.request_count,
          estimated_cost_microusd = photo_provider_daily_usage.estimated_cost_microusd + excluded.estimated_cost_microusd,
          updated_at = now()
      `;
    },
    async writeHealth(provider, state, reason) {
      await sql`
        INSERT INTO photo_provider_health (provider, state, reason, paused_until, checked_at)
        VALUES (
          ${provider}, ${state}, ${reason},
          CASE WHEN ${state} = 'paused' THEN now() + interval '1 day' ELSE NULL END,
          now()
        )
        ON CONFLICT (provider) DO UPDATE SET
          state = excluded.state,
          reason = excluded.reason,
          paused_until = excluded.paused_until,
          checked_at = now(),
          updated_at = now()
      `;
    },
    syncCoverage(limit, market) {
      return syncPhotoCoverage(limit, market);
    },
  });
}

async function runNaverAttemptBatch(
  market: PhotoBackfillOptions['market'],
  limit: number,
): Promise<ProviderRunResult> {
  const sql = contentDatabase();
  if (sql === null) return Object.freeze({ state: 'not-configured', checked: 0, candidates: 0, entityIds: Object.freeze([]) });
  const rows = await sql`
    SELECT entity.id AS entity_id, building.key AS building_key,
      building.official_name, coalesce(building.road_address, building.legal_address) AS address
    FROM property_entities entity
    JOIN buildings building ON building.key = entity.local_attributes ->> 'legacyBuildingKey'
    LEFT JOIN (
      SELECT subject_entity_id, count(*)::bigint AS observation_count
      FROM observations
      WHERE status = 'active'
      GROUP BY subject_entity_id
    ) popularity ON popularity.subject_entity_id = entity.id
    WHERE entity.market_id = ${market}
      AND entity.identity_status = 'verified'
      AND building.identity_status = 'verified'
      AND coalesce(building.road_address, building.legal_address) IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM building_enrichment_attempts attempt
        WHERE attempt.building_key = building.key
          AND attempt.pipeline = 'photo-naver-search'
          AND attempt.next_retry_at > now()
      )
    ORDER BY
      coalesce(popularity.observation_count, 0) DESC,
      CASE WHEN building.latitude IS NOT NULL AND building.longitude IS NOT NULL THEN 0 ELSE 1 END,
      entity.id
    LIMIT ${limit}
  `;
  const buildings = rows.flatMap((row) => (
    typeof row.entity_id === 'string' && typeof row.building_key === 'string'
      && typeof row.official_name === 'string' && typeof row.address === 'string'
      ? [{
        entityId: row.entity_id,
        buildingKey: row.building_key,
        officialName: row.official_name,
        address: row.address,
      }]
      : []
  ));
  const outcomes = await runOrderedProviderBatch(buildings, async (building) => {
    const result = await searchNaverBuildingImages({
      buildingName: building.officialName, address: building.address, display: 20,
    });
    const status = result.state === 'ready'
      ? result.candidates.length > 0 ? 'succeeded' : 'no-candidate'
      : 'provider-error';
    const reason = result.state === 'ready' ? `result-count:${result.candidates.length}` : result.reason ?? result.state;
    const retry = status === 'succeeded' ? '365 days' : status === 'no-candidate' ? '30 days' : '1 day';
    await sql`
      INSERT INTO building_enrichment_attempts (
        building_key, pipeline, status, reason, attempted_at, next_retry_at
      ) VALUES (
        ${building.buildingKey}, 'photo-naver-search', ${status}, ${reason}, now(), now() + ${retry}::interval
      )
      ON CONFLICT (building_key, pipeline) DO UPDATE SET
        status = excluded.status, reason = excluded.reason, attempted_at = now(),
        next_retry_at = excluded.next_retry_at, updated_at = now()
    `;
    return Object.freeze({
      entityId: building.entityId,
      candidates: result.candidates.length,
      reason: result.reason,
      stop: result.state === 'provider-error' && ['http-401', 'http-403'].includes(result.reason ?? ''),
    });
  }, { concurrency: 5, deadlineMs: 45_000, shouldStop: (outcome) => outcome.stop });
  const entityIds = outcomes.map((outcome) => outcome.entityId);
  const candidates = outcomes.reduce((sum, outcome) => sum + outcome.candidates, 0);
  const terminal = outcomes.find((outcome) => outcome.stop);
  return Object.freeze({
    state: terminal === undefined ? 'ready' : 'provider-error',
    checked: entityIds.length,
    candidates,
    entityIds: Object.freeze(entityIds),
    ...(terminal?.reason === undefined ? {} : { reason: terminal.reason }),
  });
}

export async function runPhotoBackfillSlice(options: PhotoBackfillOptions) {
  return createPhotoBackfillRunner(databaseDependencies())(options);
}

export async function readPhotoCoverageStatus() {
  const sql = contentDatabase();
  if (sql === null) throw new Error('database_not_configured');
  const [coverage, providerHealth, dailyUsage, missingRows, reviewRows] = await Promise.all([
    readPhotoCoverageSummary(),
    sql`SELECT provider, state, reason, paused_until AS "pausedUntil", checked_at AS "checkedAt" FROM photo_provider_health ORDER BY provider`,
    sql`SELECT provider, usage_date AS "usageDate", request_count AS "requestCount", estimated_cost_microusd AS "estimatedCostMicrousd" FROM photo_provider_daily_usage WHERE usage_date >= current_date - 1 ORDER BY usage_date DESC, provider`,
    sql`
      SELECT count(*)::text AS count
      FROM property_entities entity
      LEFT JOIN buildings building ON building.key = entity.local_attributes ->> 'legacyBuildingKey'
      WHERE entity.market_id IN ('kr-seoul', 'sg-singapore')
        AND (building.latitude IS NULL OR building.longitude IS NULL)
    `,
    sql`SELECT count(*)::text AS count FROM building_photos WHERE status IN ('candidate', 'review_required')`,
  ]);
  return Object.freeze({
    coverage,
    providerHealth: Object.freeze(providerHealth.map((row) => Object.freeze({ ...row }))),
    dailyUsage: Object.freeze(dailyUsage.map((row) => Object.freeze({ ...row }))),
    missingCoordinates: Number(missingRows[0]?.count ?? 0),
    reviewQueue: Number(reviewRows[0]?.count ?? 0),
  });
}
