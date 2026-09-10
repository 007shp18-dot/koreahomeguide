import 'server-only';
import { createToolResearchRepository, type ToolResearchSqlPort } from './repository.server';

export async function aggregateToolResearch(sql: ToolResearchSqlPort, now: Date): Promise<void> {
  // Evaluate the daily aggregate as a health check, but do not persist counts:
  // deletion or expiry must remove contributions immediately from every read.
  await createToolResearchRepository(sql).summarizeRetained({ now });
  await sql.query(`INSERT INTO tool_research_maintenance (id, last_aggregated_at)
    VALUES ('daily', $1::timestamptz)
    ON CONFLICT (id) DO UPDATE SET last_aggregated_at = greatest(tool_research_maintenance.last_aggregated_at, excluded.last_aggregated_at)`, [now.toISOString()]);
}
