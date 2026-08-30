import { describe, expect, it } from 'vitest';
import { publicRoutes } from './e2e/public-route-contract';

describe('browser route coverage contract', () => {
  it('covers the literal fourteen-route Phase 1 surface exactly once', () => {
    const paths = publicRoutes.map((route) => route.path);

    expect(paths).toEqual([
      '/',
      '/kr/seoul/',
      '/sg/singapore/',
      '/ae/dubai/',
      '/kr/seoul/rent/',
      '/kr/seoul/buy/',
      '/kr/seoul/invest/',
      '/sg/singapore/rent/',
      '/sg/singapore/buy/',
      '/sg/singapore/invest/',
      '/ae/dubai/rent/',
      '/ae/dubai/buy/',
      '/ae/dubai/invest/',
      '/compare/',
    ]);
    expect(paths).toHaveLength(14);
    expect(new Set(paths).size).toBe(14);
  });
});
