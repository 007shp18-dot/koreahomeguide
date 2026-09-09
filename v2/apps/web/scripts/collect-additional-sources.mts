/** Run with the workspace TS loader and --conditions=react-server. Default is fetch-only.
 * --apply persists pending source snapshots in the explicitly configured DATABASE_URL.
 * Never publishes numerical evidence or changes source approval.
 */
import { neon } from '@neondatabase/serverless';
import { COLLECTION_SOURCES } from '../lib/data-operations/registry.ts';
import { fetchSource, collectionFailureCode } from '../lib/data-operations/fetch.server.ts';
import { createCollectionRepository } from '../lib/data-operations/repository.server.ts';
const apply = process.argv.includes('--apply');
const sourceId = process.argv.find((arg) => arg.startsWith('--source='))?.slice('--source='.length);
if (sourceId && !COLLECTION_SOURCES.some((s) => s.id === sourceId)) throw new Error('Unknown source');
if (apply && !process.env.DATABASE_URL) throw new Error('DATABASE_URL required for --apply');
const db = apply ? neon(process.env.DATABASE_URL!, {fetchOptions: {get signal(){return AbortSignal.timeout(20000);}}}) : null;
const repository = db ? createCollectionRepository({ query: (statement, parameters) => db.query(statement, parameters) }) : null;
for (const source of COLLECTION_SOURCES.filter((s) => !sourceId || s.id === sourceId)) {
 if (source.mode !== 'page-monitor') { console.log(JSON.stringify({ sourceId: source.id, status: 'blocked', reason: source.limitation })); continue; }
 if (repository) { try{console.log(JSON.stringify(await repository.collect(source,true)));}catch(error){console.log(JSON.stringify({sourceId:source.id,status:'failed',error:collectionFailureCode(error)}));process.exitCode=1;} continue; }
 try { const result = await fetchSource(source); console.log(JSON.stringify({ sourceId:source.id,status:'fetched_not_stored',bytes:result.bytes,hash:result.hash })); }
 catch (error) { console.log(JSON.stringify({ sourceId:source.id,status:'failed',error:collectionFailureCode(error) })); }
}
