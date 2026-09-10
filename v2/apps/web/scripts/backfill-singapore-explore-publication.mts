/** Run from v2 with --experimental-loader ./scripts/typescript-extension-loader.mjs.
 * DATABASE_URL required. Dry run by default; --apply writes the derived summary.
 * Apply migration 0027 first. Evidence and the active pointer are never changed.
 */
import { gunzipSync } from 'node:zlib';
import { neon } from '@neondatabase/serverless';
import { parseSingaporePublication } from '../lib/singapore/publication.server.ts';
import { buildSingaporeExplorePublication } from '../lib/singapore/explore-publication-build.server.ts';
const sql = neon(process.env.DATABASE_URL!, { fetchOptions: { get signal() { return AbortSignal.timeout(60_000); } } });
const [row] = await sql.query(`SELECT r.id,r.sha256,r.payload_gzip_base64 FROM singapore_publication_active a JOIN singapore_publication_releases r ON r.id=a.release_id WHERE a.singleton=true
 AND (SELECT count(*)=2 AND bool_and(can_display AND can_create_derived AND can_use_commercially) FROM rights_policies WHERE id IN ('sg-ura-private-sale-v1','sg-ura-private-rent-v1'))`);
if (!row) throw new Error('No approved active publication');
const serialized = gunzipSync(Buffer.from(String(row.payload_gzip_base64), 'base64'), {maxOutputLength:150_000_000}).toString('utf8');
const publication = parseSingaporePublication(serialized, String(row.sha256));
const explore = await buildSingaporeExplorePublication(String(row.id), publication.snapshot);
const apply = process.argv.includes('--apply');
if (apply) {
 const updated = await sql.query(`UPDATE singapore_publication_releases SET explore_json=$1,explore_sha256=$2 WHERE id=$3 AND sha256=$4
 AND EXISTS(SELECT 1 FROM singapore_publication_active WHERE release_id=$3)
 AND (SELECT count(*)=2 AND bool_and(can_display AND can_create_derived AND can_use_commercially) FROM rights_policies WHERE id IN ('sg-ura-private-sale-v1','sg-ura-private-rent-v1')) RETURNING id`, [explore.serialized,explore.digest,row.id,row.sha256]);
 if (updated.length !== 1) throw new Error('Publication changed or rights revoked during backfill');
}
console.log(JSON.stringify({id:row.id,saleCount:publication.snapshot.records.length,exploreBytes:Buffer.byteLength(explore.serialized),digest:explore.digest,applied:apply}));
