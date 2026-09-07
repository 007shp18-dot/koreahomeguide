import type { SiteFooterModel, SiteHeaderModel } from '../site-copy';
import { resolveMarketNavigation, type ProductSurface } from '../navigation/market-route-resolver';

const integer = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });

export function formatKrwKo(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError('Korean won display requires a non-negative safe integer.');
  }
  const eok = Math.floor(value / 100_000_000);
  const afterEok = value % 100_000_000;
  const man = Math.floor(afterEok / 10_000);
  const won = afterEok % 10_000;
  if (eok > 0 && man === 0 && won === 0) return `${eok}.0억`;
  const parts: string[] = [];
  if (eok > 0) parts.push(`${integer.format(eok)}억`);
  if (man > 0) parts.push(`${integer.format(man)}만${won === 0 ? '원' : ''}`);
  if (won > 0 || parts.length === 0) parts.push(`${integer.format(won)}원`);
  return parts.join(' ');
}

const KOREAN_SITE_HEADER_BASE = {
  brand: 'signedprice',
  homeLabel: 'signedprice 홈',
  homeHref: '/ko/',
  navigationLabel: '서울 실거래가 메뉴',
  navigationVariant: 'supplied',
  marketLabel: '서울',
  languageLabel: 'KO',
} as const;

export function buildKoreanSiteHeader(englishHref: string): SiteHeaderModel {
  const surface: ProductSurface = englishHref.includes('/check/') ? 'check'
    : englishHref.includes('/explore/') ? 'explore'
      : englishHref.includes('/rankings/') ? 'rankings'
        : 'home';
  return Object.freeze({
    ...KOREAN_SITE_HEADER_BASE,
    links: resolveMarketNavigation({ market: 'seoul', locale: 'ko', surface }).links,
    languageSwitch: Object.freeze({
      label: 'EN',
      href: englishHref,
      hrefLang: 'en',
    }),
  });
}

export const KOREAN_SITE_HEADER = buildKoreanSiteHeader('/kr/seoul/');

export const KOREAN_SITE_FOOTER = Object.freeze({
  brand: 'signedprice',
  descriptor: '국토교통부 실거래 자료로 살펴보는 서울 집값.',
  navigationLabel: '하단 탐색',
  links: [
    { label: '서울 홈', href: '/ko/kr/seoul/' },
    { label: '구별 탐색', href: '/ko/kr/seoul/explore/' },
    { label: '영문 홈', href: '/' },
  ],
  status: '공식 신고 자료와 게시 기준을 함께 표시합니다.',
} as const satisfies SiteFooterModel);

export const KOREAN_ROUTE_COPY = Object.freeze({
  home: {
    eyebrow: '서울 · 실거래가',
    heading: '서울 실거래가',
    description: '거래 가격과 함께 계약 기간, 거래 건수, 집계 기준을 확인할 수 있습니다.',
  },
  check: {
    eyebrow: '서울 · 계약 조건 비교',
    heading: '두 계약 조건 비교',
    description: '보증금과 월세가 다른 두 계약을 같은 월 비용 기준으로 비교합니다.',
  },
  explore: {
    eyebrow: '서울 · 구별 전세 실거래가',
    heading: '서울 25개 구 전세 실거래가',
    description: '45–55㎡ 신고 전세 계약을 같은 기준으로 비교합니다. 거래가 적어 비교하기 어려운 경우에는 가격을 표시하지 않습니다.',
  },
  rankings: {
    eyebrow: '서울 · 구별 비교',
    heading: '서울 구별 실거래가 비교',
    description: '신고된 거래의 중간 가격(중앙값), 가격대, 거래 건수를 비교합니다.',
  },
} as const);
