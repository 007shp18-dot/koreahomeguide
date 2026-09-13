import 'server-only';
import { publicContentDatabase } from '../db/postgres.server';
import { projectLivingContext, type LivingContext } from './living-context';

export async function loadLivingContexts({ entity = null, profile = null }: { entity?: string | null; profile?: string | null } = {}): Promise<{ status: 'ready' | 'unavailable'; profiles: LivingContext[] }> {
  const db = publicContentDatabase();
  if (!db) return { status: 'unavailable', profiles: [] };
  try {
    const rows = await db`
      WITH latest AS (SELECT DISTINCT ON (s.business_key) s.business_key, s.raw_metadata
      FROM source_records s JOIN datasets d ON d.id = s.dataset_id
      JOIN rights_policies p ON p.id = d.rights_policy_id
      WHERE d.id IN ('kr-seoul-property-context-20260913', 'sg-singapore-property-context-20260913', 'ae-dubai-property-context-20260913', 'jp-tokyo-property-context-20260913')
        AND p.can_display = true AND p.can_use_commercially = true
        AND (${profile}::text IS NULL OR s.business_key = ${profile}::text)
      ORDER BY s.business_key, s.observed_at DESC NULLS LAST, s.id DESC)
      SELECT raw_metadata FROM latest
      WHERE raw_metadata->'profile'->>'publication_status' = 'published'
        AND (${entity}::text IS NULL OR raw_metadata->'profile'->'linked_entity_ids' ? ${entity}::text)
      ORDER BY business_key
      LIMIT 100`;
    return { status: 'ready', profiles: rows.map(row => projectLivingContext(row.raw_metadata)).filter((row): row is LivingContext => row !== null) };
  } catch {
    return { status: 'unavailable', profiles: [] };
  }
}
