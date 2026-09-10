import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { assertAdditiveMigration, splitMigrationStatements } from '../scripts/migration-files.mjs';

const migrationUrl = new URL('../db/migrations/0025_onemap_location_collection.sql', import.meta.url);
const migration = readFileSync(migrationUrl, 'utf8');
const statements: string[] = splitMigrationStatements(migration);

describe('OneMap location collection migration', () => {
  it('adds an isolated, versioned review queue without changing live property data', () => {
    expect(assertAdditiveMigration({
      name: '0025_onemap_location_collection.sql',
      statements,
    }, {
      requiredTables: [
        'onemap_location_candidates',
        'onemap_location_current',
        'onemap_location_attempts',
        'onemap_location_review_audit',
      ],
      protectedTables: [
        'property_entities',
        'public_entity_locations',
        'hdb_building_candidates',
        'hdb_building_current',
      ],
    })).toMatchObject({
      createdTables: [
        'onemap_location_candidates',
        'onemap_location_current',
        'onemap_location_attempts',
        'onemap_location_review_audit',
      ],
    });
  });

  it('records the reviewed OneMap licence rights and required attribution', () => {
    expect(migration).toContain("'sg-onemap-search-v1', true, true, true, true, true, true, true");
    expect(migration).toContain('Contains information from OneMap Singapore');
    expect(migration).toContain('https://www.onemap.gov.sg/legal/opendatalicence.html');
    expect(migration).toMatch(/ON CONFLICT \(id\) DO UPDATE SET/i);
  });

  it('bounds candidate identity, coordinates and raw payloads', () => {
    expect(migration).toMatch(/content_hash ~ '\^\[a-f0-9\]\{64\}\$'/i);
    expect(migration).toMatch(/latitude BETWEEN 1\.15 AND 1\.50/i);
    expect(migration).toMatch(/longitude BETWEEN 103\.55 AND 104\.10/i);
    expect(migration).toMatch(/octet_length\(raw_result::text\) BETWEEN 2 AND 32768/i);
    expect(migration).toMatch(/status IN \('pending', 'approved', 'rejected'\)/i);
    expect(migration).toMatch(/next_version = previous_version \+ 1/i);
  });

  it('is repeat-safe and keeps all collection tables private by default', () => {
    const tableCreates = statements.filter((statement) => /^CREATE TABLE/iu.test(statement));
    const indexCreates = statements.filter((statement) => /^CREATE INDEX/iu.test(statement));
    expect(tableCreates).toHaveLength(4);
    expect(tableCreates.every((statement) => /^CREATE TABLE IF NOT EXISTS/iu.test(statement))).toBe(true);
    expect(indexCreates).toHaveLength(5);
    expect(indexCreates.every((statement) => /^CREATE INDEX IF NOT EXISTS/iu.test(statement))).toBe(true);
    for (const table of [
      'onemap_location_candidates',
      'onemap_location_current',
      'onemap_location_attempts',
      'onemap_location_review_audit',
    ]) {
      expect(migration).toMatch(new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`, 'i'));
    }
    expect(migration).toMatch(/REVOKE ALL PRIVILEGES[\s\S]*FROM PUBLIC/i);
    expect(migration).not.toMatch(/GRANT\s+(SELECT|INSERT|UPDATE|DELETE)[\s\S]*\b(anon|authenticated)\b/i);
  });
});

const modulePath = process.env.ONEMAP_LOCATION_TEST_PGLITE_MODULE ?? (() => {
  try {
    return createRequire(import.meta.url).resolve('@electric-sql/pglite');
  } catch {
    return null;
  }
})();
type Row = Record<string, unknown>;
type Database = {
  exec(sql: string): Promise<unknown>;
  query(sql: string, parameters?: unknown[]): Promise<{ rows: Row[] }>;
  close(): Promise<void>;
};

(modulePath === null ? describe.skip : describe)('OneMap location migration on PostgreSQL', () => {
  it('applies twice, enforces candidate bounds and enables RLS', async () => {
    const { PGlite } = createRequire(import.meta.url)(modulePath!) as { PGlite: new () => Database };
    const db = new PGlite();
    try {
      await db.exec(`
        CREATE TABLE property_entities (id text PRIMARY KEY);
        CREATE TABLE rights_policies (
          id text PRIMARY KEY,
          can_fetch boolean NOT NULL DEFAULT false,
          can_store boolean NOT NULL DEFAULT false,
          can_cache boolean NOT NULL DEFAULT false,
          can_display boolean NOT NULL DEFAULT false,
          can_create_derived boolean NOT NULL DEFAULT false,
          can_use_commercially boolean NOT NULL DEFAULT false,
          can_index boolean NOT NULL DEFAULT false,
          attribution jsonb NOT NULL DEFAULT '[]'::jsonb,
          policy_url text,
          checked_at timestamptz NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        INSERT INTO property_entities(id) VALUES ('sg:hdb:1-beach-rd');
      `);
      for (let pass = 0; pass < 2; pass += 1) {
        for (const statement of statements) await db.exec(statement);
      }

      const security = await db.query(`
        SELECT relname, relrowsecurity
        FROM pg_class
        WHERE relname LIKE 'onemap_location_%' AND relkind = 'r'
        ORDER BY relname
      `);
      expect(security.rows).toEqual([
        { relname: 'onemap_location_attempts', relrowsecurity: true },
        { relname: 'onemap_location_candidates', relrowsecurity: true },
        { relname: 'onemap_location_current', relrowsecurity: true },
        { relname: 'onemap_location_review_audit', relrowsecurity: true },
      ]);
      expect((await db.query(`
        SELECT grantee
        FROM information_schema.role_table_grants
        WHERE table_name LIKE 'onemap_location_%' AND grantee = 'PUBLIC'
      `)).rows).toEqual([]);

      const values = [
        '11111111-1111-4111-8111-111111111111',
        '["1","BEACH RD"]',
        'a'.repeat(64),
        'sg:hdb:1-beach-rd',
        '1',
        'BEACH RD',
        '1 BEACH RD',
        '189673',
        1.3,
        103.8,
        JSON.stringify({ BLK_NO: '1', ROAD_NAME: 'BEACH RD' }),
      ];
      await expect(db.query(`
        INSERT INTO onemap_location_candidates (
          id, provider_key, content_hash, entity_id, block, street,
          address_text, postal_code, latitude, longitude, raw_result
        ) VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
      `, values)).resolves.toBeDefined();
      await expect(db.query(`
        INSERT INTO onemap_location_candidates (
          id, provider_key, content_hash, entity_id, block, street,
          address_text, postal_code, latitude, longitude, raw_result
        ) VALUES ('22222222-2222-4222-8222-222222222222',$1,$2,$3,$4,$5,$6,$7,0,0,$8::jsonb)
      `, values.slice(1, 8).concat(values[10]!))).rejects.toThrow();
    } finally {
      await db.close();
    }
  }, 30_000);
});
