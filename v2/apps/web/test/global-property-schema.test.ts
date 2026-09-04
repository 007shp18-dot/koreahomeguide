import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  assertAdditiveMigration,
  loadMigrationBundles,
} from '../scripts/migration-files.mjs';

const migrationDirectory = fileURLToPath(new URL('../db/migrations/', import.meta.url));

describe('global property database migration', () => {
  it('loads the global core after the existing persistent-content migrations', async () => {
    const bundles = await loadMigrationBundles(migrationDirectory);

    expect(bundles.map(({ name }) => name)).toEqual([
      '0001_persistent_content.sql',
      '0002_google_news_source.sql',
      '0003_global_property_core.sql',
    ]);
    expect(bundles.at(-1)?.statements.length).toBeGreaterThan(10);
  });

  it('creates every common-core relation without destructive legacy-table changes', async () => {
    const bundles = await loadMigrationBundles(migrationDirectory);
    const globalCore = bundles.find(({ name }) => name === '0003_global_property_core.sql');
    expect(globalCore).toBeDefined();

    const result = assertAdditiveMigration(globalCore!, {
      requiredTables: [
        'geographies',
        'property_entities',
        'entity_aliases',
        'external_identifiers',
        'rights_policies',
        'datasets',
        'source_records',
        'observations',
        'evidence_releases',
        'metric_definitions',
        'metric_observations',
        'market_capabilities',
        'media_assets',
      ],
      protectedTables: ['districts', 'buildings', 'transactions', 'building_photos'],
    });

    expect(result.createdTables).toEqual([
      'geographies',
      'property_entities',
      'entity_aliases',
      'external_identifiers',
      'rights_policies',
      'datasets',
      'source_records',
      'observations',
      'evidence_releases',
      'metric_definitions',
      'metric_observations',
      'market_capabilities',
      'media_assets',
    ]);
  });
});
