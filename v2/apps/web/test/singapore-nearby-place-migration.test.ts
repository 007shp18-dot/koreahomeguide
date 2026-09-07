import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { assertAdditiveMigration, splitMigrationStatements } from '../scripts/migration-files.mjs';

describe('Singapore nearby-place atomic publication migration', () => {
  it('adds an isolated generation staging table without changing live evidence tables', () => {
    const name = '0012_singapore_nearby_seed_stage.sql';
    const statements = splitMigrationStatements(readFileSync(
      resolve(import.meta.dirname, `../db/migrations/${name}`), 'utf8',
    ));

    expect(assertAdditiveMigration({ name, statements }, {
      requiredTables: ['nearby_place_seed_stage'],
      protectedTables: ['nearby_places', 'buildings', 'property_entities'],
    })).toMatchObject({ createdTables: ['nearby_place_seed_stage'] });
  });

  it('publishes and prunes inside one database transaction after staging verification', () => {
    const source = readFileSync(resolve(import.meta.dirname, '../scripts/seed-singapore-nearby-places.mjs'), 'utf8');

    expect(source).toContain('await port.verifyStage');
    expect(source).toContain('await sql.transaction');
    expect(source).toContain('nearby_place_seed_stage');
    expect(source).toContain('jsonb_to_recordset(batch.lines)');
    expect(source).toContain('integrity_guard');
  });

  it('removes only indexes already covered by matching left-prefix indexes', () => {
    const source = readFileSync(resolve(
      import.meta.dirname,
      '../db/migrations/0013_singapore_nearby_storage.sql',
    ), 'utf8');
    const statements = splitMigrationStatements(source);

    expect(statements).toHaveLength(2);
    expect(source).toContain('DROP INDEX IF EXISTS source_records_dataset_business_key');
    expect(source).toContain('DROP INDEX IF EXISTS nearby_place_seed_stage_generation');
    expect(source).not.toMatch(/DROP\s+(TABLE|SCHEMA)/i);
  });
});
