import { describe, expect, it } from 'vitest';

import {
  URA_DATA_URL,
  URA_TOKEN_URL,
  UraClientError,
  createUraClient,
  type UraFetch,
} from '../src/ura-client';

type FakeReply = { status?: number; body?: unknown };

function reply(status: number, body: unknown, reads: { count: number }): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      reads.count += 1;
      return body;
    },
  } as Response;
}

function successfulFetch(overrides: Readonly<Record<string, FakeReply>> = {}) {
  const calls: Array<{ url: string; headers: HeadersInit | undefined }> = [];
  const reads = { count: 0 };
  const fetch: UraFetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, headers: init?.headers });
    const override = overrides[url];
    if (override) return reply(override.status ?? 200, override.body, reads);
    if (url === URA_TOKEN_URL) {
      return reply(200, { Status: 'Success', Message: '', Result: 'server-token' }, reads);
    }
    return reply(200, {
      Status: 'Success',
      Message: '',
      Result: [{ batch: Number(new URL(url).searchParams.get('batch')) }],
    }, reads);
  };
  return { calls, fetch, reads };
}

function expectCode(action: () => Promise<unknown>, code: UraClientError['code']) {
  return expect(action()).rejects.toMatchObject({
    name: 'UraClientError',
    code,
    message: 'URA provider request failed.',
    publicMessage: 'URA provider request failed.',
  });
}

describe('createUraClient', () => {
  it('gets one token then consumes all four batches exactly once in order', async () => {
    const fake = successfulFetch();
    const client = createUraClient({ accessKey: 'server-key', fetch: fake.fetch });

    const batches = await client.fetchPrivateResidentialTransactions();

    expect(fake.calls.map(({ url }) => url)).toEqual([
      URA_TOKEN_URL,
      `${URA_DATA_URL}?service=PMI_Resi_Transaction&batch=1`,
      `${URA_DATA_URL}?service=PMI_Resi_Transaction&batch=2`,
      `${URA_DATA_URL}?service=PMI_Resi_Transaction&batch=3`,
      `${URA_DATA_URL}?service=PMI_Resi_Transaction&batch=4`,
    ]);
    expect(new Headers(fake.calls[0]?.headers).get('AccessKey')).toBe('server-key');
    expect(new Headers(fake.calls[0]?.headers).has('Token')).toBe(false);
    for (const call of fake.calls.slice(1)) {
      expect(new Headers(call.headers).get('AccessKey')).toBe('server-key');
      expect(new Headers(call.headers).get('Token')).toBe('server-token');
    }
    expect(fake.reads.count).toBe(5);
    expect(batches).toHaveLength(4);
    expect(JSON.stringify(batches)).not.toContain('server-token');
    expect(JSON.stringify(batches)).not.toContain('server-key');
  });

  it('retries one transient response only once', async () => {
    const fake = successfulFetch();
    let transient = true;
    const fetch: UraFetch = async (input, init) => {
      if (String(input).includes('batch=2') && transient) {
        transient = false;
        fake.calls.push({ url: String(input), headers: init?.headers });
        return reply(502, { diagnostic: 'do not expose' }, fake.reads);
      }
      return fake.fetch(input, init);
    };

    await createUraClient({ accessKey: 'server-key', fetch }).fetchPrivateResidentialTransactions();

    expect(fake.calls.filter(({ url }) => url.includes('batch=2'))).toHaveLength(2);
    expect(fake.reads.count).toBe(6);
  });

  it.each([
    [401, 'authentication'],
    [403, 'authentication'],
    [429, 'quota'],
    [500, 'provider'],
  ] as const)('maps HTTP %s to %s without provider text', async (status, code) => {
    const fake = successfulFetch({
      [URA_TOKEN_URL]: { status, body: { diagnostic: 'secret provider detail' } },
    });
    await expectCode(
      () => createUraClient({ accessKey: 'server-key', fetch: fake.fetch })
        .fetchPrivateResidentialTransactions(),
      code,
    );
  });

  it('maps malformed JSON and blank batches to distinct codes', async () => {
    const invalid = successfulFetch({
      [URA_TOKEN_URL]: { body: { Result: 'token-without-exact-envelope' } },
    });
    await expectCode(
      () => createUraClient({ accessKey: 'server-key', fetch: invalid.fetch })
        .fetchPrivateResidentialTransactions(),
      'schema',
    );

    const blankUrl = `${URA_DATA_URL}?service=PMI_Resi_Transaction&batch=3`;
    const blank = successfulFetch({
      [blankUrl]: { body: { Status: 'Success', Message: '', Result: [] } },
    });
    await expectCode(
      () => createUraClient({ accessKey: 'server-key', fetch: blank.fetch })
        .fetchPrivateResidentialTransactions(),
      'incomplete_batch',
    );
  });

  it('aborts a timed-out request with a sanitized timeout code', async () => {
    const fetch: UraFetch = (_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('provider request exposed timeout details', 'AbortError'));
      });
    });
    await expectCode(
      () => createUraClient({ accessKey: 'server-key', fetch, timeoutMs: 1 })
        .fetchPrivateResidentialTransactions(),
      'timeout',
    );
  });
});
