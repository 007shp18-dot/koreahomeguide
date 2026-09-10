import 'server-only';
import { randomUUID } from 'node:crypto';
import type { SqlPort } from '../evidence-pool/repository.server';
import { COLLECTION_SOURCES, type CollectionSource } from './registry';
import { CollectionError, collectionFailureCode, fetchSource } from './fetch.server';
export type CollectionStatus = { sourceId: string; name: string; market: string; category: string; url: string; mode: string; intervalDays: number; limitation: string; lastSuccessAt: string | null; lastAttemptAt: string | null; nextDueAt: string | null; lastPublishedAt: string | null; consecutiveFailures: number; lastError: string | null; anomaly: string | null; newCount: number; changedCount: number; pendingCount: number; latestSnapshotId: string | null; probe: Record<string, unknown> | null; pendingCandidateCount: number; recordCount: number };
function time(value: unknown): string | null { return value instanceof Date ? value.toISOString() : value ? String(value) : null; }
export function createCollectionRepository(sql: SqlPort) {
 return {
  async status(): Promise<CollectionStatus[]> {
   const rows = await sql.query(`SELECT s.*, (SELECT count(*)::int FROM data_collection_snapshots p WHERE p.source_id=s.source_id AND p.status='pending') AS pending_count, (SELECT id FROM data_collection_snapshots p WHERE p.source_id=s.source_id ORDER BY fetched_at DESC,id DESC LIMIT 1) AS latest_snapshot_id FROM data_collection_state s`);
   const probes=await sql.query('SELECT source_id,result FROM data_collection_probes');
   const hdb=(await sql.query("SELECT (SELECT count(*)::int FROM hdb_building_candidates WHERE status='pending') AS pending,(SELECT count(*)::int FROM hdb_building_current) AS records,(SELECT max(published_at) FROM hdb_building_public) AS published_at"))[0];
   const onemap=(await sql.query("SELECT (SELECT count(*)::int FROM onemap_location_candidates WHERE status='pending') AS pending,(SELECT count(*)::int FROM onemap_location_current) AS records,(SELECT max(updated_at) FROM public_entity_locations WHERE rights_policy_id='sg-onemap-search-v1' AND verification_status='verified') AS published_at"))[0];
   return COLLECTION_SOURCES.map((source) => { const row = rows.find((r) => r.source_id === source.id); const candidateStatus=source.id==='sg-hdb-buildings'?hdb:source.id==='sg-onemap-building'?onemap:null; return { sourceId: source.id, name: source.name, market: source.market, category: source.category, url: source.url, mode: source.mode, intervalDays: source.intervalDays, limitation: source.limitation, lastSuccessAt: time(row?.last_success_at), lastAttemptAt: time(row?.last_attempt_at), nextDueAt: time(row?.next_due_at), lastPublishedAt: time(candidateStatus?.published_at), consecutiveFailures: Number(row?.consecutive_failures ?? 0), lastError: row?.last_error ? String(row.last_error) : null, anomaly: row?.anomaly ? String(row.anomaly) : null, newCount: Number(row?.new_count ?? 0), changedCount: Number(row?.changed_count ?? 0), pendingCount: Number(row?.pending_count ?? 0), latestSnapshotId: row?.latest_snapshot_id ? String(row.latest_snapshot_id) : null, probe: (probes.find((p)=>p.source_id===source.id)?.result as Record<string,unknown>) ?? null, pendingCandidateCount: Number(candidateStatus?.pending??0), recordCount: Number(candidateStatus?.records??0) }; });
  },
  async snapshots(sourceId: string) {
   return sql.query('SELECT id,source_id,source_url,content_hash,content_type,byte_count,fetched_at,previous_snapshot_id,status,reviewed_at,review_reason FROM data_collection_snapshots WHERE source_id=$1 ORDER BY fetched_at DESC,id DESC LIMIT 50', [sourceId]);
  },
  async snapshot(id: string) {
   return (await sql.query('SELECT id,source_id,source_url,content_hash,content,content_type,byte_count,fetched_at,previous_snapshot_id,status,reviewed_at,review_reason FROM data_collection_snapshots WHERE id=$1::uuid', [id]))[0] ?? null;
  },
  async review(id: string, status: 'reviewed' | 'rejected', actor: string, reason: string) {
   if (!reason.trim() || reason.length > 240) throw new Error('invalid_reason');
   const rows = await sql.query(`UPDATE data_collection_snapshots SET status=$2,reviewed_at=now(),reviewer=$3,review_reason=$4 WHERE id=$1::uuid AND status='pending' RETURNING id`, [id,status,actor,reason]);
   return rows.length === 1;
  },
  async collect(source: CollectionSource, force = false, fetcher: typeof fetch = fetch) {
   if (source.mode !== 'page-monitor' || !COLLECTION_SOURCES.some((s) => s.id === source.id && s.url === source.url)) return { sourceId: source.id, status: 'blocked' };
   await sql.query('INSERT INTO data_collection_state(source_id) VALUES($1) ON CONFLICT DO NOTHING', [source.id]);
   const token = randomUUID();
   const lease = await sql.query(`UPDATE data_collection_state SET lease_token=$2::uuid,lease_until=now()+interval '2 minutes',last_attempt_at=now() WHERE source_id=$1 AND (lease_until IS NULL OR lease_until < now()) AND ($3::boolean OR next_due_at <= now()) RETURNING *`, [source.id,token,force]);
   if (!lease[0]) return { sourceId: source.id, status: 'not_due_or_busy' };
   const runId = randomUUID();
   await sql.query(`WITH expired AS (UPDATE data_collection_runs SET status='failed',completed_at=now(),error_code='lease_expired' WHERE source_id=$2 AND status='running') INSERT INTO data_collection_runs(id,source_id,status) VALUES($1::uuid,$2,'running')`, [runId,source.id]);
   try {
    const page = await fetchSource(source,fetcher); const old = lease[0]!;
    const state = old.last_hash === page.hash ? 'unchanged' : old.last_hash ? 'changed' : 'new';
    const anomaly = Number(old.last_bytes) > 0 && page.bytes < Number(old.last_bytes)*0.5 ? 'content_size_drop_over_50_percent' : null;
    // One statement fences the lease, stores history and completes state/run atomically.
    const rows = await sql.query(`WITH owned AS MATERIALIZED (SELECT * FROM data_collection_state WHERE source_id=$1 AND lease_token=$2::uuid AND lease_until>now() FOR UPDATE), saved AS (
      INSERT INTO data_collection_snapshots(id,source_id,source_url,content_hash,content,content_type,byte_count,previous_snapshot_id)
      SELECT $3::uuid,$1,$12,$4,$5,$6,$7,(SELECT id FROM data_collection_snapshots WHERE source_id=$1 ORDER BY fetched_at DESC,id DESC LIMIT 1) FROM owned WHERE $8 <> 'unchanged' RETURNING id
    ), done AS (UPDATE data_collection_state s SET last_success_at=now(),next_due_at=now()+($9::int*interval '1 day'),last_hash=$4,last_bytes=$7,consecutive_failures=0,last_error=NULL,anomaly=$10,new_count=CASE WHEN $8='new' THEN 1 ELSE 0 END,changed_count=CASE WHEN $8='changed' THEN 1 ELSE 0 END,lease_token=NULL,lease_until=NULL FROM owned WHERE s.source_id=owned.source_id RETURNING s.source_id)
    UPDATE data_collection_runs SET status=$8,completed_at=now(),byte_count=$7,anomaly=$10 WHERE id=$11::uuid AND EXISTS(SELECT 1 FROM done) RETURNING id`, [source.id,token,randomUUID(),page.hash,page.content,page.contentType,page.bytes,state,source.intervalDays,anomaly,runId,source.url]);
    if (!rows.length) throw new CollectionError('lease_lost');
    return { sourceId: source.id, status: state, bytes: page.bytes, anomaly };
   } catch (error) {
    const code = collectionFailureCode(error);
    await sql.query(`WITH done AS (UPDATE data_collection_state SET consecutive_failures=consecutive_failures+1,last_error=$3,next_due_at=now()+least(24,power(2,least(consecutive_failures,5))) * interval '1 hour',lease_token=NULL,lease_until=NULL WHERE source_id=$1 AND lease_token=$2::uuid RETURNING source_id) UPDATE data_collection_runs SET status='failed',completed_at=now(),error_code=$3 WHERE id=$4::uuid`, [source.id,token,code,runId]);
    return { sourceId: source.id, status: 'failed', error: code };
   }
  },
 };
}
export async function runDueCollection(sql: SqlPort, options: { sourceId?: string; limit?: number } = {}) {
 const repository = createCollectionRepository(sql);
 const sources = COLLECTION_SOURCES.filter((source) => source.mode === 'page-monitor' && (!options.sourceId || options.sourceId === source.id));
 const results = [];
 for (const source of sources.slice(0,Math.max(1,Math.min(8,options.limit ?? 8)))) results.push(await repository.collect(source,Boolean(options.sourceId)));
 return results;
}
