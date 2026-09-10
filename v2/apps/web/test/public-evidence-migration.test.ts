import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  assertAdditiveMigration,
  loadMigrationBundles,
} from '../scripts/migration-files.mjs';

const migrationDirectory = fileURLToPath(new URL('../db/migrations/', import.meta.url));

describe('public evidence projection migration', () => {
  it('adds public location and media projections after the global property core', async () => {
    const bundles = await loadMigrationBundles(migrationDirectory);

    const names = bundles.map(({ name }) => name);
    expect(names.indexOf('0004_public_evidence_projection.sql'))
      .toBeLessThan(names.indexOf('0005_newsroom_content_system.sql'));
    const projection = bundles.find(({ name }) => name === '0004_public_evidence_projection.sql');
    expect(projection).toBeDefined();

    expect(assertAdditiveMigration(projection!, {
      requiredTables: ['public_entity_locations', 'public_entity_media'],
      protectedTables: ['districts', 'buildings', 'transactions', 'building_photos'],
    }).createdTables).toEqual(['public_entity_locations', 'public_entity_media']);
  });

  it('keeps legacy relations intact while enforcing publishable projection rows', async () => {
    const bundles = await loadMigrationBundles(migrationDirectory);
    const projection = bundles.find(({ name }) => name === '0004_public_evidence_projection.sql');
    expect(projection).toBeDefined();

    const statements = projection!.statements.join('\n');
    expect(statements).not.toMatch(/\b(?:DROP|TRUNCATE)\b/iu);
    expect(statements).toContain('public_entity_locations_one_verified_location');
    expect(statements).toContain('evidence_release_publication_check');
    expect(statements).toContain('public_entity_media_display_reference_check');
  });
});
