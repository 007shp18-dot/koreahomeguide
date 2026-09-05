import { execFileSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

const databaseUrl = 'postgresql://neondb_owner@ep-rapid-grass-b34p9oiz.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

describe('SignedPrice isolated Neon branch connectivity', () => {
  it('accepts passwordless native Postgres wire connections from CI', () => {
    const result = execFileSync('psql', [databaseUrl, '-Atc', 'select current_database(), current_user'], {
      encoding: 'utf8',
      timeout: 30_000,
    }).trim();
    expect(result).toBe('neondb|neondb_owner');
  });
});
