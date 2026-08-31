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
      '/kr/seoul/explore/',
      '/kr/seoul/rankings/',
      '/kr/seoul/jongno-gu/',
      '/kr/seoul/jung-gu/',
      '/kr/seoul/yongsan-gu/',
      '/kr/seoul/seongdong-gu/',
      '/kr/seoul/gwangjin-gu/',
      '/kr/seoul/dongdaemun-gu/',
      '/kr/seoul/jungnang-gu/',
      '/kr/seoul/seongbuk-gu/',
      '/kr/seoul/gangbuk-gu/',
      '/kr/seoul/dobong-gu/',
      '/kr/seoul/nowon-gu/',
      '/kr/seoul/eunpyeong-gu/',
      '/kr/seoul/seodaemun-gu/',
      '/kr/seoul/mapo-gu/',
      '/kr/seoul/yangcheon-gu/',
      '/kr/seoul/gangseo-gu/',
      '/kr/seoul/guro-gu/',
      '/kr/seoul/geumcheon-gu/',
      '/kr/seoul/yeongdeungpo-gu/',
      '/kr/seoul/dongjak-gu/',
      '/kr/seoul/gwanak-gu/',
      '/kr/seoul/seocho-gu/',
      '/kr/seoul/gangnam-gu/',
      '/kr/seoul/songpa-gu/',
      '/kr/seoul/gangdong-gu/',
      '/compare/',
    ]);
    expect(paths).toHaveLength(36);
    expect(new Set(paths).size).toBe(36);
  });
});
