import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { neon } from '@neondatabase/serverless';
import { loadMigrationBundles } from './migration-files.mjs';

// A preview may inherit a production connection; builds must remain read-only.
// Operators can still migrate an isolated preview database with db:migrate.
if (process.argv.includes('--if-configured') && process.env.VERCEL_ENV === 'preview') {
  process.stdout.write('Preview build: automatic database migration skipped.\n');
  process.exit(0);
}

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString && process.argv.includes('--if-configured')) {
  process.stdout.write('DATABASE_URL is not configured; persistent-content migration skipped.\n');
  process.exit(0);
}
if (!connectionString) throw new Error('DATABASE_URL is required.');

const directory = join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations');
const migrations = await loadMigrationBundles(directory);
const sql = neon(connectionString);

await sql`
  CREATE TABLE IF NOT EXISTS signedprice_schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`;

for (const migration of migrations) {
  const [existing] = await sql`SELECT name FROM signedprice_schema_migrations WHERE name = ${migration.name}`;
  if (existing !== undefined) continue;
  await sql.transaction((transaction) => [
    ...migration.statements.map((statement) => transaction.query(statement)),
    transaction`INSERT INTO signedprice_schema_migrations (name) VALUES (${migration.name}) ON CONFLICT (name) DO NOTHING`,
  ]);
}

process.stdout.write(`Applied ${migrations.length} SignedPrice database migration file(s).\n`);
