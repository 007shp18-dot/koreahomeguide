import 'server-only';
import { collectJapanSnapshot, parseJapanScope, type JapanScope } from './source.server';
import type { createJapanRepository } from './repository.server';
import { TOKYO_WARDS } from './query';

// One ward and one quarter per hourly invocation. A 23-hour block covers all
// wards, and eight blocks revisit the completed-quarter window without bursts.
export function scheduledJapanScope(now = new Date()): JapanScope {
  const hour = Math.floor(now.getTime() / (60 * 60 * 1000));
  const current = now.getUTCFullYear() * 4 + Math.floor(now.getUTCMonth() / 3);
  const completedQuarters = Math.min(8, current - 2024 * 4);
  if (!Number.isFinite(hour) || completedQuarters < 1) throw new TypeError('invalid_scope');
  const ward = TOKYO_WARDS[hour % TOKYO_WARDS.length];
  if (!ward) throw new TypeError('invalid_scope');
  const [city] = ward;
  const target = current - 1 - (Math.floor(hour / TOKYO_WARDS.length) % completedQuarters);
  return parseJapanScope(new URLSearchParams({ city, year: String(Math.floor(target / 4)), quarter: String(target % 4 + 1) }));
}
export async function refreshJapan(repository: ReturnType<typeof createJapanRepository>, scope: JapanScope,
  apiKey: string, options: { fetchResponse?: typeof fetch; allowLargeReduction?: boolean } = {}) {
  const run = await repository.start();
  if (run === null) return { state: 'busy' as const };
  let phase: 'source' | 'storage' = 'source';
  try {
    const snapshot = await collectJapanSnapshot(scope, apiKey, options.fetchResponse);
    phase = 'storage';
    await repository.stage(run, snapshot);
    await repository.activate(run, options.allowLargeReduction);
    return { state: 'ready' as const, releaseId: run.releaseId, received: snapshot.records.length,
      sourceAsOf: snapshot.retrievedAt, snapshotHash: snapshot.snapshotHash, scope };
  } catch (error) {
    const safeStorageCode = ['lease_expired', 'candidate_incomplete', 'source_count_reduction', 'run_invalid']
      .find(code => error instanceof Error && error.message.includes(code));
    const code = phase === 'storage' ? safeStorageCode ?? 'storage_or_publication_failed'
      : error instanceof TypeError || error instanceof SyntaxError ? 'source_invalid' : 'provider_unavailable';
    try { await repository.fail(run, code); } catch { /* Lease expires; no public pointer was changed. */ }
    return { state: 'failed' as const, code };
  }
}
