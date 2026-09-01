import type { Metadata } from 'next';
import type { SiteFooterModel, SiteHeaderModel } from './site-copy';

/**
 * Korean copy for the Seoul Same Cash route.
 *
 * Copy lives in a model rather than in the component for the same reason the
 * homepage does: the shared chrome takes its strings as props, so a market
 * route can speak its own language without forking the components.
 *
 * Two rules are load-bearing here and must survive edits:
 *   - never claim an advertised number is wrong; the claim is that the basis
 *     differs. Both conditions are accurate as written.
 *   - compare a contract with a contract, never a contract with an asking price.
 */

export const sameCashMetadata = {
  title: '보증금 기준을 맞추고 비교하기 | signedprice',
  description:
    '보증금이 서로 다른 두 임대 조건은 월세만으로 비교할 수 없습니다. 국토교통부 신고 계약에서 실측한 전환율로 같은 기준에 놓고 다시 계산합니다.',
  robots: {
    // This route carries a working tool and measured figures, so it is the
    // first Seoul page worth indexing. The rest of the preview stays closed
    // until it has something to say.
    index: true,
    follow: true,
  },
} as const satisfies Metadata;

export const sameCashHeader = {
  brand: 'signedprice',
  homeLabel: 'signedprice 홈',
  navigationLabel: '주요 내비게이션',
  links: [
    { label: '글로벌 홈', href: '/' },
    { label: '서울', href: '/kr/seoul/' },
    { label: '같은 기준 비교', href: '/kr/seoul/same-cash/', isCurrent: true },
  ],
} as const satisfies SiteHeaderModel;

export const sameCashFooter = {
  brand: 'signedprice',
  descriptor: '서울·싱가포르·두바이의 부동산 정보.',
  navigationLabel: '푸터 내비게이션',
  links: [
    { label: '홈', href: '/' },
    { label: '서울', href: '/kr/seoul/' },
    { label: '시장 비교', href: '/compare/' },
  ],
  status:
    '시장 정보이며 매물·감정평가·법률 의견·투자 권유가 아닙니다. 담보·과세·보상·소송 목적으로 사용할 수 없습니다.',
} as const satisfies SiteFooterModel;

