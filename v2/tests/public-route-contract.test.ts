import { describe, expect, it } from 'vitest';
import { publicRoutes } from './e2e/public-route-contract';
import { PUBLIC_AREA_TEST_DISTRICTS } from './e2e/public-area-summary-fixture';

describe('browser route coverage contract', () => {
  it('covers the literal mixed-indexing release surface exactly once', () => {
    const paths = publicRoutes.map((route) => route.path);

    expect(paths).toEqual([
      '/',
      '/trust/',
      '/kr/seoul/check/',
      '/kr/seoul/rent/',
      '/kr/seoul/tools/rent-check/',
      '/kr/seoul/buy/',
      '/kr/seoul/invest/',
      '/kr/seoul/explore/',
      '/kr/seoul/rankings/',
      '/kr/seoul/corrections/',
      '/sg/',
      '/sg/singapore/explore/',
      '/sg/singapore/explore/ccr/',
      '/sg/singapore/explore/rcr/',
      '/sg/singapore/explore/ocr/',
      '/sg/singapore/corrections/',
      '/kr/seoul/guide/',
      '/kr/seoul/guide/compare-two-contracts/',
      '/kr/seoul/guide/read-district-evidence/',
      '/kr/seoul/guide/understand-publication-limits/',
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
      ...PUBLIC_AREA_TEST_DISTRICTS.map(({ slug }) => `/kr/seoul/explore/${slug}/`),
      '/kr/seoul/explore/jongno-gu/synthetic-test-building/',
      '/compare/',
    ]);
    expect(paths).toHaveLength(72);
    expect(new Set(paths).size).toBe(72);
    expect(publicRoutes.find(({ path }) => path === '/kr/seoul/check/')).toMatchObject({
      heading: 'Which rent offer actually costs less?',
      indexing: 'index',
      canonical: '/kr/seoul/check/',
    });
    expect(publicRoutes.find(({ path }) => path === '/sg/')).toMatchObject({
      indexing: 'noindex',
    });
    expect(publicRoutes.find(({ path }) => path === '/kr/seoul/gangnam-gu/'))
      .toMatchObject({
        indexing: 'noindex',
        canonical: '/kr/seoul/explore/gangnam-gu/',
      });
  });
});
