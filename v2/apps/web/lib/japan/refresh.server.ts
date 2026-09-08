import 'server-only';
import { collectJapanSnapshot, parseJapanScope, type JapanScope } from './source.server';
import type { createJapanRepository } from './repository.server';

// One ward and one quarter per invocation. Weekly rotation revisits the previous
// eight completed quarters, accommodating provider lag and retrospective revisions.
export function scheduledJapanScope(now = new Date()): JapanScope {
  const current = now.getUTCFullYear() * 4 + Math.floor(now.getUTCMonth() / 3);
  const week = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
  const target = current - 1 - (week % 8);
  return parseJapanScope(new URLSearchParams({ city: '13103', year: String(Math.floor(target / 4)), quarter: String(target % 4 + 1) }));
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
