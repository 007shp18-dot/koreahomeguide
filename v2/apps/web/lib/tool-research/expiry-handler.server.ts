import 'server-only';

import type { ToolResearchRepository } from './repository.server';

type ExpiryEnvironment = Readonly<{
  repository: ToolResearchRepository | null;
  secret: string;
  now?: () => Date;
  aggregate?: (now: Date) => Promise<void>;
}>;

function json(body: Readonly<Record<string, unknown>>, status: number): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function createToolResearchExpiryHandler(environment: ExpiryEnvironment) {
  return async function expireToolResearch(request: Request): Promise<Response> {
    if (environment.secret.length === 0
      || request.headers.get('authorization') !== `Bearer ${environment.secret}`) {
      return json({ error: 'unauthorized' }, 401);
    }
    if (environment.repository === null) return json({ error: 'storage_not_configured' }, 503);
    try {
      const now = (environment.now ?? (() => new Date()))();
      const deletedCount = await environment.repository.expire(now);
      await environment.aggregate?.(now);
      return json({ state: 'expired', deletedCount }, 200);
    } catch {
      return json({ error: 'storage_unavailable' }, 503);
    }
  };
}
