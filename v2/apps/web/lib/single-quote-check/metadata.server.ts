import 'server-only';

import type { Metadata } from 'next';

import type { ProductLocale } from '../locale/product-copy';
import { indexableMetadata } from '../public-metadata';
import { contractCheckEvidenceRepositoriesFromEnvironment } from '../contract-check/evidence-repositories.server';

const copy = Object.freeze({
  en: Object.freeze({
    path: '/kr/seoul/check/' as const,
    title: 'Check a Seoul sale, jeonse or rent quote | signedprice',
    description: 'Compare one Seoul sale, jeonse or monthly-rent asking quote with compatible official reported transaction evidence.',
    locale: 'en_US' as const,
    imagePath: '/og/en/' as const,
  }),
  ko: Object.freeze({
    path: '/ko/kr/seoul/check/' as const,
    title: '서울 매매·전세·월세 실거래가 비교 | signedprice',
    description: '서울 매물의 매매가격·전세 보증금·월세를 조건이 맞는 공식 신고 거래와 비교해 제시가격을 확인합니다.',
    locale: 'ko_KR' as const,
    imagePath: '/og/ko/' as const,
  }),
});

export function buildSingleQuoteCheckMetadata(locale: ProductLocale): Metadata {
  const metadata = indexableMetadata({
    ...copy[locale],
    languageAlternates: { en: '/kr/seoul/check/', ko: '/ko/kr/seoul/check/' },
  });
  const repositories = contractCheckEvidenceRepositoriesFromEnvironment();
  if (
    process.env.VERCEL_ENV !== 'preview'
    && (repositories.rent !== null || repositories.sale !== null)
  ) return metadata;
  return {
    ...metadata,
    robots: { index: false, follow: true },
    alternates: undefined,
  };
}
