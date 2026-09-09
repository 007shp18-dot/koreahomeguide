import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import type { SqlPort } from '../evidence-pool/repository.server';
const SOURCE = 'sg-hdb-buildings';
const RESOURCE = 'd_17f5382f26140b1fdae0ba2ef6239d2f';
const ENDPOINT = `https://data.gov.sg/api/action/datastore_search?resource_id=${RESOURCE}`;
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
const normalize = (v: string) => v.trim().toUpperCase().replace(/\s+/g, ' ');
const key = (block: string, street: string) => JSON.stringify([normalize(block),normalize(street)]);
type Candidate = { id: string; provider_key: string; content_hash: string; snapshot_id: string; entity_id: string | null; block: string; street: string; year_completed: number | null; max_floor_level: number | null; dwelling_units: number | null; residential: boolean; town: string };
type Page = { id: string; url: string; hash: string; content: string; bytes: number };
function integer(v: unknown, maximum: number): number | null {
 if (v === '' || v === null || v === undefined || v === 'NA') return null;
 const n = Number(v); if (!Number.isInteger(n) || n < 0 || n > maximum) throw new Error('invalid_numeric_field'); return n;
}
export function normalizeHdbBuilding(raw: Record<string, unknown>, snapshotId: string): Candidate {
 if (typeof raw.blk_no !== 'string' || !raw.blk_no.trim() || typeof raw.street !== 'string' || !raw.street.trim() || !['Y','N'].includes(String(raw.residential)) || typeof raw.bldg_contract_town !== 'string') throw new Error('invalid_building_record');
 const content = Object.fromEntries(Object.entries(raw).filter(([k]) => k !== '_id').sort(([a],[b]) => a.localeCompare(b)));
 return { id: randomUUID(), provider_key: key(raw.blk_no,raw.street), content_hash: digest(JSON.stringify(content)), snapshot_id: snapshotId, entity_id: null, block: raw.blk_no.trim(), street: raw.street.trim(), year_completed: integer(raw.year_completed,2200), max_floor_level: integer(raw.max_floor_lvl,300), dwelling_units: integer(raw.total_dwelling_units,100000), residential: raw.residential === 'Y', town: raw.bldg_contract_town };
}
export async function fetchHdbBuildings(fetcher: typeof fetch = fetch) {
 const deadline=Date.now()+180000;
 const pages: Page[] = []; const records: Candidate[] = []; const keys = new Set<string>(); let total: number | null = null;
 for (let offset = 0; offset < (total ?? 1); offset += 1000) {
  const url = `${ENDPOINT}&limit=1000&offset=${offset}&sort=_id%20asc`;
  let response: Response | undefined;
  for (let attempt=0;attempt<3;attempt++) {
   if(Date.now()>=deadline)throw new Error('provider_deadline');
   try { response = await fetcher(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(Math.min(15000,Math.max(1,deadline-Date.now())))}); if (response.ok || (response.status!==429 && response.status<500)) break; } catch { if(attempt===2) throw new Error('provider_transport'); }
  }
  if (!response?.ok) throw new Error(`provider_http_${response?.status ?? 'failed'}`);
  if (Number(response.headers.get('content-length')) > 2000000) throw new Error('page_too_large');
  const reader=response.body?.getReader(); if(!reader) throw new Error('empty_page'); const chunks: Uint8Array[]=[]; let bytes=0;
  while(true) { const chunk=await reader.read(); if(chunk.done) break; bytes+=chunk.value.byteLength; if(bytes>2000000) {await reader.cancel();throw new Error('page_too_large');} chunks.push(chunk.value); }
  const content=Buffer.concat(chunks).toString('utf8');
  let envelope; try { envelope=JSON.parse(content); } catch { throw new Error('invalid_json'); }
  const result=envelope?.result;
  if(envelope?.success!==true || result?.resource_id!==RESOURCE || !Number.isInteger(result.total) || result.total<1 || result.total>50000 || !Array.isArray(result.records)) throw new Error('invalid_envelope');
  if(total!==null && total!==result.total) throw new Error('provider_total_changed'); total=result.total;
  if(result.records.length!==Math.min(1000,total!-offset)) throw new Error('incomplete_page');
  const page={id:randomUUID(),url,hash:digest(content),content,bytes}; pages.push(page);
  for(const raw of result.records) { const record=normalizeHdbBuilding(raw,page.id); if(keys.has(record.provider_key)) throw new Error('duplicate_provider_key'); keys.add(record.provider_key);records.push(record); }
 }
 return {pages,records,hash:digest(records.map(r=>`${r.provider_key}:${r.content_hash}`).sort().join('\n'))};
}
export async function runHdbBuildingCollection(sql: SqlPort, options: {force?: boolean; fetcher?: typeof fetch} = {}) {
 await sql.query('INSERT INTO data_collection_state(source_id) VALUES($1) ON CONFLICT DO NOTHING',[SOURCE]);
 const token=randomUUID(), runId=randomUUID();
 const [old]=await sql.query(`UPDATE data_collection_state SET lease_token=$2::uuid,lease_until=now()+interval '5 minutes',last_attempt_at=now() WHERE source_id=$1 AND (lease_until IS NULL OR lease_until<now()) AND ($3::boolean OR next_due_at<=now()) RETURNING *`,[SOURCE,token,Boolean(options.force)]);
 if(!old) return {sourceId:SOURCE,status:'not_due_or_busy'};
 await sql.query(`INSERT INTO data_collection_runs(id,source_id,status) VALUES($1::uuid,$2,'running')`,[runId,SOURCE]);
 try {
  const batch=await fetchHdbBuildings(options.fetcher);
  const existing=await sql.query(`SELECT id,local_attributes->>'block' AS block,local_attributes->>'street' AS street FROM property_entities WHERE market_id='sg-singapore' AND housing_sector='hdb'`);
  const matches=new Map<string,string|null>();
  for(const row of existing) { if(typeof row.block!=='string'||typeof row.street!=='string')continue; const k=key(row.block,row.street); matches.set(k,matches.has(k)?null:String(row.id)); }
  for(const row of batch.records) row.entity_id=matches.get(row.provider_key)??null;
  const prior=await sql.query('SELECT provider_key,content_hash FROM hdb_building_current');
  const hashes=new Map(prior.map(r=>[String(r.provider_key),String(r.content_hash)]));
  const newCount=batch.records.filter(r=>!hashes.has(r.provider_key)).length;
  const changedCount=batch.records.filter(r=>hashes.has(r.provider_key)&&hashes.get(r.provider_key)!==r.content_hash).length;
  const status=old.last_hash===batch.hash?'unchanged':old.last_hash?'changed':'new';
  const present=new Set(batch.records.map(r=>r.provider_key)); const missing=prior.filter(r=>!present.has(String(r.provider_key))).length;
  const anomaly=missing>0?`previous_buildings_absent:${missing}`:null;
  const bytes=batch.pages.reduce((n,p)=>n+p.bytes,0);
  const saved=await sql.query(`WITH owned AS MATERIALIZED (SELECT source_id FROM data_collection_state WHERE source_id=$1 AND lease_token=$2::uuid AND lease_until>now() FOR UPDATE),
   snapshots AS (INSERT INTO data_collection_snapshots(id,source_id,source_url,content_hash,content,content_type,byte_count)
    SELECT p.id::uuid,$1,p.url,p.hash,p.content,'application/json',p.bytes FROM jsonb_to_recordset($3::jsonb) p(id text,url text,hash text,content text,bytes integer),owned WHERE $6<>'unchanged' RETURNING id),
   candidates AS (INSERT INTO hdb_building_candidates(id,provider_key,content_hash,snapshot_id,entity_id,block,street,year_completed,max_floor_level,dwelling_units,residential,town)
    SELECT r.id::uuid,r.provider_key,r.content_hash,r.snapshot_id::uuid,r.entity_id,r.block,r.street,r.year_completed,r.max_floor_level,r.dwelling_units,r.residential,r.town FROM jsonb_to_recordset($4::jsonb) r(id text,provider_key text,content_hash text,snapshot_id text,entity_id text,block text,street text,year_completed integer,max_floor_level integer,dwelling_units integer,residential boolean,town text),owned
    WHERE $6<>'unchanged' AND EXISTS(SELECT 1 FROM snapshots WHERE id=r.snapshot_id::uuid) ON CONFLICT(provider_key,content_hash) DO NOTHING RETURNING id),
   pointers AS (INSERT INTO hdb_building_current(provider_key,content_hash) SELECT r.provider_key,r.content_hash FROM jsonb_to_recordset($4::jsonb) r(provider_key text,content_hash text),owned WHERE (SELECT count(*) FROM candidates)>=0 ON CONFLICT(provider_key) DO UPDATE SET content_hash=excluded.content_hash,last_seen_at=now() RETURNING provider_key),
   done AS (UPDATE data_collection_state s SET last_success_at=now(),next_due_at=now()+interval '7 days',last_hash=$5,last_bytes=$7,consecutive_failures=0,last_error=NULL,anomaly=$8,new_count=$9,changed_count=$10,lease_token=NULL,lease_until=NULL FROM owned WHERE s.source_id=owned.source_id AND (SELECT count(*) FROM pointers)>0 RETURNING s.source_id)
   UPDATE data_collection_runs SET status=$6,completed_at=now(),byte_count=$7,anomaly=$8 WHERE id=$11::uuid AND EXISTS(SELECT 1 FROM done) RETURNING id`,[SOURCE,token,JSON.stringify(batch.pages),JSON.stringify(batch.records),batch.hash,status,bytes,anomaly,newCount,changedCount,runId]);
  if(!saved.length)throw new Error('lease_lost');
  return {sourceId:SOURCE,status,newCount,changedCount,recordCount:batch.records.length,matchedCount:batch.records.filter(r=>r.entity_id).length,anomaly};
 } catch(error) {
  const known=error instanceof Error&&/^(provider_|invalid_|incomplete_|duplicate_|page_|empty_|lease_)/.test(error.message)?error.message:'storage_or_collection_failed';
  await sql.query(`WITH done AS (UPDATE data_collection_state SET consecutive_failures=consecutive_failures+1,last_error=$3,next_due_at=now()+least(24,power(2,least(consecutive_failures,5)))*interval '1 hour',lease_token=NULL,lease_until=NULL WHERE source_id=$1 AND lease_token=$2::uuid RETURNING source_id) UPDATE data_collection_runs SET status='failed',completed_at=now(),error_code=$3 WHERE id=$4::uuid`,[SOURCE,token,known,runId]);
  return {sourceId:SOURCE,status:'failed',error:known};
 }
}

