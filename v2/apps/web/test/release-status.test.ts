import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../app/api/status/route';
import { buildReleaseStatus } from '../lib/release-status';

const expectedMarkets = [
  'kr-seoul',
  'sg-singapore',
  'ae-dubai',
] as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('release status', () => {
  it('returns the complete public readiness contract and nothing else', () => {
    const status = buildReleaseStatus({
      commit: 'abc123',
      environment: 'preview',
    });

    expect(status).toEqual({
      brand: 'signedprice',
      commit: 'abc123',
      environment: 'preview',
      markets: expectedMarkets,
      indexing: 'blocked',
    });
    expect(Object.keys(status)).toEqual([
      'brand',
      'commit',
      'environment',
      'markets',
      'indexing',
    ]);
  });

  it('normalizes valid public values and rejects unsafe values', () => {
    expect(
      buildReleaseStatus({
        commit: '  ABCDEF123456  ',
        environment: '  PREVIEW  ',
      }),
    ).toMatchObject({
      commit: 'abcdef123456',
      environment: 'preview',
    });

    expect(
      buildReleaseStatus({
        commit: 'deadbeef\npassword=public',
        environment: 'preview<script>',
      }),
    ).toMatchObject({
      commit: 'local',
      environment: 'local',
    });
  });

  it('defaults missing or non-string runtime values without reflecting them', () => {
    const status = buildReleaseStatus({
      commit: undefined,
      environment: null,
    });

    expect(status.commit).toBe('local');
    expect(status.environment).toBe('local');
    expect(JSON.stringify(status)).not.toMatch(/token|secret|password|apiKey/i);
  });
});

describe('GET /api/status', () => {
  it('reads only the two approved runtime fields', async () => {
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', '0123456789abcdef');
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('DATABASE_PASSWORD', 'must-not-escape');

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/^application\/json/);
    expect(await response.json()).toEqual({
      brand: 'signedprice',
      commit: '0123456789abcdef',
      environment: 'preview',
      markets: expectedMarkets,
      indexing: 'blocked',
    });
  });
});
