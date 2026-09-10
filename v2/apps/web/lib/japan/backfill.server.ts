import 'server-only';
import type { MarketRefreshSqlPort } from '../market-data/refresh-repository.server';
import { createJapanRepository, japanSqlPort } from './repository.server';
import { refreshJapan } from './refresh.server';
import { TOKYO_WARDS } from './query';
import { scopeKey, type JapanScope } from './source.server';

export function japanBackfillScopes(now = new Date()): JapanScope[] {
  if (!Number.isFinite(now.getTime())) throw new TypeError('invalid_date');
  const current = now.getUTCFullYear() * 4 + Math.floor(now.getUTCMonth() / 3);
  const scopes: JapanScope[] = [];
  for (let period = current - 1; period >= 2024 * 4; period--) {
    for (const [city] of TOKYO_WARDS) scopes.push({ city, year: String(Math.floor(period / 4)), quarter: String(period % 4 + 1) });
  }
  return scopes;
}

async function inventory(port: MarketRefreshSqlPort, now: Date) {
  const rows = await port.query(`/* japan:backfill-inventory */
    SELECT p.city, p.year, p.quarter, true AS published, NULL::text AS retry_after
    FROM japan_area_publications p JOIN japan_area_releases r ON r.id = p.release_id
    WHERE r.state = 'published'
    UNION ALL
    SELECT a.city, a.year, a.quarter, false AS published, a.retry_after::text
    FROM japan_backfill_attempts a WHERE NOT EXISTS (
      SELECT 1 FROM japan_area_publications p WHERE p.city = a.city AND p.year = a.year AND p.quarter = a.quarter)
  `);
  const published = new Set<string>();
  const deferred = new Set<string>();
  for (const row of rows) {
    const key = scopeKey({ city: String(row.city), year: String(row.year), quarter: String(row.quarter) });
    if (row.published === true) published.add(key);
    else if (Date.parse(String(row.retry_after)) > now.getTime()) deferred.add(key);
  }
  const scopes = japanBackfillScopes(now);
  const due = scopes.filter(scope => !published.has(scopeKey(scope)) && !deferred.has(scopeKey(scope)));
  const quarters = new Map<string, { year: string; quarter: string; published: number; deferred: number; remaining: number }>();
  for (const scope of scopes) {
    const period = `${scope.year}:${scope.quarter}`;
    const counts = quarters.get(period) ?? { year: scope.year, quarter: scope.quarter, published: 0, deferred: 0, remaining: 0 };
    counts[published.has(scopeKey(scope)) ? 'published' : deferred.has(scopeKey(scope)) ? 'deferred' : 'remaining']++;
    quarters.set(period, counts);
  }
  const periods = [...quarters.values()];
  return { due, status: { total: scopes.length, published: periods.reduce((n, q) => n + q.published, 0),
    deferred: periods.reduce((n, q) => n + q.deferred, 0), remaining: due.length,
    next: due[0] ?? null, quarters: periods } };
}

export async function readJapanBackfillStatus(port = japanSqlPort(), now = new Date()) {
  if (!port) throw new Error('database_not_configured');
  return (await inventory(port, now)).status;
}

export async function runJapanBackfill(options: {
  apiKey: string; port?: MarketRefreshSqlPort | null; maxScopes?: number; maxDurationMs?: number; now?: Date;
  // Injection points exercise real scope/backoff decisions without live source requests.
  refresh?: typeof refreshJapan; pause?: (ms: number) => Promise<void>; clock?: () => number;
}) {
  const port = options.port === undefined ? japanSqlPort() : options.port;
  if (!port) throw new Error('database_not_configured');
  if (!options.apiKey.trim()) throw new Error('configuration_missing');
  const maxScopes = options.maxScopes ?? 3;
  const budget = options.maxDurationMs ?? 75_000;
  if (!Number.isInteger(maxScopes) || maxScopes < 1 || maxScopes > 3
    || !Number.isFinite(budget) || budget < 30_000 || budget > 75_000) throw new TypeError('invalid_backfill_bound');
  const now = options.now ?? new Date();
  const clock = options.clock ?? Date.now;
  const started = clock();
  const pause = options.pause ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  const refresh = options.refresh ?? refreshJapan;
  const { due } = await inventory(port, now);
  const results: Array<{ scope: JapanScope; state: 'ready' | 'failed' | 'busy'; code?: string; received?: number }> = [];
  let busy = false;
  for (const scope of due.slice(0, maxScopes)) {
    // Reserve the provider's 25-second timeout plus storage time before starting.
    if (clock() - started > budget - 30_000) break;
    if (results.length) await pause(1_000);
    const claimed = await port.query(`/* japan:backfill-claim */
      INSERT INTO japan_backfill_attempts (city, year, quarter, state, checked_at, retry_after)
      VALUES ($1, $2::integer, $3::integer, 'running', now(), now() + interval '10 minutes')
      ON CONFLICT (city, year, quarter) DO UPDATE SET state = 'running', checked_at = now(),
        retry_after = now() + interval '10 minutes', error_code = NULL, attempts = japan_backfill_attempts.attempts + 1
      WHERE japan_backfill_attempts.retry_after <= now()
      RETURNING city`, [scope.city, scope.year, scope.quarter]);
    if (!claimed.length) { busy = true; break; }
    const result = await refresh(createJapanRepository(port), scope, options.apiKey);
    const code = result.state === 'failed' ? result.code : null;
    const retrySeconds = code === 'no_data' ? 86_400 : result.state === 'busy' ? 60 : 900;
    await port.query(`/* japan:backfill-finish */ UPDATE japan_backfill_attempts
      SET state = $4, checked_at = now(), retry_after = now() + $5::integer * interval '1 second', error_code = $6
      WHERE city = $1 AND year = $2::integer AND quarter = $3::integer`,
    [scope.city, scope.year, scope.quarter, code === 'no_data' ? 'no_data' : result.state, retrySeconds, code]);
    results.push({ scope, state: result.state, ...(code ? { code } : {}),
      ...(result.state === 'ready' ? { received: result.received } : {}) });
    if (result.state === 'busy') { busy = true; break; }
    if (result.state === 'failed' && code !== 'no_data') break;
  }
  const status = await readJapanBackfillStatus(port, now);
  return { ...status, state: busy ? 'busy' as const : status.remaining > 0 ? 'partial' as const
    : status.deferred > 0 ? 'deferred' as const : 'complete' as const,
    attempted: results.length, results };
}
