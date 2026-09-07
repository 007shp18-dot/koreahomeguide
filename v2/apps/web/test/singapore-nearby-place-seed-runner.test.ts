import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createSingaporeNearbyPlaceSeedRunner } from '../scripts/seed-singapore-nearby-places.mjs';

const rows = [
  { identityKey: 'singapore:project:a:station:lta:1', buildingKey: 'singapore:project:a', kind: 'station', providerId: 'lta:station:1' },
  { identityKey: 'singapore:project:a:school:moe:1', buildingKey: 'singapore:project:a', kind: 'school', providerId: 'moe:school:1' },
  { identityKey: 'singapore:block:b:school:moe:2', buildingKey: 'singapore:block:b', kind: 'school', providerId: 'moe:school:2' },
];

describe('Singapore nearby-place database seed runner', () => {
  it('releases staging storage before and after publishing', () => {
    const source = readFileSync(resolve(
      import.meta.dirname,
      '../scripts/seed-singapore-nearby-places.mjs',
    ), 'utf8');

    expect(source.match(/TRUNCATE nearby_place_seed_stage/g)).toHaveLength(2);
  });

  it('skips the deploy hook outside a configured production deployment', () => {
    const script = resolve(import.meta.dirname, '../scripts/seed-singapore-nearby-places.mjs');
    const output = execFileSync(process.execPath, [script, '--if-production'], {
      cwd: resolve(import.meta.dirname, '..'),
      encoding: 'utf8',
      env: { ...process.env, DATABASE_URL: '', VERCEL_ENV: 'preview' },
    });

    expect(JSON.parse(output)).toMatchObject({ state: 'skipped', reason: 'not-production' });
  });

  it('writes bounded rows, prunes stale source rows, and becomes a no-op on replay', async () => {
    const stored = new Set<string>(['stale']);
    const staged = new Set<string>();
    let maximumBatch = 0;
    let resets = 0;
    const port = {
      async resetStage() { resets += 1; staged.clear(); },
      async stage(batch: typeof rows) {
        maximumBatch = Math.max(maximumBatch, batch.length);
        for (const row of batch) staged.add(row.identityKey);
      },
      async verifyStage() { return { total: staged.size, digest: 'a'.repeat(64) }; },
      async publish() {
        let upserted = 0;
        for (const identity of staged) if (!stored.has(identity)) { stored.add(identity); upserted += 1; }
        const pruned = stored.delete('stale') ? 1 : 0;
        return { upserted, pruned };
      },
      async verify() {
        return {
          total: stored.size,
          digest: 'a'.repeat(64),
          generationSha256: stored.size === 3 ? 'b'.repeat(64) : null,
        };
      },
    };
    const load = () => ({ rows, summary: { total: 3, digest: 'a'.repeat(64), sourceSha256: 'b'.repeat(64) } });
    const runner = createSingaporeNearbyPlaceSeedRunner(port, load);

    expect(await runner.run({ batchSize: 2 })).toMatchObject({ changed: 4, upserted: 3, pruned: 1 });
    expect(await runner.run({ batchSize: 2 })).toMatchObject({ changed: 0, upserted: 0, pruned: 0 });
    expect(resets).toBe(2);
    expect(maximumBatch).toBe(2);
  });

  it('never publishes a partial generation when staging fails', async () => {
    const live = new Set(['old']);
    let publishCalls = 0;
    const port = {
      async resetStage() {},
      async stage(batch: typeof rows) {
        if (batch.some(({ identityKey }) => identityKey.includes('block:b'))) throw new Error('staging interrupted');
      },
      async verifyStage() { return { total: 0, digest: '0'.repeat(64) }; },
      async publish() { publishCalls += 1; live.clear(); return { upserted: 0, pruned: 1 }; },
      async verify() { return { total: live.size, digest: '0'.repeat(64) }; },
    };

    await expect(createSingaporeNearbyPlaceSeedRunner(port, () => ({
      rows, summary: { total: 3, digest: 'a'.repeat(64), sourceSha256: 'b'.repeat(64) },
    })).run({ batchSize: 2 })).rejects.toThrow('staging interrupted');
    expect([...live]).toEqual(['old']);
    expect(publishCalls).toBe(0);
  });

  it('rejects non-Singapore or non-official rows before writing', async () => {
    let writes = 0;
    const port = {
      async resetStage() { writes += 1; },
      async stage() { writes += 1; },
      async verifyStage() { return { total: 0, digest: 'a'.repeat(64) }; },
      async publish() { writes += 1; return { upserted: 0, pruned: 0 }; },
      async verify() { return { total: 0, digest: 'a'.repeat(64) }; },
    };
    const load = () => ({
      rows: [{ ...rows[0]!, buildingKey: 'seoul:a', providerId: 'custom:1' }],
      summary: { total: 1, digest: 'a'.repeat(64), sourceSha256: 'b'.repeat(64) },
    });

    await expect(createSingaporeNearbyPlaceSeedRunner(port, load).run()).rejects.toThrow(/scope/iu);
    expect(writes).toBe(0);
  });
});
