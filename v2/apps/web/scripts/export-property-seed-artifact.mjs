import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { loadPropertySeedRows } from './property-seed-source.mjs';

const destination = resolve(process.cwd(), process.argv[2] ?? 'test-results/property-seed-export.json');
const seed = loadPropertySeedRows();
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, `${JSON.stringify({ summary: seed.summary, items: seed.all })}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ destination, ...seed.summary })}\n`);
