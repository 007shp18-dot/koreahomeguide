import 'server-only';
import { publicContentDatabase } from '../db/postgres.server';
import { classified } from './query.server';
import type { Evidence, EvidenceInput } from './contract';
import { scenarioCostOptions, type ScenarioCostOption } from './costs';
import type { PropertyScenarioContext } from '../tools/property-scenario-context';

export async function loadScenarioCosts(context: PropertyScenarioContext): Promise<{state: 'ready' | 'unavailable'; options: ScenarioCostOption[]}> {
  if (!context.propertyName || !context.housing) return {state: 'ready', options: []};
  const sql = publicContentDatabase();
  if (!sql) return {state: 'unavailable', options: []};
  try {
    const rows = await sql.query(`${classified} SELECT e.*, s.name AS source_name, s.status AS source_status, s.kind AS source_kind
      FROM classified e JOIN property_pool_sources s ON s.id=e.source_id
      WHERE e.status='approved' AND s.status='approved' AND e.quality='qualified'
        AND e.data->>'market'=$1 AND lower(trim(e.data->>'building'))=lower(trim($2))
        AND e.data->>'metric' IN ('service_charge','repair_cost')
      ORDER BY e.data->>'observedOn' DESC, e.id LIMIT 100`,
    [{ 'kr-seoul':'seoul', 'sg-singapore':'singapore', 'ae-dubai':'dubai' }[context.market], context.propertyName]);
    const evidence: Evidence[] = rows.map(row => ({...row.data as EvidenceInput, id: String(row.id), status: row.status as Evidence['status'],
      version: Number(row.version), createdAt: String(row.created_at), sourceName: String(row.source_name),
      sourceStatus: row.source_status as Evidence['sourceStatus'], sourceKind: row.source_kind as Evidence['sourceKind'], duplicate: Boolean(row.duplicate)}));
    return {state: 'ready', options: scenarioCostOptions(evidence, context, new Date().toISOString().slice(0,10))};
  } catch {
    console.warn('[scenario-costs] approved evidence unavailable');
    return {state: 'unavailable', options: []};
  }
}
