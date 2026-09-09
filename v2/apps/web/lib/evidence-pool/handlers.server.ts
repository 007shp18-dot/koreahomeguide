import 'server-only';
import { adminSecret, authorized, equalSecret, issueSession, operatorId, sameOrigin, sessionCookie, strongSecret } from './auth.server';
import { isId, markets, parseCommand, statuses } from './contract';
import { errorResponse, json, readJson } from './http.server';
import type { PoolRepository } from './repository.server';

export function createPoolHandlers(repository: () => PoolRepository, secret = adminSecret) {
  return {
    async GET(request: Request) {
      if (!authorized(request, secret())) return json({ error: 'unauthorized' }, 401);
      const params = new URL(request.url).searchParams;
      try {
        if (params.has('history')) {
          const entity = params.get('entity'); const id = params.get('history');
          if ((entity !== 'source' && entity !== 'evidence') || !isId(id)) return json({ error: 'invalid_payload' }, 400);
          return json({ events: await repository().history(entity, id) });
        }
        const market = params.get('market') ?? ''; const status = params.get('status') ?? '';
        const query = params.get('q')?.trim() ?? ''; const page = Number(params.get('page') ?? '1');
        const sourcePage = Number(params.get('sourcePage') ?? '1');
        if ((market && !Object.hasOwn(markets, market)) || (status && status !== 'expired' && !Object.hasOwn(statuses, status))
          || query.length > 120 || !Number.isSafeInteger(page) || page < 1 || page > 10000
          || !Number.isSafeInteger(sourcePage) || sourcePage < 1 || sourcePage > 10000) return json({ error: 'invalid_payload' }, 400);
        return json(await repository().list({ page, market, status, query, sourcePage }));
      } catch (error) { return errorResponse(error); }
    },
    async POST(request: Request) {
      if (!authorized(request, secret())) return json({ error: 'unauthorized' }, 401);
      if (!sameOrigin(request)) return json({ error: 'invalid_origin' }, 403);
      try {
        const command = parseCommand(await readJson(request));
        if (!command) return json({ error: 'invalid_payload' }, 400);
        return json(await repository().mutate(command, operatorId(request)));
      } catch (error) { return errorResponse(error); }
    },
  };
}
export function createSessionHandlers(secret = adminSecret) {
  return {
    async POST(request: Request) {
      if (!sameOrigin(request)) return json({ error: 'invalid_origin' }, 403);
      if (!strongSecret(secret())) return json({ error: 'admin_not_configured' }, 503);
      try {
        const body = await readJson(request) as Record<string, unknown> | null;
        if (!body || typeof body.secret !== 'string' || Object.keys(body).length !== 1) return json({ error: 'invalid_payload' }, 400);
        if (!equalSecret(body.secret, secret())) return json({ error: 'unauthorized' }, 401);
        return json({ authenticated: true }, 200, { 'Set-Cookie': sessionCookie(issueSession(secret()), new URL(request.url).protocol === 'https:') });
      } catch (error) { return errorResponse(error); }
    },
    async DELETE(request: Request) {
      if (!sameOrigin(request)) return json({ error: 'invalid_origin' }, 403);
      return json({ authenticated: false }, 200, { 'Set-Cookie': sessionCookie('', new URL(request.url).protocol === 'https:', true) });
    },
  };
}
