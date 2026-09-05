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
      '0004_public_evidence_projection.sql',
      '0005_newsroom_content_system.sql',
      '0006_infographic_render_records.sql',
      '0007_building_enrichment_operations.sql',
    ]);
    expect(bundles.find(({ name }) => name === '0003_global_property_core.sql')?.statements.length)
      .toBeGreaterThan(10);
  });

  it('adds durable enrichment retries without replacing property or Dubai data', async () => {
    const bundles = await loadMigrationBundles(migrationDirectory);
    const enrichment = bundles.find(({ name }) => name === '0007_building_enrichment_operations.sql');
    expect(enrichment).toBeDefined();

    const result = assertAdditiveMigration(enrichment!, {
      requiredTables: ['building_enrichment_attempts'],
      protectedTables: ['property_entities', 'buildings', 'building_photos', 'building_facts'],
    });
    expect(result.createdTables).toEqual(['building_enrichment_attempts']);
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

  it('adds reproducible owned infographic render records without destructive changes', async () => {
    const bundles = await loadMigrationBundles(migrationDirectory);
    const infographics = bundles.find(({ name }) => name === '0006_infographic_render_records.sql');
    expect(infographics).toBeDefined();

    const result = assertAdditiveMigration(infographics!, {
      requiredTables: [
        'infographic_specs',
        'infographic_renders',
        'infographic_render_evidence',
        'content_infographic_links',
      ],
      protectedTables: ['content_articles', 'evidence_releases'],
    });
    expect(result.createdTables).toEqual([
      'infographic_specs',
      'infographic_renders',
      'infographic_render_evidence',
      'content_infographic_links',
    ]);
  });
});
