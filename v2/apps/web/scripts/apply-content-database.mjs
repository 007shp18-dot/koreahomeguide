import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) throw new Error('DATABASE_URL is required.');

const directory = join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations');
const files = (await readdir(directory)).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
const sql = neon(connectionString);

await sql`
  CREATE TABLE IF NOT EXISTS signedprice_schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`;

for (const file of files) {
  const [existing] = await sql`SELECT name FROM signedprice_schema_migrations WHERE name = ${file}`;
  if (existing !== undefined) continue;
  const source = await readFile(join(directory, file), 'utf8');
  const statements = source
    .split(/^\s*-- statement-breakpoint\s*$/mu)
    .map((statement) => statement.trim())
    .filter(Boolean);
  await sql.transaction((transaction) => [
    ...statements.map((statement) => transaction.query(statement)),
    transaction`INSERT INTO signedprice_schema_migrations (name) VALUES (${file})`,
  ]);
}

process.stdout.write(`Applied ${files.length} SignedPrice database migration file(s).\n`);

