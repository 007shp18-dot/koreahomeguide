import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';
import { applyEvidenceBackfill, planEvidenceBackfill, type Corroboration, type ExistingEvidence } from '../lib/evidence-pool/backfill.server.ts';

const flags = process.argv.slice(2);
if (flags.some((flag) => flag !== '--apply' && !flag.startsWith('--report='))) throw new Error('Usage: backfill-property-pool.mts [--apply] [--report=path]');
if (!process.env.DATABASE_URL) throw new Error('Explicit DATABASE_URL required');
const sql = neon(process.env.DATABASE_URL);
const port = { query: async (statement: string, parameters: unknown[] = []) => await sql.query(statement, parameters) as Record<string, unknown>[] };
const existing = await port.query('SELECT id::text,version,status,data FROM property_pool_evidence ORDER BY id') as ExistingEvidence[];
const candidates: Corroboration[] = [];
for (const [dataset, sourceId] of [['resale', 'a6090900-0002-4000-8000-000000000002'], ['rent', 'a6090900-0003-4000-8000-000000000003']] as const) {
  const path = fileURLToPath(new URL(`../data/singapore-check-hdb-${dataset}.json.gz`, import.meta.url));
  const snapshot = JSON.parse(gunzipSync(await readFile(path)).toString()) as { digest: string; records: Array<Record<string, unknown>> };
  snapshot.records.forEach((row, i) => {
    candidates.push({ sourceId, area: String(row.town), building: `${row.block} ${row.street}`, amount: Number(row.amountSgd),
      sizeSqm: dataset === 'rent' ? null : Number(row.floorAreaSqm), month: String(row.month),
      address: `${row.block} ${row.street}, Singapore`, housingType: `HDB ${row.flatType}`,
      conditions: dataset === 'rent' ? `HDB rental approval month ${row.month}; ${row.flatType}; floor area not provided by source` :
        `HDB resale registration month ${row.month}; ${row.flatType}; storey ${row.storeyRange}; remaining lease ${row.remainingLease}`,
      reference: `installed:singapore-check-hdb-${dataset}:${snapshot.digest}:${i}` });
  });
}
const seoul = await port.query(`SELECT DISTINCT e.id, e.data, o.id::text AS observation_id, s.id::text AS source_record_id,
 s.raw_metadata, p.address_text, p.canonical_name
 FROM property_pool_evidence e JOIN observations o ON o.market_id='kr-seoul' AND o.kind='sale'
 AND o.status IN ('active','corrected') AND o.amount_minor=(e.data->>'amount')::numeric
 AND o.property_area_sqm=(e.data->>'sizeSqm')::numeric
 AND to_char(o.observed_at AT TIME ZONE 'UTC','YYYY-MM-DD')=e.data->>'observedOn'
 JOIN property_entities p ON p.id=o.subject_entity_id AND p.canonical_name=e.data->>'building'
 AND p.address_text LIKE '%' || (e.data->>'area') || '%'
 JOIN source_records s ON s.id=o.source_record_id AND s.dataset_id='kr-sale'
 WHERE e.source_id='a6090900-0001-4000-8000-000000000001'`);
for (const row of seoul) {
  const data = row.data as ExistingEvidence['data']; const metadata = row.raw_metadata as Record<string, unknown>;
  candidates.push({ ...data, housingType: typeof metadata.sourceHousingType === 'string' ? metadata.sourceHousingType : undefined,
    conditions: `MOLIT registered sale; contract date ${data.observedOn}; reported floor area ${data.sizeSqm} sqm`,
    // Entity display addresses may consist only of district + name: do not call them verified street addresses.
    reference: `source_records:${row.source_record_id};observations:${row.observation_id}` });
}
const plan = planEvidenceBackfill(existing, candidates);
const report = flags.find((flag) => flag.startsWith('--report='))?.slice('--report='.length);
if (report) await writeFile(report, JSON.stringify(plan, null, 2));
console.log(JSON.stringify({ mode: flags.includes('--apply') ? 'apply' : 'dry-run', examined: plan.examined, corrections: plan.corrections.length,
  unchanged: plan.unchanged, unresolved: plan.unresolved.length,
  unresolvedReasons: plan.unresolved.reduce((counts, row) => ({ ...counts, [row.reason]: (counts[row.reason] ?? 0) + 1 }), {} as Record<string, number>),
  bySource: plan.corrections.reduce((counts, row) => ({ ...counts, [row.after.sourceId]: (counts[row.after.sourceId] ?? 0) + 1 }), {} as Record<string, number>) }));
if (flags.includes('--apply')) console.log(JSON.stringify({ changed: await applyEvidenceBackfill(port, plan.corrections, 'codex:official-evidence-backfill') }));
