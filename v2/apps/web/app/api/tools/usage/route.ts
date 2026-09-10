import { publicContentDatabase } from '../../../../lib/db/postgres.server';
import { createToolUsageHandler } from '../../../../lib/tool-research/aggregate-route.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = createToolUsageHandler(async (tool, market) => {
  if (process.env.SIGNEDPRICE_TOOL_RESEARCH_ENABLED?.trim().toLowerCase() === 'false') return;
  const sql = publicContentDatabase();
  if (!sql) throw new Error('Usage counters unavailable');
  await sql.query(`INSERT INTO tool_usage_daily (day, tool, market, completions)
    VALUES ((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date, $1, $2, 1)
    ON CONFLICT (day, tool, market) DO UPDATE
    SET completions = LEAST(tool_usage_daily.completions + 1, 10000000)`, [tool, market]);
});
