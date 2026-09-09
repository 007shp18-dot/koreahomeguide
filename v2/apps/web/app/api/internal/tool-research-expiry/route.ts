import { createToolResearchExpiryHandler } from '../../../../lib/tool-research/expiry-handler.server';
import { toolResearchRepositoryFromEnvironment } from '../../../../lib/tool-research/environment.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const handler = createToolResearchExpiryHandler({
    repository: toolResearchRepositoryFromEnvironment(),
    secret: process.env.CRON_SECRET?.trim() ?? '',
  });
  return handler(request);
}
