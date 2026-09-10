import 'server-only';

import type { Metadata } from 'next';

import type { ProductLocale } from '../locale/product-copy';
import { indexableMetadata } from '../public-metadata';
import { buildContractCheckRouteModel } from './route-model.server';

const copy = Object.freeze({
  en: Object.freeze({
    path: '/kr/seoul/check/compare/' as const,
    title: 'Compare Seoul sale, jeonse or rent offers | signedprice',
    description: 'Compare two Seoul offers independently as sale, jeonse or monthly rent against compatible reported evidence.',
    locale: 'en_US' as const,
    imagePath: '/og/en/' as const,
  }),
  ko: Object.freeze({
    path: '/ko/kr/seoul/check/compare/' as const,
    title: '전세·월세 조건 비교 | 서울 실거래 전환율 기준 | signedprice',
    description: '서울 전세·월세 조건 두 개를 공식 신고 거래와 검증된 전환율 근거로 비교합니다. 매매 조건 비교도 지원합니다.',
    locale: 'ko_KR' as const,
    imagePath: '/og/ko/' as const,
  }),
});

export function buildContractCheckMetadata(locale: ProductLocale): Metadata {
  const metadata = indexableMetadata({
    ...copy[locale],
    languageAlternates: {
      en: '/kr/seoul/check/compare/',
      ko: '/ko/kr/seoul/check/compare/',
    },
  });
  if (buildContractCheckRouteModel().status === 'ready') return metadata;
  return {
    ...metadata,
    robots: { index: false, follow: true },
    alternates: undefined,
  };
}
