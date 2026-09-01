import type { SiteFooterModel, SiteHeaderModel } from '../site-copy';

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

export const KOREAN_SITE_HEADER = Object.freeze({
  brand: 'signedprice',
  homeLabel: 'signedprice 홈',
  navigationLabel: '서울 근거 탐색',
  links: [
    { label: '서울', href: '/ko/kr/seoul/' },
    { label: '계약 비교', href: '/ko/kr/seoul/check/' },
    { label: '구별 탐색', href: '/ko/kr/seoul/explore/' },
    { label: '근거 순위', href: '/ko/kr/seoul/rankings/' },
  ],
} as const satisfies SiteHeaderModel);

export const KOREAN_SITE_FOOTER = Object.freeze({
  brand: 'signedprice',
  descriptor: '국토교통부 신고 계약을 같은 기준으로 읽는 서울 주거 계약 근거.',
  navigationLabel: '하단 탐색',
  links: [
    { label: '서울 홈', href: '/ko/kr/seoul/' },
    { label: '계약 비교', href: '/ko/kr/seoul/check/' },
    { label: '구별 탐색', href: '/ko/kr/seoul/explore/' },
    { label: '영문 홈', href: '/' },
  ],
  status: '공식 신고 자료와 게시 기준을 함께 표시합니다.',
} as const satisfies SiteFooterModel);

export const KOREAN_ROUTE_COPY = Object.freeze({
  home: {
    eyebrow: '서울 · 신고 계약 근거',
    heading: '서울 주거 계약 근거',
    description: '신고된 계약의 기간, 표본 수, 게시 기준을 숨기지 않고 함께 보여줍니다.',
  },
  check: {
    eyebrow: '서울 · 계약 조건 비교',
    heading: '두 계약 조건 비교',
    description: '보증금과 월세가 다른 두 계약을 같은 월 비용 기준으로 비교합니다.',
  },
  explore: {
    eyebrow: '서울 · 구별 전세 근거',
    heading: '서울 25개 구 전세 근거',
    description: '45–55㎡ 신고 전세 계약을 같은 기준으로 비교합니다. 표본이 부족한 금액은 게시하지 않습니다.',
  },
  rankings: {
    eyebrow: '서울 · 구별 비교',
    heading: '서울 구별 근거 순위',
    description: '중앙값, 분포 폭, 표본 깊이를 신고 계약 근거 안에서만 비교합니다.',
  },
} as const);
