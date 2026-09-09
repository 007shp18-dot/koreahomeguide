import 'server-only';
import { createHash } from 'node:crypto';
import { parseEvidence, type EvidenceInput } from './contract';
import type { SqlPort } from './repository.server';

export type ExistingEvidence = { id: string; version: number; status: string; data: EvidenceInput };
export type Corroboration = { sourceId: string; area: string; building: string; amount: number; sizeSqm: number | null; observedOn?: string; month?: string; address?: string; housingType?: string; conditions: string; reference: string };
export type BackfillCorrection = { id: string; version: number; before: EvidenceInput; after: EvidenceInput; reference: string; fingerprint: string };
const normalize = (value: string) => value.trim().normalize('NFKC').toUpperCase().replace(/\s+/gu, ' ');
const key = (row: Pick<Corroboration, 'sourceId' | 'area' | 'building' | 'amount' | 'sizeSqm'>) => JSON.stringify([row.sourceId, normalize(row.area), normalize(row.building), row.amount, row.sizeSqm]);
function fingerprint(input: EvidenceInput) {
  const { expiresOn: _expiresOn, tier: _tier, ...identity } = input;
  void _expiresOn; void _tier;
  return createHash('sha256').update(JSON.stringify(identity, Object.keys(identity).sort())).digest('hex');
}
export function planEvidenceBackfill(existing: ExistingEvidence[], candidates: Corroboration[]) {
  const index = new Map<string, Corroboration[]>();
  for (const candidate of candidates) {
    const id = key(candidate); const group = index.get(id) ?? []; group.push(candidate); index.set(id, group);
  }
  const corrections: BackfillCorrection[] = [];
  const unresolved: { id: string; reason: string; matches: number }[] = [];
  let unchanged = 0;
  for (const row of existing) {
    if (row.status === 'withdrawn' || row.status === 'rejected') { unresolved.push({ id: row.id, reason: 'excluded-status', matches: 0 }); continue; }
    const matches = (index.get(key(row.data)) ?? []).filter((match) => !match.observedOn || match.observedOn === row.data.observedOn);
    if (matches.length !== 1) { unresolved.push({ id: row.id, reason: matches.length ? 'ambiguous-source-record' : 'source-record-unmatched', matches: matches.length }); continue; }
    const match = matches[0]!;
    const after: EvidenceInput = { ...row.data, basis: 'registered' as EvidenceInput['basis'],
      ...(match.address ? { address: match.address } : {}), ...(match.housingType ? { housingType: match.housingType } : {}),
      conditions: match.conditions,
      ...(row.data.metric === 'rent' ? { billingPeriod: 'monthly' as const } : {}),
      // The month is recorded explicitly; do not invent a transaction day from the legacy collection date.
      ...(match.month ? { observedOn: `${match.month}-01`, observedPeriod: match.month, observedPrecision: 'month' as const } : {}),
    };
    if (!parseEvidence(after)) { unresolved.push({ id: row.id, reason: 'invalid-corroborated-fields', matches: 1 }); continue; }
    if (JSON.stringify(after) === JSON.stringify(row.data)) { unchanged++; continue; }
    corrections.push({ id: row.id, version: row.version, before: row.data, after, reference: match.reference, fingerprint: fingerprint(after) });
  }
  return { examined: existing.length, corrections, unresolved, unchanged };
}

export const APPLY_BACKFILL_SQL = `WITH input AS (
 SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(id uuid, version integer, before jsonb, after jsonb, reference text, fingerprint text)
), locked AS MATERIALIZED (
 SELECT e.*, i.after, i.reference, i.fingerprint AS next_fingerprint FROM property_pool_evidence e JOIN input i ON i.id=e.id
 WHERE e.version=i.version AND e.data=i.before AND e.status NOT IN ('withdrawn','rejected')
 ORDER BY e.id FOR UPDATE OF e
), changed AS (
 UPDATE property_pool_evidence e SET data=l.after, fingerprint=l.next_fingerprint, status='pending',version=e.version+1,updated_at=now()
 FROM locked l WHERE e.id=l.id AND (SELECT count(*) FROM locked)=(SELECT count(*) FROM input)
 RETURNING e.*
), recorded AS (
 INSERT INTO property_pool_events(entity,entity_id,action,actor,reason,snapshot)
 SELECT 'evidence',c.id,'corrected',$2,'Official source corroboration; review remains pending',
 jsonb_build_object('before',to_jsonb(l)-'after'-'reference'-'next_fingerprint','after',to_jsonb(c),'sourceReference',l.reference)
 FROM changed c JOIN locked l ON l.id=c.id RETURNING entity_id
) SELECT count(*)::int AS changed FROM recorded`;
export async function applyEvidenceBackfill(sql: SqlPort, corrections: BackfillCorrection[], actor: string) {
  let changed = 0;
  for (let offset = 0; offset < corrections.length; offset += 100) {
    const chunk = corrections.slice(offset, offset + 100);
    const result = await sql.query(APPLY_BACKFILL_SQL, [JSON.stringify(chunk), actor]);
    if (Number(result[0]?.changed) !== chunk.length) throw new Error(`backfill-conflict: committed ${changed}; current chunk unchanged`);
    changed += chunk.length;
  }
  return changed;
}
