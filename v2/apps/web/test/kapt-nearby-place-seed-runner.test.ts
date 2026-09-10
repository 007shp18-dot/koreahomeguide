import { describe, expect, it } from 'vitest';

import { createKaptNearbyPlaceSeedRunner } from '../scripts/seed-kapt-nearby-places.mjs';

const rows = [
  { identityKey: 'seoul:a:station:kapt:1', buildingKey: 'seoul:a', kind: 'station', providerId: 'kapt:1' },
  { identityKey: 'seoul:a:school:kapt:2', buildingKey: 'seoul:a', kind: 'school', providerId: 'kapt:2' },
  { identityKey: 'seoul:b:school:kapt:3', buildingKey: 'seoul:b', kind: 'school', providerId: 'kapt:3' },
];

describe('K-apt nearby-place database seed runner', () => {
  it('writes bounded changed rows and becomes a no-op on replay', async () => {
    const stored = new Set<string>();
    let maximumBatch = 0;
    const port = {
      async upsert(batch: typeof rows) {
        maximumBatch = Math.max(maximumBatch, batch.length);
        let changed = 0;
        for (const row of batch) {
          if (!stored.has(row.identityKey)) { stored.add(row.identityKey); changed += 1; }
        }
        return changed;
      },
      async verify() { return { total: stored.size, digest: 'a'.repeat(64) }; },
    };
    const load = () => ({
      rows,
      summary: { total: 3, digest: 'a'.repeat(64) },
    });
    const runner = createKaptNearbyPlaceSeedRunner(port, load);

    expect(await runner.run({ batchSize: 2, verifyOnly: false }))
      .toMatchObject({ changed: 3 });
    expect(await runner.run({ batchSize: 2, verifyOnly: false }))
      .toMatchObject({ changed: 0 });
    expect(maximumBatch).toBe(2);
  });

  it('rejects non-Seoul rows before any write', async () => {
    let writes = 0;
    const port = {
      async upsert() { writes += 1; return 0; },
      async verify() { return { total: 0, digest: 'a'.repeat(64) }; },
    };
    const load = () => ({
      rows: [{ ...rows[0]!, buildingKey: 'dubai:a' }],
      summary: { total: 1, digest: 'a'.repeat(64) },
    });

    await expect(createKaptNearbyPlaceSeedRunner(port, load)
      .run({ batchSize: 1, verifyOnly: false })).rejects.toThrow(/scope/iu);
    expect(writes).toBe(0);
  });
});
