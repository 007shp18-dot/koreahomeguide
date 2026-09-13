import { readFileSync, writeFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { propertyReviewSchema } from '../lib/research/property-review.ts';

const reviews = ['seoul','singapore','dubai','tokyo'].flatMap(city => JSON.parse(readFileSync(new URL(`../content/property-reviews/${city}.json`,import.meta.url),'utf8'))).map(value => propertyReviewSchema.parse(value));
if (reviews.length !== 12 || new Set(reviews.map(r=>r.id)).size !== 12) throw new Error('Expected 12 distinct reviewed properties');
if (process.argv.includes('--validate-only')) {
  console.log(JSON.stringify({valid:reviews.length,points:reviews.reduce((n,r)=>n+r.strengths.length+r.tradeoffs.length+Object.values(r.sections).flat().length,0)}));
} else {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const sql = neon(process.env.DATABASE_URL);
  const ids=reviews.map(r=>r.id);
  const rows=await sql`SELECT DISTINCT ON (business_key) id,business_key,raw_metadata FROM source_records WHERE business_key=ANY(${ids}::text[]) AND dataset_id IN ('kr-seoul-property-context-20260913','sg-singapore-property-context-20260913','ae-dubai-property-context-20260913','jp-tokyo-property-context-20260913') AND raw_metadata->'profile'->>'publication_status'='published' ORDER BY business_key,observed_at DESC,id DESC`;
  if(rows.length!==12)throw new Error('Expected 12 existing published records');
  if(!process.argv.includes('--verify-only')) {
    const backupArg=process.argv.find(a=>a.startsWith('--backup='));
    if(!backupArg)throw new Error('A local --backup= path is required before publication');
    writeFileSync(backupArg.slice(9),JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
    await sql.transaction(rows.map(row=>{
      const review=reviews.find(r=>r.id===row.business_key);
      if(row.raw_metadata.profile.id!==review.id||row.raw_metadata.profile.market_id!==review.marketId)throw new Error('Identity mismatch');
      return sql`UPDATE source_records SET raw_metadata=jsonb_set(raw_metadata,'{profile,review}',${JSON.stringify(review)}::jsonb,true) WHERE id=${row.id} AND raw_metadata->'profile'->>'publication_status'='published' RETURNING business_key`;
    }));
  }
  const saved=await sql`SELECT DISTINCT ON (business_key) business_key,raw_metadata->'profile'->'review' AS review FROM source_records WHERE business_key=ANY(${ids}::text[]) AND dataset_id IN ('kr-seoul-property-context-20260913','sg-singapore-property-context-20260913','ae-dubai-property-context-20260913','jp-tokyo-property-context-20260913') AND raw_metadata->'profile'->>'publication_status'='published' ORDER BY business_key,observed_at DESC,id DESC`;
  for(const row of saved){const actual=propertyReviewSchema.parse(row.review);const expected=reviews.find(r=>r.id===row.business_key);if(JSON.stringify(actual)!==JSON.stringify(expected))throw new Error(`Stored review differs: ${row.business_key}`);}
  console.log(JSON.stringify({verified:saved.length,markets:Object.fromEntries(['kr-seoul','sg-singapore','ae-dubai','jp-tokyo'].map(id=>[id,reviews.filter(r=>r.marketId===id).length]))}));
}
