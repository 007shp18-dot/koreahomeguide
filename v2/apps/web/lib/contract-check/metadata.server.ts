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
    title: '서울 매매·전세·월세 조건 두 개 비교 | signedprice',
    description: '서울 조건 두 개를 매매·전세·월세 중에서 각각 선택해 조건이 맞는 신고 근거와 비교합니다.',
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
