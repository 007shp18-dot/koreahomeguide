import { contentDatabase } from '../../../../lib/db/postgres.server';
import { authorized, equalSecret, operatorId, sameOrigin } from '../../../../lib/evidence-pool/auth.server';
import { createCollectionRepository, runDueCollection } from '../../../../lib/data-operations/repository.server';
import { marketCollectionStatus } from '../../../../lib/data-operations/market-status.server';
import { probeKaptCosts } from '../../../../lib/data-operations/kapt-probe.server';
import { importAmktcDrafts } from '../../../../lib/data-operations/tariff-import.server';
import { COLLECTION_SOURCES } from '../../../../lib/data-operations/registry';
export const runtime = 'nodejs';
export const maxDuration = 180;
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
function cron(request: Request) { const secret = process.env.CRON_SECRET?.trim(); return Boolean(secret && equalSecret(request.headers.get('authorization') ?? '', `Bearer ${secret}`)); }
export async function GET(request: Request) {
 const isCron = cron(request);
 if (!isCron && !authorized(request)) return reply({ error: 'unauthorized' },401);
 const db = contentDatabase(); if (!db) return reply({ error: 'database_not_configured' },503);
 const sql = { query: (statement: string, parameters?: unknown[]) => db.query(statement,parameters) };
 try {
  if (isCron) return reply({ results: await runDueCollection(sql) });
  const repository = createCollectionRepository(sql); const snapshotId = new URL(request.url).searchParams.get('snapshotId');
  if (snapshotId) { if (!/^[a-f0-9-]{36}$/i.test(snapshotId)) return reply({ error: 'invalid_id' },400); return reply({ snapshot: await repository.snapshot(snapshotId) }); }
  const sourceId = new URL(request.url).searchParams.get('sourceId');
  if (sourceId) { if (!COLLECTION_SOURCES.some((s) => s.id === sourceId)) return reply({ error: 'invalid_source' },400); return reply({ snapshots: await repository.snapshots(sourceId) }); }
  const [sources,markets] = await Promise.all([repository.status(),marketCollectionStatus(sql)]);
  return reply({ sources, markets, publication: 'Raw snapshots require review and structured evidence before publication.' });
 } catch { return reply({ error: 'collection_storage_unavailable' },503); }
}
export async function POST(request: Request) {
 if (!authorized(request)) return reply({ error: 'unauthorized' },401);
 if (!sameOrigin(request)) return reply({ error: 'invalid_origin' },403);
 if (Number(request.headers.get('content-length')) > 4096) return reply({ error: 'request_too_large' },413);
 const db = contentDatabase(); if (!db) return reply({ error: 'database_not_configured' },503);
 const sql = { query: (statement: string, parameters?: unknown[]) => db.query(statement,parameters) };
 try {
  const reader=request.body?.getReader(); if(!reader)return reply({error:'invalid_command'},400);
  const chunks:Uint8Array[]=[];let bytes=0;
  try{while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>4096)return reply({error:'request_too_large'},413);chunks.push(part.value);}}finally{await reader.cancel();}
  const text=Buffer.concat(chunks).toString('utf8');
  const body = JSON.parse(text);
  if (body.action === 'probe-kapt') return reply({ probe: await probeKaptCosts(sql) });
  if (body.action === 'collect' && typeof body.sourceId === 'string' && COLLECTION_SOURCES.some((s) => s.id === body.sourceId && s.mode === 'page-monitor')) return reply({ results: await runDueCollection(sql,{sourceId:body.sourceId}) });
  if (body.action === 'import-amktc-drafts' && typeof body.snapshotId === 'string' && /^[a-f0-9-]{36}$/i.test(body.snapshotId)) return reply(await importAmktcDrafts(sql,body.snapshotId,operatorId(request)));
  if (body.action === 'review' && typeof body.snapshotId === 'string' && /^[a-f0-9-]{36}$/i.test(body.snapshotId) && ['reviewed','rejected'].includes(body.status) && typeof body.reason === 'string' && body.reason.trim() && body.reason.length <= 240) return reply({ changed: await createCollectionRepository(sql).review(body.snapshotId,body.status,operatorId(request),body.reason) });
  return reply({ error: 'invalid_command' },400);
 } catch { return reply({ error: 'collection_request_failed' },400); }
}
