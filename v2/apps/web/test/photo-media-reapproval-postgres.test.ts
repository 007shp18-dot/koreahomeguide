import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const local = '/workspace/scratch/c926a5a3f09d/japan-coverage-harness/node_modules/@electric-sql/pglite/dist/index.cjs';
const modulePath = process.env.PHOTO_REVIEW_TEST_PGLITE_MODULE ?? (existsSync(local) ? local : null);
const suite = modulePath === null ? describe.skip : describe;
type Database = { exec(sql: string): Promise<unknown>; query(sql: string, parameters: unknown[]): Promise<{ rows: Record<string, unknown>[] }>; close(): Promise<void> };

suite('photo replacement publication', () => {
  it('never revives an old photo when a provider candidate is reapproved or the publisher only partly completes', async () => {
    const { PGlite } = createRequire(import.meta.url)(modulePath!) as { PGlite: new () => Database };
    const db = new PGlite();
    try {
      const source = await readFile(new URL('../lib/public-data/entity-location-projection.server.ts', import.meta.url), 'utf8');
      const sql = source.match(/const MEDIA_SQL = `([\s\S]*?)`;/)![1]!;
      await db.exec(`
        CREATE TABLE public_entity_media(entity_id text,media_asset_id text,role text,position integer,
          display_url text,provider_reference text,width integer,height integer,focal_x float,focal_y float,
          attribution_name text,attribution_url text,exact_subject boolean,published_at timestamptz,last_checked_at timestamptz);
        CREATE TABLE media_assets(id text,subject_entity_id text,rights_policy_id text,legacy_registry_key text,
          source_url text,review_state text,approved_at timestamptz);
        CREATE TABLE rights_policies(id text,can_display boolean);
        CREATE TABLE property_entities(id text,local_attributes jsonb);
        CREATE TABLE building_photos(registry_key text,building_key text,status text,approved_at timestamptz,
          approved_by text,rights_status text,visual_reviewed_at timestamptz,subject_kind text,asset_url text);
        INSERT INTO rights_policies VALUES ('licensed',true);
        INSERT INTO property_entities VALUES ('sg-singapore:project:a','{"legacyBuildingKey":"singapore:project:a"}');
        INSERT INTO media_assets VALUES ('1','sg-singapore:project:a','licensed','candidate:wikimedia:singapore:project:a',
          'https://commons.wikimedia.org/wiki/File:Wrong.jpg','approved','2026-09-01');
        INSERT INTO public_entity_media(entity_id,media_asset_id,role,position,display_url,exact_subject,published_at,last_checked_at)
          VALUES ('sg-singapore:project:a','1','hero',0,'https://upload.wikimedia.org/Wrong.jpg',true,'2026-09-01','2026-09-01');
        INSERT INTO building_photos VALUES ('candidate:wikimedia:singapore:project:a','singapore:project:a','approved',
          '2026-09-01','content-admin-visual-review','licensed','2026-09-01','building-exterior','https://upload.wikimedia.org/Wrong.jpg');
      `);
      const visible = async () => (await db.query(sql, [['sg-singapore:project:a']])).rows.map(row => row.display_url);
      expect(await visible()).toEqual(['https://upload.wikimedia.org/Wrong.jpg']);
      await db.exec("UPDATE building_photos SET status='rejected',approved_at=NULL,approved_by=NULL,visual_reviewed_at=NULL");
      expect(await visible()).toEqual([]);
      await db.exec(`UPDATE building_photos SET asset_url='https://upload.wikimedia.org/Correct.jpg',status='approved',
        approved_at='2026-09-09',approved_by='content-admin-visual-review',visual_reviewed_at='2026-09-09'`);
      expect(await visible()).toEqual([]);
      await db.exec("UPDATE media_assets SET approved_at='2026-09-09',source_url='https://commons.wikimedia.org/wiki/File:Correct.jpg'");
      expect(await visible()).toEqual([]);
      await db.exec("UPDATE public_entity_media SET published_at='2026-09-09',display_url='https://upload.wikimedia.org/Correct.jpg',last_checked_at='2026-09-09'");
      expect(await visible()).toEqual(['https://upload.wikimedia.org/Correct.jpg']);
    } finally { await db.close(); }
  }, 30_000);
});
