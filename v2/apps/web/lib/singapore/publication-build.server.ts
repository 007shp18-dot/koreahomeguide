import 'server-only';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { neon } from '@neondatabase/serverless';
import { buildSingaporeSnapshot, buildSingaporeProjectId, buildUraPrivateSaleCheckArtifact, parseSingaporeSnapshot, type UraPrivateSaleTransaction } from '@signedprice/singapore-property';
import { createInstalledSnapshotRepository, resolveInstalledSnapshotRegistry, resolveInstalledSnapshotObject } from '../snapshots/installed-snapshot-repository.server';
import { parseSingaporePublication } from './publication.server';

export async function publishSingaporeObservations({ apply = false, verifyFull = false, onProgress, budgetMs = 210_000 }: { apply?: boolean; verifyFull?: boolean; onProgress?: (progress: {stage:string; count?:number; elapsedMs:number}) => void; budgetMs?:number } = {}) {
if (apply && verifyFull) throw new Error('Full verification is dry-run only');
const startedAt = Date.now();
const deadline = AbortSignal.timeout(budgetMs);
const progress = (stage: string, count?: number) => { deadline.throwIfAborted(); onProgress?.({stage,count,elapsedMs:Date.now()-startedAt}); };
progress('start');
const sql = neon(process.env.DATABASE_URL!, { fetchOptions: { get signal() { return AbortSignal.any([deadline, AbortSignal.timeout(25_000)]); } } });
const WATERMARK = `SELECT md5(concat(count(*),'|',max(o.updated_at)::text,'|',max(o.source_record_id)::text,'|',(SELECT string_agg(concat(r.id,':',r.updated_at::text,':',r.can_display,':',r.can_create_derived,':',r.can_use_commercially),'|' ORDER BY r.id) FROM rights_policies r WHERE r.id IN ('sg-ura-private-sale-v1','sg-ura-private-rent-v1')))) AS value
 FROM observations o JOIN source_records s ON s.id=o.source_record_id
 WHERE s.dataset_id IN ('sg-private-sale','sg-private-rent')`;
const [initial] = await sql.query(`SELECT w.value,
 (SELECT count(*)::integer FROM market_data_refresh_runs WHERE job IN ('sg-private-sale','sg-private-rent') AND state='running') AS running,
 (SELECT jsonb_build_object('id',r.id,'source_as_of',r.source_as_of,'released_at',r.released_at,'sale_count',r.sale_count,'rent_count',r.rent_count) FROM singapore_publication_active a JOIN singapore_publication_releases r ON r.id=a.release_id) - 'payload_gzip_base64' AS active
 FROM (${WATERMARK}) w`);
if (Number(initial?.running ?? 0)) throw new Error('Publication withheld while collection is running');
const watermark = initial;
const publicationId = `sg-publication:${createHash('sha256').update(`${watermark?.value}:${new Date().toISOString().slice(0,7)}`).digest('hex')}`;
const active = initial?.active as Record<string, unknown> | null;
const existing = active?.id === publicationId ? active : null;
if (existing && !verifyFull) return {id:existing.id, sourceAsOf:existing.source_as_of, releasedAt:existing.released_at, saleCount:existing.sale_count, rentalRecordCount:existing.rent_count, applied:apply, unchanged:true};
const installed = createInstalledSnapshotRepository({ registrySource: resolveInstalledSnapshotRegistry(), resolveObject: resolveInstalledSnapshotObject }).get('sg-singapore', 'sg-private-sale');
const previous = parseSingaporeSnapshot(installed.payload);
const locations = new Map(previous.records.filter(row => row.x !== null && row.y !== null).map(row => [`sg-singapore:project:${row.projectId}`, row]));
const legacy = new Map(previous.records.map(row => [`${row.sourceOrder.batch}:${row.sourceOrder.project}:${row.sourceOrder.transaction}`, row]));
// Keyset pages avoid the Neon response ceiling; a before/after watermark rejects concurrent changes.
const rows: Record<string, unknown>[] = [];
let cursor = '0';
for (;;) {
 const page = await sql.query(`SELECT o.id,o.subject_entity_id,o.amount_minor,o.observed_at,o.currency_code,o.local_schema_version,o.local_attributes,o.property_area_sqm,o.floor_range,o.stage,o.area_basis,o.tenure_kind, s.business_key, s.raw_metadata, s.observed_at AS source_as_of,
 e.canonical_name, e.local_attributes AS entity_attributes FROM observations o
 JOIN source_records s ON s.id=o.source_record_id JOIN property_entities e ON e.id=o.subject_entity_id
 JOIN datasets d ON d.id=s.dataset_id JOIN rights_policies r ON r.id=d.rights_policy_id
 WHERE o.market_id='sg-singapore' AND o.kind='sale' AND o.status IN ('active','corrected')
 AND s.dataset_id='sg-private-sale' AND r.can_display AND r.can_create_derived AND r.can_use_commercially
 AND o.id > $1::bigint ORDER BY o.id LIMIT 25000`, [cursor]);
 rows.push(...page); progress('sale_rows', rows.length); if (page.length < 25000) break; cursor = String(page.at(-1)!.id);
}
if (rows.length < previous.records.length * 0.8) throw new Error('Publication withheld: sale volume fell over 20%');
progress('sale_read_complete', rows.length);
const records: UraPrivateSaleTransaction[] = rows.map(row => {
  const old = legacy.get(String(row.business_key));
  if (old && old.priceSgd * 100 === Number(row.amount_minor) && old.contractMonth === new Date(String(row.observed_at)).toISOString().slice(0,10) && old.projectId === String(row.subject_entity_id).replace('sg-singapore:project:', '')) {
    const { projectId, psf, ...record } = old; void projectId; void psf; return record;
  }
  const metadata = row.raw_metadata as Record<string, unknown>;
  const entity = row.entity_attributes as Record<string, unknown>;
  const attr = row.local_schema_version === 'sg-private-sale@1' ? metadata : row.local_attributes as Record<string, unknown>;
  const positional = /^(\d+):(\d+):(\d+)$/.exec(String(row.business_key));
  const sourceOrder = metadata.sourceOrder ?? (positional ? {batch:Number(positional[1]),project:Number(positional[2]),transaction:Number(positional[3])} : null);
  if (row.currency_code !== 'SGD' || !['sg-private-sale-live@1','sg-private-sale@1'].includes(String(row.local_schema_version)) || !sourceOrder || !entity.street || !entity.marketSegment || !metadata.propertyType || !attr.units) throw new Error('Incomplete normalized sale evidence');
  const location = locations.get(String(row.subject_entity_id));
  const record = { project: String(row.canonical_name), street: String(entity.street), x: location?.x ?? null, y: location?.y ?? null,
    marketSegment: entity.marketSegment, areaSqm: Number(row.property_area_sqm), floorRange: row.floor_range,
    units: Number(attr.units), contractDate: metadata.contractDate, contractMonth: new Date(String(row.observed_at)).toISOString().slice(0,10),
    saleType: row.stage, priceSgd: Number(row.amount_minor)/100, netPriceSgd: attr.netPriceSgd ?? null,
    propertyType: metadata.propertyType, district: metadata.district ?? entity.district, areaBasis: row.area_basis,
    tenure: row.tenure_kind, sourceOrder } as UraPrivateSaleTransaction;
  if (`sg-singapore:project:${buildSingaporeProjectId(record)}` !== row.subject_entity_id) throw new Error('Publication entity identity mismatch');
  return record;
});
const releasedAt = new Date().toISOString();
const snapshot = parseSingaporeSnapshot(buildSingaporeSnapshot({ records, generatedAt: releasedAt }));
progress('sale_artifact_verified', snapshot.records.length);
const rentalRows = await sql.query(`SELECT o.subject_entity_id AS "projectId", e.canonical_name AS project,
 to_char(o.observed_at,'YYYY-MM') AS month, o.local_attributes->>'areaRange' AS "areaRange", o.bedrooms, s.raw_metadata->>'propertyType' AS "propertyType",
 count(*)::integer AS n, percentile_cont(0.5) WITHIN GROUP (ORDER BY o.recurring_amount_minor / 100.0) AS "medianMonthlySgd"
 FROM observations o JOIN source_records s ON s.id=o.source_record_id JOIN property_entities e ON e.id=o.subject_entity_id
 JOIN datasets d ON d.id=s.dataset_id JOIN rights_policies r ON r.id=d.rights_policy_id
 WHERE s.dataset_id='sg-private-rent' AND o.status IN ('active','corrected') AND o.kind='rent' AND o.currency_code='SGD'
 AND o.frequency='monthly' AND o.property_area_sqm IS NULL AND o.area_basis='ura-reported-range'
 AND r.can_display AND r.can_create_derived AND r.can_use_commercially
 GROUP BY o.subject_entity_id,e.canonical_name,o.observed_at,o.local_attributes->>'areaRange',o.bedrooms,s.raw_metadata->>'propertyType' HAVING count(*)>=5`);
const [rentCount] = await sql.query(`SELECT count(*)::integer AS n, max(s.observed_at) AS source_as_of FROM observations o JOIN source_records s ON s.id=o.source_record_id WHERE s.dataset_id='sg-private-rent' AND o.status IN ('active','corrected')`);
const sourceAsOf = [...rows, {source_as_of: rentCount?.source_as_of}].map(row => row.source_as_of == null ? previous.generatedAt : new Date(String(row.source_as_of)).toISOString()).sort().at(-1)!;
const bundle = { version: 'signedprice-sg-publication-v1', sourceAsOf, releasedAt, snapshot, check: buildUraPrivateSaleCheckArtifact(snapshot), rentals: rentalRows.map(row => ({...row, bedrooms: row.bedrooms === null ? null : Number(row.bedrooms), medianMonthlySgd: Number(row.medianMonthlySgd)})), rentalRecordCount: Number(rentCount?.n ?? 0) };
progress('rental_groups_built', rentalRows.length);
const serialized = JSON.stringify(bundle);
const digest = createHash('sha256').update(serialized).digest('hex');
parseSingaporePublication(serialized, digest);
progress('bundle_verified');
if (!apply) {
 const [after] = await sql.query(WATERMARK);
 if (after?.value !== watermark?.value) throw new Error('Publication withheld: observations changed during build');
}
const id = publicationId;
const summary = { elapsedMs: Date.now() - startedAt, id, sourceAsOf, releasedAt, saleCount: records.length, rentalRecordCount: bundle.rentalRecordCount, rentalGroups: rentalRows.length, applied: apply };
progress('ready_to_activate');
if (apply) await sql.transaction([
 sql.query(`SELECT 1 / CASE WHEN (SELECT value FROM (${WATERMARK}) state) = $1
 AND NOT EXISTS (SELECT 1 FROM market_data_refresh_runs WHERE job IN ('sg-private-sale','sg-private-rent') AND state='running') THEN 1 ELSE 0 END AS consistent`, [watermark?.value]),
 sql.query(`INSERT INTO singapore_publication_releases(id,source_as_of,released_at,sale_count,rent_count,payload_gzip_base64,sha256) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING`, [id,sourceAsOf,releasedAt,records.length,bundle.rentalRecordCount,gzipSync(serialized).toString('base64'),digest]),
 sql.query(`INSERT INTO singapore_publication_active(singleton,release_id) VALUES(true,$1) ON CONFLICT(singleton) DO UPDATE SET release_id=excluded.release_id`, [id]),
], { isolationLevel: 'Serializable' });
progress('complete');
return summary;
}