export type HdbCandidateReviewItem = {
 id: string; version: number; status: string; block: string; street: string; entityId: string|null;
 yearCompleted: number|null; maxFloorLevel: number|null; dwellingUnits: number|null;
 residential: boolean; town: string; fetchedAt: string; sourceUrl: string; contentHash: string; isCurrent: boolean;
};
function candidateItem(r: Record<string,unknown>): HdbCandidateReviewItem {
 const nullable=(v:unknown)=>v===null||v===undefined?null:Number(v);
 return {id:String(r.id),version:Number(r.version),status:String(r.status),block:String(r.block),street:String(r.street),entityId:r.entity_id?String(r.entity_id):null,yearCompleted:nullable(r.year_completed),maxFloorLevel:nullable(r.max_floor_level),dwellingUnits:nullable(r.dwelling_units),residential:Boolean(r.residential),town:String(r.town),fetchedAt:r.fetched_at instanceof Date?r.fetched_at.toISOString():String(r.fetched_at),sourceUrl:String(r.source_url),contentHash:String(r.content_hash),isCurrent:Boolean(r.is_current)};
}
const REVIEW_SELECT=`SELECT c.*,s.source_url,EXISTS(SELECT 1 FROM hdb_building_current p WHERE p.provider_key=c.provider_key AND p.content_hash=c.content_hash) AS is_current FROM hdb_building_candidates c JOIN data_collection_snapshots s ON s.id=c.snapshot_id`;
export async function listHdbCandidates(sql:SqlPort,options:{page?:number;status?:string}={}) {
 if(options.page!==undefined&&(!Number.isInteger(options.page)||options.page<1))throw new Error('invalid_page');
 const page=Math.max(1,Math.min(10000,options.page??1));
 const status=options.status??'pending'; if(!['pending','approved','rejected','all'].includes(status))throw new Error('invalid_status');
 const [rows,total]=await Promise.all([sql.query(`${REVIEW_SELECT} WHERE ($1='all' OR c.status=$1) ORDER BY c.fetched_at DESC,c.id LIMIT 25 OFFSET $2`,[status,(page-1)*25]),sql.query(`SELECT count(*)::int AS total FROM hdb_building_candidates WHERE ($1='all' OR status=$1)`,[status])]);
 return {items:rows.map(candidateItem),page,total:Number(total[0]?.total??0)};
}
export async function getHdbCandidate(sql:SqlPort,id:string) {
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw new Error('invalid_id');
 const [row]=await sql.query(`${REVIEW_SELECT} WHERE c.id=$1::uuid`,[id]);
 if(!row)return null;
 const audit=await sql.query('SELECT previous_version,next_version,previous_status,next_status,reason,actor,reviewed_at FROM hdb_building_review_audit WHERE candidate_id=$1::uuid ORDER BY reviewed_at DESC',[id]);
 return {...candidateItem(row),audit};
}
export async function reviewHdbCandidate(sql:SqlPort,input:{id:string;version:number;status:'approved'|'rejected';reason:string;actor:string}) {
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id)||!Number.isInteger(input.version)||input.version<1||!['approved','rejected'].includes(input.status)||!input.reason.trim()||input.reason.length>500||!input.actor.trim()||input.actor.length>200)throw new Error('invalid_review');
 const rows=await sql.query(`WITH old AS MATERIALIZED (SELECT c.* FROM hdb_building_candidates c WHERE c.id=$1::uuid AND c.version=$2 AND c.status<>$3 AND ($3='rejected' OR (c.entity_id IS NOT NULL AND EXISTS(SELECT 1 FROM hdb_building_current p WHERE p.provider_key=c.provider_key AND p.content_hash=c.content_hash))) FOR UPDATE),
 changed AS (UPDATE hdb_building_candidates c SET status=$3,version=c.version+1 FROM old WHERE c.id=old.id RETURNING c.*),
 audit AS (INSERT INTO hdb_building_review_audit(id,candidate_id,previous_version,next_version,previous_status,next_status,reason,actor) SELECT $6::uuid,c.id,o.version,c.version,o.status,c.status,$4,$5 FROM changed c JOIN old o ON o.id=c.id RETURNING candidate_id),
 published AS (INSERT INTO hdb_building_public(entity_id,candidate_id) SELECT c.entity_id,c.id FROM changed c WHERE c.status='approved' AND EXISTS(SELECT 1 FROM audit) ON CONFLICT(entity_id) DO UPDATE SET candidate_id=excluded.candidate_id,published_at=now() RETURNING entity_id),
 withdrawn AS (DELETE FROM hdb_building_public p USING changed c WHERE c.status='rejected' AND p.candidate_id=c.id AND EXISTS(SELECT 1 FROM audit) RETURNING p.entity_id)
 SELECT id,version,status,entity_id FROM changed`,[input.id,input.version,input.status,input.reason.trim(),input.actor.trim(),randomUUID()]);
 const row=rows[0]; return row?{id:String(row.id),version:Number(row.version),status:String(row.status),entityId:row.entity_id?String(row.entity_id):null}:null;
}
export async function getApprovedHdbBuildingFacts(sql:SqlPort,entityId:string) {
 if(!entityId.startsWith('sg-singapore:block:'))return null;
 const [row]=await sql.query(`${REVIEW_SELECT} JOIN hdb_building_public p ON p.candidate_id=c.id AND p.entity_id=c.entity_id WHERE p.entity_id=$1 AND c.status='approved'`,[entityId]);
 return row?candidateItem(row):null;
}
