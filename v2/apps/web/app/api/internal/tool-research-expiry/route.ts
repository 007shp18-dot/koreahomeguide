import { createToolResearchExpiryHandler } from '../../../../lib/tool-research/expiry-handler.server';
import { toolResearchRepositoryFromEnvironment } from '../../../../lib/tool-research/environment.server';
import { contentDatabase } from '../../../../lib/db/postgres.server';
import { aggregateToolResearch } from '../../../../lib/tool-research/maintenance.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const handler = createToolResearchExpiryHandler({
    repository: toolResearchRepositoryFromEnvironment(),
    secret: process.env.CRON_SECRET?.trim() ?? '',
    aggregate: async now => {
      const database = contentDatabase();
      if (!database) throw new Error('storage_not_configured');
      await aggregateToolResearch({ query: (statement, params = []) => database.query(statement, [...params]) }, now);
    },
  });
  return handler(request);
}
