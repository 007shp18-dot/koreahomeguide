import { describe, expect, it } from 'vitest';
import { publicRoutes } from './e2e/public-route-contract';

describe('browser route coverage contract', () => {
  it('covers the literal fifteen-route release surface exactly once', () => {
    const paths = publicRoutes.map((route) => route.path);

    expect(paths).toEqual([
      '/',
      '/kr/seoul/',
      '/sg/singapore/',
      '/ae/dubai/',
      '/kr/seoul/rent/',
      '/kr/seoul/tools/rent-check/',
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
    expect(paths).toHaveLength(15);
    expect(new Set(paths).size).toBe(15);
  });
});
