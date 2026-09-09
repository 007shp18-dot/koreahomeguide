import 'server-only';
import type { SqlPort } from '../evidence-pool/repository.server';
import { MARKET_REFRESH_JOBS } from '../market-data/refresh-types';

export type MarketCollectionStatus = {
  job: string; enabled: boolean; state: string | null; lastAttemptAt: string | null;
  lastSuccessAt: string | null; sourceAsOf: string | null; errorCode: string | null;
  received: number; inserted: number; updated: number; unchanged: number; unlinked: number;
  consecutiveFailures: number; anomaly: string | null;
};
const instant = (value: unknown) => value == null ? null : value instanceof Date ? value.toISOString() : String(value);
export async function marketCollectionStatus(sql: SqlPort): Promise<MarketCollectionStatus[]> {
  const rows = await sql.query(`WITH ordered AS (
    SELECT *, row_number() OVER (PARTITION BY job ORDER BY started_at DESC,id DESC) AS position
    FROM market_data_refresh_runs
  ) SELECT latest.*, success.completed_at AS last_success_at, previous.received AS previous_received,
    (SELECT count(*)::integer FROM market_data_refresh_runs f WHERE f.job=latest.job AND f.state='failed'
      AND f.started_at > coalesce(success.started_at,'-infinity'::timestamptz)) AS consecutive_failures
  FROM ordered latest
  LEFT JOIN LATERAL (SELECT * FROM market_data_refresh_runs r WHERE r.job=latest.job AND r.state='succeeded' ORDER BY r.started_at DESC,r.id DESC LIMIT 1) success ON true
  LEFT JOIN LATERAL (SELECT received FROM market_data_refresh_runs r WHERE r.job=latest.job AND r.state='succeeded' AND r.id<>latest.id ORDER BY r.started_at DESC,r.id DESC LIMIT 1) previous ON true
  WHERE latest.position=1`);
  const enabled = (process.env.SIGNEDPRICE_MARKET_REFRESH_JOBS ?? '').split(',').map(value => value.trim());
  const validConfiguration = enabled.every(value => MARKET_REFRESH_JOBS.some(job => job === value)) && new Set(enabled).size === enabled.length;
  return MARKET_REFRESH_JOBS.map(job => {
    const row = rows.find(value => value.job === job);
    return { job, enabled: validConfiguration && enabled.includes(job), state: row?.state == null ? null : String(row.state),
      lastAttemptAt: instant(row?.started_at), lastSuccessAt: instant(row?.last_success_at), sourceAsOf: instant(row?.source_as_of),
      errorCode: row?.error_code == null ? null : String(row.error_code),
      received: Number(row?.received ?? 0), inserted: Number(row?.inserted ?? 0), updated: Number(row?.updated ?? 0),
      unchanged: Number(row?.unchanged ?? 0), unlinked: Number(row?.unlinked ?? 0), consecutiveFailures: Number(row?.consecutive_failures ?? 0),
      anomaly: row?.state === 'succeeded' && Number(row.previous_received) > 0 && Number(row.received) < Number(row.previous_received) * 0.5 ? '수집량이 이전 성공보다 50% 이상 감소했습니다. 원자료 기간 변경 여부를 확인하세요.' : null };
  });
}
