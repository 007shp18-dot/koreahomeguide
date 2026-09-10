import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL('../db/migrations/0011_market_data_refresh.sql', import.meta.url),
  'utf8',
);

describe('market data refresh migration', () => {
  it('creates durable run history and expiring job leases', () => {
    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS market_data_refresh_runs/i);
    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS market_data_refresh_leases/i);
    expect(migration).toMatch(/CHECK \(state IN \('running', 'succeeded', 'failed', 'skipped'\)\)/i);
    expect(migration).toMatch(/expires_at timestamptz NOT NULL/i);
  });

  it('registers internal rights boundaries without opening Dubai publication', () => {
    expect(migration).toContain('sg-ura-private-rent-v1');
    expect(migration).toContain('ae-dubai-pulse-open-data-v1');
    expect(migration).toMatch(/true, true, true, false, true, true, false/i);
  });
});
