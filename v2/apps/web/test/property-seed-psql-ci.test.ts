import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const enabled = process.env.GITHUB_ACTIONS === 'true'
  && process.env.GITHUB_REF_NAME === 'codex/signedprice-db-seed-run';

describe('SignedPrice property seed against isolated Neon branch', () => {
  const test = enabled ? it : it.skip;
  test('loads twice without changing IDs, counts or timestamps', () => {
    const output = execFileSync(process.execPath, ['apps/web/scripts/seed-property-psql-ci.mjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    });
    const report = JSON.parse(output.trim().split('\n').at(-1) ?? '{}') as {
      state?: string;
      source?: { total?: number; seoul?: number; singaporePrivate?: number; singaporeHdb?: number };
    };
    expect(report.state).toBe('verified');
    expect(report.source).toMatchObject({
      total: 62_872,
      seoul: 48_999,
      singaporePrivate: 3_862,
      singaporeHdb: 10_011,
    });
  }, 180_000);
});
