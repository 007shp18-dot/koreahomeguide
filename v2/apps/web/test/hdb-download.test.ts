import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  HDB_DATASETS,
  downloadHdbCsv,
  type HdbDataset,
} from '../lib/singapore/hdb-download.server';

function response(body: BodyInit, init: ResponseInit = {}): Response {
  return new Response(body, { status: 200, ...init });
}

describe('HDB full-dataset download boundary', () => {
  it('allow-lists the three approved official datasets exactly', () => {
    expect(HDB_DATASETS).toEqual({
      resale: 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc',
      rental: 'd_c9f57187485a850908655db0e8cfe651',
      property: 'd_17f5382f26140b1fdae0ba2ef6239d2f',
    });
  });

  it.each(['resale', 'rental', 'property'] as const)(
    'polls data.gov.sg and downloads %s CSV from the returned trusted URL',
    async (dataset) => {
      const calls: string[] = [];
      const fetch = vi.fn(async (input: string | URL) => {
        const url = String(input);
        calls.push(url);
        if (url.endsWith('/poll-download')) return response(JSON.stringify({
          data: { url: 'https://storage.data.gov.sg/hdb.csv' },
        }), { headers: { 'content-type': 'application/json' } });
        return response('a,b\n1,2\n', { headers: { 'content-type': 'text/csv' } });
      });

      const result = await downloadHdbCsv(dataset, fetch);

      expect(calls[0]).toBe(
        `https://api-open.data.gov.sg/v1/public/api/datasets/${HDB_DATASETS[dataset]}/poll-download`,
      );
      expect(result).toEqual({ dataset, csv: 'a,b\n1,2\n' });
    },
  );

  it('initiates once when a cached download is unavailable, then polls again', async () => {
    const calls: string[] = [];
    let polls = 0;
    const fetch = vi.fn(async (input: string | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.endsWith('/poll-download')) {
        polls += 1;
        return response(JSON.stringify(polls === 1
          ? { data: {} }
          : { data: { url: 'https://storage.data.gov.sg/hdb.csv' } }));
      }
      if (url.endsWith('/initiate-download')) return response(JSON.stringify({ data: {} }));
      return response('a\n1\n', { headers: { 'content-type': 'text/csv' } });
    });

    await downloadHdbCsv('resale', fetch);

    expect(calls.map((url) => url.split('/').at(-1))).toEqual([
      'poll-download', 'initiate-download', 'poll-download', 'hdb.csv',
    ]);
  });

  it.each([
    ['untrusted URL', { data: { url: 'https://example.com/private.csv' } }],
    ['missing URL', { data: {} }],
  ])('fails closed on %s', async (_label, payload) => {
    const fetch = vi.fn(async (input: string | URL) => {
      if (String(input).includes('download')) return response(JSON.stringify(payload));
      return response('secret');
    });
    await expect(downloadHdbCsv('resale', fetch)).rejects.toThrow('HDB dataset unavailable.');
  });

  it('does not accept an arbitrary dataset name at the type/runtime boundary', async () => {
    await expect(downloadHdbCsv('other' as HdbDataset, vi.fn()))
      .rejects.toThrow('HDB dataset unavailable.');
  });
});
