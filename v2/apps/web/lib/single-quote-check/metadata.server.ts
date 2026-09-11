import 'server-only';

import type { Metadata } from 'next';

import type { ProductLocale } from '../locale/product-copy';
import { indexableMetadata } from '../public-metadata';
import { contractCheckEvidenceRepositoriesFromEnvironment } from '../contract-check/evidence-repositories.server';

const copy = Object.freeze({
  en: Object.freeze({
    path: '/kr/seoul/check/' as const,
    title: 'Compare an asking price in Seoul | signedprice',
    description: 'Compare a Seoul asking sale price, jeonse deposit or monthly rent with similar reported transactions.',
    locale: 'en_US' as const,
    imagePath: '/og/en/' as const,
  }),
  ko: Object.freeze({
    path: '/ko/kr/seoul/check/' as const,
    title: '서울 매물 가격 비교 | signedprice',
    description: '서울 매물의 매매가격·전세 보증금·월세를 조건이 비슷한 신고 거래와 비교하세요.',
    locale: 'ko_KR' as const,
    imagePath: '/og/ko/' as const,
  }),
  'zh-CN': Object.freeze({
    path: '/zh-cn/kr/seoul/check/' as const,
    title: '首尔房屋报价比较 | signedprice',
    description: '将首尔买卖报价、全租保证金或月租与条件相近的申报成交比较。',
    locale: 'zh_CN' as const,
    imagePath: '/og/zh/' as const,
  }),
});

export function buildSingleQuoteCheckMetadata(locale: ProductLocale): Metadata {
  const metadata = indexableMetadata({
    ...copy[locale],
    languageAlternates: { en: '/kr/seoul/check/', 'zh-Hans': '/zh-cn/kr/seoul/check/', ko: '/ko/kr/seoul/check/' },
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
