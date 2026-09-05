import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { isPublicEntityProjectionRequestAuthorized } from '../app/api/internal/public-entity-projection/route';

describe('public entity projection route authorization', () => {
  it('accepts only the exact configured CRON bearer', () => {
    expect(isPublicEntityProjectionRequestAuthorized(
      new Request('https://signedprice.test/api/internal/public-entity-projection', {
        headers: { authorization: 'Bearer expected-secret' },
      }),
      'expected-secret',
    )).toBe(true);
    expect(isPublicEntityProjectionRequestAuthorized(
      new Request('https://signedprice.test/api/internal/public-entity-projection', {
        headers: { authorization: 'Bearer wrong-secret' },
      }),
      'expected-secret',
    )).toBe(false);
    expect(isPublicEntityProjectionRequestAuthorized(
      new Request('https://signedprice.test/api/internal/public-entity-projection'),
      '',
    )).toBe(false);
  });

  it('runs after the nightly building enrichment job', () => {
    const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as {
      crons?: readonly Readonly<{ path: string; schedule: string }>[];
    };
    expect(config.crons).toContainEqual({
      path: '/api/internal/public-entity-projection',
      schedule: '57 0 * * *',
    });
  });
});
