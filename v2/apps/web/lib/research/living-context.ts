import { z } from 'zod';

const source = z.object({ title: z.string(), url: z.url().refine(url => url.startsWith('https://')), scope: z.string(), checked_on: z.string() });
const profile = z.object({
  id: z.string(), market_id: z.enum(['kr-seoul', 'sg-singapore', 'ae-dubai', 'jp-tokyo']),
  name_ko: z.string(), canonical_name: z.string(), area: z.string(), headline: z.string(),
  checked_on: z.string(), identity_note: z.string(), publication_status: z.literal('published'),
  linked_entity_ids: z.array(z.string()),
  facts: z.array(z.object({ id: z.string(), text: z.string(), status: z.enum(['planned', 'historical_design', 'source_reported']), source_ids: z.array(z.string()).min(1) })),
  analysis: z.array(z.object({ dimension: z.string(), interpretation: z.string(), basis_fact_ids: z.array(z.string()) })),
  field_checks: z.array(z.string()),
});
const metadataSchema = z.object({ schema_version: z.literal('property-context-v1'), profile, sources: z.record(z.string(), source) });
export type LivingContext = z.infer<typeof profile> & { sources: Record<string, z.infer<typeof source>> };
export function projectLivingContext(value: unknown): LivingContext | null {
  const parsed = metadataSchema.safeParse(value);
  if (!parsed.success) return null;
  const { profile: p, sources } = parsed.data;
  if (p.facts.some(f => f.source_ids.some(id => !sources[id])) || p.analysis.some(a => a.basis_fact_ids.some(id => !p.facts.some(f => f.id === id)))) return null;
  return { ...p, sources };
}
export function selectLivingContexts(rows: readonly LivingContext[], entity?: string | null) {
  return entity ? rows.filter(row => row.linked_entity_ids.includes(entity)) : rows;
}
