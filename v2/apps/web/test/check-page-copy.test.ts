import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { metadata as singaporeEnglish } from '../app/(en)/sg/singapore/check/page';
import { metadata as singaporeKorean } from '../app/(ko)/ko/sg/singapore/check/page';
import { buildSingleQuoteCheckMetadata } from '../lib/single-quote-check/metadata.server';

afterEach(() => vi.unstubAllEnvs());

describe('Check page metadata matches the asking-price task', () => {
  it('localizes Singapore asking-price metadata without changing its canonical or index policy', () => {
    expect(singaporeEnglish).toMatchObject({
      title: 'Compare an asking price in Singapore | signedprice',
      description: 'Compare private-home sale prices, HDB resale prices or monthly rents with recent Singapore transactions.',
      alternates: { canonical: 'https://www.signedprice.com/sg/singapore/check/' },
      robots: { index: false, follow: false },
    });
    expect(singaporeKorean).toMatchObject({
      title: '싱가포르 매물 가격 비교 | signedprice',
      description: '민간주택 매매가격, HDB 재판매 가격이나 월세를 최근 싱가포르 실거래가와 비교하세요.',
      alternates: { canonical: 'https://www.signedprice.com/ko/sg/singapore/check/' },
      robots: { index: false, follow: false },
    });
  });

  it.each([
    ['en', 'Compare an asking price in Seoul | signedprice', 'Compare a Seoul asking sale price, jeonse deposit or monthly rent with similar reported transactions.'],
    ['ko', '서울 매물 가격 비교 | signedprice', '서울 매물의 매매가격·전세 보증금·월세를 조건이 비슷한 신고 거래와 비교하세요.'],
  ] as const)('keeps Seoul preview noindex while describing the asking-price task in %s', (locale, title, description) => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect(buildSingleQuoteCheckMetadata(locale)).toMatchObject({ title, description, robots: { index: false, follow: true } });
  });
});
