import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import type { SqlPort } from '../evidence-pool/repository.server';
import { parseEvidence } from '../evidence-pool/contract';
import { COLLECTION_SOURCES } from './registry';
import { extractAmktcTariffs } from './amktc-tariffs';
export async function importAmktcDrafts(sql: SqlPort,snapshotId: string,actor: string) {
 const snapshot=(await sql.query(`SELECT * FROM data_collection_snapshots WHERE id=$1::uuid AND source_id='sg-amktc-cost' AND status='reviewed'`,[snapshotId]))[0];
 if(!snapshot) throw new Error('reviewed_amktc_snapshot_required');
 const source=COLLECTION_SOURCES.find((s)=>s.id==='sg-amktc-cost')!;
 if(snapshot.source_url!==source.url) throw new Error('source_url_mismatch');
 const tariffs=extractAmktcTariffs(String(snapshot.content));
 const sourceRows=await sql.query(`WITH inserted AS (INSERT INTO property_pool_sources(id,name,url,kind) VALUES($1::uuid,$2,$3,'official') ON CONFLICT(url) DO NOTHING RETURNING *), audited AS (INSERT INTO property_pool_events(entity,entity_id,action,actor,reason,snapshot) SELECT 'source',id,'created',$4,'Reviewed source snapshot import',to_jsonb(inserted) FROM inserted RETURNING entity_id) SELECT id,status FROM inserted UNION ALL SELECT id,status FROM property_pool_sources WHERE url=$3`,[randomUUID(),source.name,source.url,actor]);
 const poolSource=sourceRows[0];if(!poolSource || ['withdrawn','rejected'].includes(String(poolSource.status))) throw new Error('source_not_eligible');
 const fetchedAt=new Date(snapshot.fetched_at as string | Date);const expires=new Date(fetchedAt.getTime()+30*86400_000).toISOString().slice(0,10);
 const entries=tariffs.map((tariff)=>{
  const conditions=`Effective 2024-07-01; ${tariff.rateType} tariff; AMK council coverage and ${tariff.rateType==='normal'?'normal-rate criteria':'subsidy eligibility'} require address verification. Ordinary ${tariff.rooms}-room HDB only; excludes Design/DBSS. Tax inclusion unconfirmed.`;
  const input=parseEvidence({sourceId:String(poolSource.id),market:'singapore',tier:'supporting',metric:'service_charge',basis:'published',amount:tariff.amount,currency:'SGD',unit:'monthly',area:tariff.authority,building:'',sizeSqm:null,observedOn:fetchedAt.toISOString().slice(0,10),expiresOn:expires,url:source.url,housingType:`HDB ${tariff.rooms}-room standard flat`,conditions,billingPeriod:'monthly'});
  if(!input) throw new Error('tariff_evidence_schema_mismatch');
  const {expiresOn:_expiresOn,tier:_tier,...identity}=input;void _expiresOn;void _tier;
  return {id:randomUUID(),provider_key:`amktc:standard:${tariff.rooms}:${tariff.rateType}`,data:input,fingerprint:createHash('sha256').update(JSON.stringify(identity,Object.keys(identity).sort())).digest('hex')};
 });
 const rows=await sql.query(`WITH incoming AS MATERIALIZED (
 SELECT coalesce(link.evidence_id,existing.id,(e->>'id')::uuid) AS id,e->>'provider_key' AS provider_key,e->'data' AS data,e->>'fingerprint' AS fingerprint
 FROM jsonb_array_elements($1::jsonb) e LEFT JOIN data_collection_tariff_links link ON link.provider_key=e->>'provider_key'
 LEFT JOIN property_pool_evidence existing ON existing.fingerprint=e->>'fingerprint'
 ), inserted AS (INSERT INTO property_pool_evidence(id,source_id,data,fingerprint)
 SELECT i.id,$2::uuid,i.data,i.fingerprint FROM incoming i WHERE NOT EXISTS(SELECT 1 FROM property_pool_evidence p WHERE p.id=i.id)
 ON CONFLICT(fingerprint) DO NOTHING RETURNING *), corrected AS (
 UPDATE property_pool_evidence p SET data=i.data,fingerprint=i.fingerprint,status='pending',version=p.version+1,updated_at=now()
 FROM incoming i WHERE p.id=i.id AND p.source_id=$2::uuid AND p.status<>'withdrawn' AND p.fingerprint<>i.fingerprint RETURNING p.*
 ), audited AS (INSERT INTO property_pool_events(entity,entity_id,action,actor,reason,snapshot)
 SELECT 'evidence',id,'created',$3,$4,to_jsonb(inserted) FROM inserted UNION ALL
 SELECT 'evidence',id,'corrected',$3,$4,to_jsonb(corrected) FROM corrected RETURNING entity_id
 ), linked AS (INSERT INTO data_collection_tariff_links(provider_key,evidence_id,snapshot_id)
 SELECT i.provider_key,i.id,$5::uuid FROM incoming i WHERE EXISTS(SELECT 1 FROM inserted n WHERE n.id=i.id) OR EXISTS(SELECT 1 FROM property_pool_evidence p WHERE p.id=i.id AND p.source_id=$2::uuid)
 ON CONFLICT(provider_key) DO UPDATE SET snapshot_id=excluded.snapshot_id,updated_at=now() RETURNING provider_key)
 SELECT (SELECT count(*)::int FROM inserted) AS inserted,(SELECT count(*)::int FROM corrected) AS updated,(SELECT count(*)::int FROM linked) AS linked`,[JSON.stringify(entries),poolSource.id,actor,`AMK tariff draft from reviewed snapshot ${snapshotId}`,snapshotId]);
 return {parsed:entries.length,inserted:Number(rows[0]?.inserted??0),updated:Number(rows[0]?.updated??0),status:'pending',sourceId:String(poolSource.id),limitation:'Authority-level tariff only. A building/address and eligibility must be verified before approval or use.'};
}
