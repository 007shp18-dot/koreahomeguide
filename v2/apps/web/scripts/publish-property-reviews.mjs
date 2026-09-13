import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { propertyReviewSchema } from '../lib/research/property-review.ts';
import { projectLivingContext } from '../lib/research/living-context.ts';

function canonicalJSON(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonicalJSON(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

const reviews = ['seoul','singapore','dubai','tokyo'].flatMap(city => JSON.parse(readFileSync(new URL(`../content/property-reviews/${city}.json`,import.meta.url),'utf8'))).map(value => propertyReviewSchema.parse(value));
const locations = JSON.parse(readFileSync(new URL('../content/property-reviews/locations.json', import.meta.url), 'utf8'));
if (!reviews.length || reviews.length > 100 || new Set(reviews.map(r=>r.id)).size !== reviews.length) throw new Error('Expected 1–100 distinct reviewed properties');
const prepared = reviews.map(review => {
  const location = locations.find(row => row.reviewId === review.id);
  if (!location || !location.detailPath.startsWith('/') || !Array.isArray(location.entityIds)) throw new Error(`Missing exact location: ${review.id}`);
  for (const metric of location.metrics) if (!Number.isFinite(metric.value) || metric.value < 0 || !review.sources.some(s => s.id === metric.sourceId)) throw new Error(`Unresolved visual metric: ${review.id} / ${metric.sourceId}`);
  for (const series of location.series ?? []) if (!review.sources.some(s=>s.id===series.sourceId) || series.points.length<2 || new Set(series.points.map(p=>p.period)).size!==series.points.length || series.points.some(p=>!/^\d{4}$/.test(p.period) || !Number.isFinite(p.value) || p.value<0)) throw new Error(`Unresolved annual series: ${review.id}`);
  const points = [...review.strengths, ...review.tradeoffs, ...Object.values(review.sections).flat()];
  const sources = Object.fromEntries(review.sources.map(s => [s.id, {title:s.title,url:s.url,scope:s.note.en,checked_on:s.checkedOn}]));
  const profile = {id:review.id,market_id:review.marketId,name_ko:review.name.ko,canonical_name:review.name.en,area:review.area.en,headline:review.verdict.ko,checked_on:review.checkedOn,identity_note:location.address,publication_status:'published',linked_entity_ids:location.entityIds,facts:[],analysis:[],field_checks:points.filter(p=>p.status==='needs-check').map(p=>p.body.ko),review};
  return {review,location,profile,sources,datasetId:`${review.marketId}-property-context-20260913`};
});
if (process.argv.includes('--validate-only')) {
  console.log(JSON.stringify({valid:reviews.length,points:reviews.reduce((n,r)=>n+r.strengths.length+r.tradeoffs.length+Object.values(r.sections).flat().length,0),photos:locations.filter(l=>l.photo).length}));
} else {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const sql = neon(process.env.DATABASE_URL);
  const ids=reviews.map(r=>r.id);
  const datasetIds=[...new Set(prepared.map(p=>p.datasetId))];
  const rights=await sql`SELECT d.id FROM datasets d JOIN rights_policies p ON p.id=d.rights_policy_id WHERE d.id=ANY(${datasetIds}::text[]) AND p.can_display=true AND p.can_use_commercially=true`;
  if(rights.length!==datasetIds.length)throw new Error('Publication rights unavailable');
  const rows=await sql`SELECT DISTINCT ON (business_key) id,business_key,dataset_id,raw_metadata FROM source_records WHERE business_key=ANY(${ids}::text[]) AND dataset_id=ANY(${datasetIds}::text[]) ORDER BY business_key,observed_at DESC NULLS LAST,id DESC`;
  if(!process.argv.includes('--verify-only')) {
    const backupArg=process.argv.find(a=>a.startsWith('--backup='));
    if(!backupArg)throw new Error('A local --backup= path is required before publication');
    writeFileSync(backupArg.slice(9),JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
    const records=prepared.map(item=>{
      const old=rows.find(row=>row.business_key===item.review.id);
      if(old && (old.dataset_id!==item.datasetId || old.raw_metadata.profile.id!==item.review.id || old.raw_metadata.profile.market_id!==item.review.marketId))throw new Error(`Identity mismatch: ${item.review.id}`);
      // Version records instead of overwriting past research; preserve prior facts.
      const metadata={...(old?.raw_metadata??{}),schema_version:'property-context-v1',profile:{...(old?.raw_metadata.profile??{}),...item.profile,facts:old?.raw_metadata.profile.facts??[],analysis:old?.raw_metadata.profile.analysis??[]},sources:{...(old?.raw_metadata.sources??{}),...item.sources},visuals:item.location,publication:{edition:'property-detail-reviews-20260913',scope:'Named residential properties; project group scope retained where applicable',sourceLinks:'Internal research provenance; external portal links omitted from the reading interface'}};
      metadata.methodology={...(metadata.methodology??{}),scope:`${reviews.length} named residential property reviews; exact buildings or explicitly scoped project groups. Land excluded.`,gaps:'Availability and verification gaps are stated per review point. Public footfall or retail sales retain the reporting asset and year; unknown values are not zero.'};
      const json=canonicalJSON(metadata);return {...item,json,hash:createHash('sha256').update(json).digest('hex')};
    });
    await sql.transaction(records.map(record=>sql`INSERT INTO source_records(dataset_id,business_key,content_hash,observed_at,raw_metadata) VALUES(${record.datasetId},${record.review.id},${record.hash},now(),${record.json}::jsonb) ON CONFLICT(dataset_id,business_key,content_hash) DO NOTHING RETURNING business_key`));
  }
  const saved=await sql`WITH latest AS (SELECT DISTINCT ON (business_key) business_key,raw_metadata FROM source_records WHERE business_key=ANY(${ids}::text[]) AND dataset_id=ANY(${datasetIds}::text[]) ORDER BY business_key,observed_at DESC NULLS LAST,id DESC) SELECT business_key,raw_metadata FROM latest WHERE raw_metadata->'profile'->>'publication_status'='published'`;
  if(saved.length!==reviews.length)throw new Error('Missing published records');
  for(const row of saved){const profile=projectLivingContext(row.raw_metadata);const expected=prepared.find(r=>r.review.id===row.business_key);if(!profile || JSON.stringify(profile.review)!==JSON.stringify(expected.review)||JSON.stringify(profile.linked_entity_ids)!==JSON.stringify(expected.location.entityIds)||canonicalJSON(row.raw_metadata.visuals)!==canonicalJSON(expected.location))throw new Error(`Stored review differs or fails publication projection: ${row.business_key}`);}

  console.log(JSON.stringify({verified:saved.length,markets:Object.fromEntries(['kr-seoul','sg-singapore','ae-dubai','jp-tokyo'].map(id=>[id,reviews.filter(r=>r.marketId===id).length]))}));
}
