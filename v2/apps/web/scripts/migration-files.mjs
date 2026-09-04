import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export function splitMigrationStatements(source) {
  return source
    .split(/^\s*-- statement-breakpoint\s*$/mu)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

export async function loadMigrationBundles(directory) {
  const files = (await readdir(directory)).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
  return Promise.all(files.map(async (name) => Object.freeze({
    name,
    statements: Object.freeze(splitMigrationStatements(await readFile(join(directory, name), 'utf8'))),
  })));
}

export function assertAdditiveMigration(bundle, { requiredTables, protectedTables }) {
  const createdTables = bundle.statements.flatMap((statement) => {
    const match = /^CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([a-z][a-z0-9_]*)/iu.exec(statement);
    return match?.[1] === undefined ? [] : [match[1]];
  });
  for (const table of requiredTables) {
    if (!createdTables.includes(table)) throw new Error(`${bundle.name} does not create ${table}`);
  }
  const source = bundle.statements.join('\n').toLocaleLowerCase('en-US');
  for (const table of protectedTables) {
    const destructive = new RegExp(`\\b(drop|truncate|alter)\\s+table(?:\\s+if\\s+exists)?\\s+${table}\\b`, 'u');
    if (destructive.test(source)) throw new Error(`${bundle.name} changes protected table ${table}`);
  }
  return Object.freeze({ createdTables: Object.freeze(createdTables) });
}
