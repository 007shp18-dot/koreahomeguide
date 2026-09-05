import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const webRoot = fileURLToPath(new URL('../', import.meta.url));
const databaseUrl = 'postgresql://neondb_owner@ep-rapid-grass-b34p9oiz.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

function run(script: string, ...args: string[]): string {
  return execFileSync(process.execPath, [script, ...args], {
    cwd: webRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });
}

describe('SignedPrice live property seed on isolated Neon branch', () => {
  it('seeds all stable IDs twice without drift and backfills Seoul search addresses', () => {
    const first = run('scripts/seed-property-database.mjs');
    const second = run('scripts/seed-property-database.mjs');
    const verified = run('scripts/seed-property-core.mjs', '--verify-only');

    for (const output of [first, second, verified]) {
      expect(output).toContain('"legacyCount":62872');
      expect(output).toContain('"entityCount":62872');
      expect(output).toContain('"legacyIdDigest":"d86ae08ab146e07570ccbd7b15f07a80f3ca5fd537d7199f58628348439e446a"');
      expect(output).toContain('"entityIdDigest":"92be10891460d8604c8b6661cd4884c3eaee9ce5791a14ec6c59a49a2d9e3729"');
    }
    expect(first).toContain('"seoul_with_address":48999');
    expect(second).toContain('"seoul_with_address":48999');
  }, 600_000);
});
