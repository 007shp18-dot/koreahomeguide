import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('Neon request-scoped deadlines', () => {
  it.each([
    ['contentDatabase', 8_000],
    ['publicContentDatabase', 3_000],
  ] as const)('%s can execute a later query after an earlier deadline expires', async (factory, deadline) => {
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@unit-test.invalid/test');
    const deadlines: AbortController[] = [];
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => {
      const controller = new AbortController();
      deadlines.push(controller);
      return controller.signal;
    });
    // Exercise the real Neon serializer/transaction client; only its network boundary is replaced.
    vi.stubGlobal('fetch', async (_url: string, options: RequestInit) => {
      options.signal?.throwIfAborted();
      const request = JSON.parse(String(options.body)) as { queries?: unknown[] };
      const result = { fields: [{ name: 'value', dataTypeID: 23 }], rows: [['1']] };
      return Response.json(request.queries ? { results: request.queries.map(() => result) } : result);
    });
    const database = await import('../lib/db/postgres.server');
    const sql = database[factory]();
    expect(sql).not.toBeNull();
    if (sql === null) throw new Error('Test connection must create a client.');
    expect(await sql`SELECT 1 AS value`).toEqual([{ value: 1 }]);
    deadlines.forEach((controller) => controller.abort(new DOMException('Expired deadline', 'TimeoutError')));
    expect(await sql.query('SELECT 1 AS value')).toEqual([{ value: 1 }]);
    deadlines.forEach((controller) => controller.abort(new DOMException('Expired deadline', 'TimeoutError')));
    expect(await sql.transaction([sql`SELECT 1 AS value`])).toEqual([[{ value: 1 }]]);
    expect(timeout.mock.calls.map(([milliseconds]) => milliseconds)).toEqual([deadline, deadline, deadline]);
  });
});
