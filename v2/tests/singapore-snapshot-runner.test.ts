import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { parseSingaporeSnapshot, type UraFetch } from '@signedprice/singapore-property';
import { runSingaporeSnapshotBuild } from '../scripts/build-singapore-snapshot.mts';

const fixture = JSON.parse(readFileSync(
  new URL('../packages/singapore-property/test/fixtures/ura-transaction-envelope.synthetic.json', import.meta.url),
  'utf8',
)) as unknown;

const allowedRights = Object.freeze({
  operations: Object.freeze({
    ingest: 'allowed', aggregate: 'allowed', display: 'allowed', commercial: 'allowed', index: 'blocked',
  } as const),
});

describe('Singapore snapshot runner', () => {
  it('collects once, validates once, writes explicitly, and logs only safe totals', async () => {
    const calls: string[] = [];
    const fetch: UraFetch = async (input) => {
      const url = String(input);
      calls.push(url);
      const body = url.includes('insertNewToken')
        ? { Status: 'Success', Message: '', Result: 'runner-token' }
        : fixture;
      return { ok: true, status: 200, json: async () => structuredClone(body) } as Response;
    };
    const directory = await mkdtemp(join(tmpdir(), 'signedprice-sg-snapshot-'));
    const outputPath = join(directory, 'snapshot.json');
    const logs: string[] = [];

    const snapshot = await runSingaporeSnapshotBuild({
      outputPath,
      credential: { accessKey: 'runner-key' },
      fetch,
      now: () => new Date('2026-08-31T09:00:00.000Z'),
      rights: allowedRights,
      log: (line) => logs.push(line),
    });

    expect(calls).toHaveLength(5);
    expect(parseSingaporeSnapshot(await readFile(outputPath, 'utf8'))).toEqual(snapshot);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toContain('12 transactions');
    for (const forbidden of ['Example Residences', 'Example Road', 'runner-key', 'runner-token']) {
      expect(logs.join('\n')).not.toContain(forbidden);
    }
  });

  it('refuses before transport when display rights are pending', async () => {
    let called = false;
    await expect(runSingaporeSnapshotBuild({
      outputPath: '/tmp/should-not-write-signedprice.json',
      credential: { accessKey: 'runner-key' },
      fetch: async () => { called = true; throw new Error('must not call'); },
      now: () => new Date('2026-08-31T09:00:00.000Z'),
      rights: { operations: { aggregate: 'requires_dataset_confirmation', display: 'requires_dataset_confirmation' } },
      log: () => undefined,
    })).rejects.toThrow('Singapore snapshot publication rights are not confirmed.');
    expect(called).toBe(false);
  });
});
