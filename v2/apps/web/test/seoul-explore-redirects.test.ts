import { describe, expect, it } from 'vitest';
import { getRedirectUrl, unstable_getResponseFromNextConfig } from 'next/experimental/testing/server';
import { SEOUL_RENT_CHECK_DISTRICTS } from '../../../packages/korea-rent/src/districts';
import config from '../next.config';

const origin = 'https://www.signedprice.com';
describe('retired Seoul district pages', () => {
  it('redirects all 25 districts and property types in every locale, preserving explicit filters', async () => {
    for (const prefix of ['', '/ko', '/zh-cn']) {
      for (const { slug } of SEOUL_RENT_CHECK_DISTRICTS) {
        for (const [suffix, propertyType] of [['', null], ['/villa', 'villa_multifamily'], ['/apartment', 'apartment'], ['/officetel', 'officetel']] as const) {
          const response = await unstable_getResponseFromNextConfig({ url: `${origin}${prefix}/kr/seoul/explore/${slug}${suffix}/?transaction=jeonse&area=60-85`, nextConfig: config });
          expect(response.status).toBe(308);
          const target = new URL(getRedirectUrl(response)!);
          expect(target.pathname).toBe(`${prefix}/kr/seoul/explore/`);
          expect(target.searchParams.get('district')).toBe(slug);
          expect(target.searchParams.get('propertyType')).toBe(propertyType);
          expect(target.searchParams.get('transaction')).toBe('jeonse');
          expect(target.searchParams.get('area')).toBe('60-85');
        }
      }
    }
  });
  it('preserves building details, neighbourhoods and the current explorer', async () => {
    for (const path of ['/kr/seoul/explore/', '/kr/seoul/explore/seongdong-gu/real-building/', '/ko/kr/seoul/explore/seongdong-gu/neighborhood/seongsu/', '/kr/seoul/explore/unknown-district/']) {
      const response = await unstable_getResponseFromNextConfig({ url: origin + path, nextConfig: config });
      expect(getRedirectUrl(response)).toBeNull();
    }
  });
});