export const sameCashCopy = {
  hero: {
    eyebrow: '서울 · 국토교통부 신고 실거래',
    heading: '보증금이 다르면 월세는 비교가 안 됩니다.',
    description:
      '두 조건을 같은 보증금 기준으로 다시 쓰면 어느 쪽이 싼지가 바뀝니다. 신고된 임대 계약을 그렇게 다시 계산해 봤습니다.',
    facts: [
      { value: '72,291', label: '같은 기준으로 다시 계산한 계약 쌍' },
      { value: '29.4%', label: '싼 쪽과 비싼 쪽이 뒤바뀐 비율' },
      { value: '92만원', label: '뒤바뀐 경우의 월 차이 중앙값' },
    ],
  },
  tool: {
    sectionLabel: '보증금 기준 비교 도구',
    eyebrow: '직접 넣어 보세요',
    heading: '두 조건을 같은 보증금 위에 올려 놓습니다.',
    description:
      '보고 있는 두 조건의 보증금과 월세를 넣으면, 기준 보증금에서의 월 부담으로 다시 씁니다.',
    baseLabel: '기준 보증금 — 내가 넣을 수 있는 현금',
    assetTypeLabel: '주택 유형',
    assetTypeNote: '전환율이 유형별로 다릅니다',
    assetTypes: [
      { value: 'apartment', label: '아파트' },
      { value: 'officetel', label: '오피스텔' },
    ],
    depositLabel: '보증금',
    rentLabel: '월세',
    conditionALabel: '조건 A',
    conditionBLabel: '조건 B',
    cheaperBadge: '같은 기준으로는 이쪽이 쌉니다',
    writtenLabel: '적힌 대로',
    restatedLabel: '기준 보증금에서의 월 부담',
    sameBasisNote: '기준과 보증금이 같음',
    statWrittenLabel: '적힌 월세 차이',
    statRestatedLabel: '같은 기준 월 차이',
    noDifference: '차이 없음',
    incomplete: '두 조건의 보증금과 월세를 넣어 주세요.',
    reversedKicker: '순서가 뒤집혔습니다',
    settledKicker: '결론',
    reversedBody:
      '두 조건 모두 정확합니다. 보증금 기준이 서로 달랐을 뿐입니다. 신고된 계약 쌍에서도 29.4%가 이렇게 뒤집혔습니다.',
    sameOrderBody: '적힌 월세와 순서는 같습니다. 다만 차이의 크기가 달라졌습니다.',
    equalLine: '같은 보증금 기준으로 두 조건의 월 부담이 같습니다.',
    equalBody: '보증금 차이만큼이 월세 차이로 상쇄됩니다.',
    clampNote:
      '기준 보증금이 계약 보증금보다 훨씬 커서 환산 결과가 0원 아래로 내려갔습니다. 0원으로 표시했습니다 — 산수의 결과일 뿐, 그런 조건이 존재한다는 뜻이 아닙니다.',
  },
  why: {
    sectionLabel: '계산 근거',
    eyebrow: '왜 이런 일이 생기나',
    heading: '기준이 다르면 숫자는 비교 대상이 아닙니다.',
    paragraphs: [
      '보증금은 돌려받는 돈이고 월세는 나가는 돈입니다. 그래서 보증금을 더 넣으면 월세가 내려갑니다 — 두 조건이 서로 다른 보증금 위에 적혀 있으면, 적힌 월세끼리 비교하는 건 서로 다른 단위를 비교하는 것과 같습니다.',
      '적힌 숫자가 틀린 게 아닙니다. 두 조건 모두 정확합니다. 기준이 다를 뿐이고, 기준을 맞추는 순간 순서가 바뀔 수 있습니다.',
    ],
    curveHeading: '전환율은 가정이 아니라 실측값입니다',
    curveDescription:
      '같은 건물, 같은 전용면적, 보증금만 다른 신고 계약 쌍에서 각 쌍이 함의하는 전환율을 뽑고, 보증금 구간별 중앙값을 잡았습니다.',
    curveFindings: [
      '보증금이 커질수록 전환율은 내려갑니다. 하나의 고정 요율을 쓰면 양쪽 끝에서 모두 틀립니다.',
      '요율은 지역이 아니라 주택 유형을 따릅니다. 오피스텔 곡선을 아파트에 적용했더니 오차가 33.9%까지 벌어졌습니다.',
    ],
    curveRows: [
      { type: '아파트', low: '보증금 5,000만 → 연 4.81%', high: '보증금 5억 → 연 4.47%' },
      { type: '오피스텔', low: '보증금 3,000만 → 연 6.00%', high: '보증금 2억 → 연 4.80%' },
    ],
    curveFootnote:
      '요율은 계약에 적힌 보증금에서 읽습니다. 목표 보증금의 요율을 쓰면 실제로 일어나지 않은 거래에 요율을 적용하게 되기 때문입니다. 측정 구간 밖에서는 가장 가까운 값을 유지하고 연장하지 않습니다.',
  },
  limits: {
    sectionLabel: '한계',
    eyebrow: '이 숫자로 할 수 없는 것',
    heading: '추정이지 견적이 아닙니다.',
    items: [
      {
        term: '집주인마다 다릅니다',
        description:
          '실제 전환 요율은 개별 협의로 정해집니다. 여기 숫자는 신고된 계약들이 어떤 요율에서 전환됐는지를 보여줄 뿐입니다.',
      },
      {
        term: '계약과 계약을 비교합니다',
        description: '광고 호가와 비교하지 않습니다. 국토교통부에 신고된 실제 계약만 씁니다.',
      },
      {
        term: '보증금은 비용이 아닙니다',
        description:
          '계약 종료 시 반환되므로 묶이는 돈으로 다루었고, 월 부담에 넣지 않았습니다.',
      },
    ],
  },
} as const;
