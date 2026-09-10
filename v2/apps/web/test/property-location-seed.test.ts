import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { loadSingaporePrivateSeed } from '../scripts/property-seed-source.mjs';

const seedRunnerPath = fileURLToPath(new URL('../scripts/seed-property-core.mjs', import.meta.url));

type LocationSeedRow = Readonly<{
  externalId: string;
  latitude: number | null;
  longitude: number | null;
}>;

describe('property location database seed', () => {
  it('keeps accepted URA locations inside Singapore and rejects missing points', () => {
    const rows = loadSingaporePrivateSeed() as readonly LocationSeedRow[];
    const ready = rows.filter(({ latitude, longitude }) => latitude !== null && longitude !== null);

    expect(ready).toHaveLength(3_403);
    for (const row of ready) {
      expect(row.latitude).toBeGreaterThanOrEqual(1.15);
      expect(row.latitude).toBeLessThanOrEqual(1.5);
      expect(row.longitude).toBeGreaterThanOrEqual(103.55);
      expect(row.longitude).toBeLessThanOrEqual(104.15);
    }
    expect(rows.find(({ externalId }) =>
      externalId === '3f313a5dbcce67b0606a993270569adafdaa2eedd1d16799d7c7f24113f030e5'))
      .toMatchObject({ latitude: expect.any(Number), longitude: expect.any(Number) });
  }, 30_000);

  it('projects only verified URA coordinates into public locations', () => {
    const source = readFileSync(seedRunnerPath, 'utf8');

    expect(source).toContain('INSERT INTO public_entity_locations');
    expect(source).toContain("'URA'");
    expect(source).toContain("'parcel'");
    expect(source).toContain("'verified'");
    expect(source).not.toMatch(/DELETE\s+FROM\s+public_entity_locations/iu);
    expect(source).not.toContain('ae-dubai');
  });
});
