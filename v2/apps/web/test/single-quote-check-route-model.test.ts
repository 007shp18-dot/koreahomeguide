import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

describe('single quote Check route model', () => {
  it('drops an unverified building id instead of resubmitting hidden stale context', async () => {
    const { buildSingleQuoteCheckRouteModel } = await import(
      '../lib/single-quote-check/route-model.server'
    );
    const model = buildSingleQuoteCheckRouteModel(
      Object.freeze({ sale: null, rent: null }),
      { check: '1', district: 'gangnam-gu', building: 'unknown-building' },
    );

    expect(model.selection.buildingId).toBeNull();
    expect(model.buildingName).toBeNull();
  });
});
