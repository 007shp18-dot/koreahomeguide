import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { loadMigrationBundles } from '../scripts/migration-files.mjs';

const migrationDirectory = fileURLToPath(new URL('../db/migrations/', import.meta.url));

describe('property evidence seed migration', () => {
  it('adds replay-safe evidence indexes without replacing existing data tables', async () => {
    const bundles = await loadMigrationBundles(migrationDirectory);
    const migration = bundles.find(({ name }) => name === '0010_property_evidence_seed.sql');

    expect(migration).toBeDefined();
    const source = migration!.statements.join('\n');
    expect(source).toContain('metric_observations_seed_identity');
    expect(source).toContain('observations_market_entity_date');
    expect(source).toContain('source_records_dataset_business_key');
    expect(source).not.toMatch(/CREATE\s+TABLE/iu);
    expect(source).not.toMatch(/\b(?:DROP|TRUNCATE)\b/iu);
    expect(source).not.toContain('ae-dubai');
  });
});
