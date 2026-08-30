import { describe, expect, it } from 'vitest';
import { publicRoutes } from './e2e/public-route-contract';

describe('browser route coverage contract', () => {
  it('covers the literal Korea-only release surface exactly once', () => {
    const paths = publicRoutes.map((route) => route.path);

    expect(paths).toEqual([
      '/',
      '/kr/',
      '/kr/check/seoul/',
      '/kr/seoul/',
      '/kr/seoul/rent/',
      '/kr/seoul/tools/rent-check/',
      '/kr/seoul/buy/',
      '/kr/seoul/invest/',
      '/compare/',
    ]);
    expect(paths).toHaveLength(9);
    expect(new Set(paths).size).toBe(9);
  });
});
