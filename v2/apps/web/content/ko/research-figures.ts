import { RESEARCH_FIGURES } from '../en/research-figures';
import type { InfographicSpec } from '../../lib/infographics/infographic-types';

const copy: Readonly<Record<string, readonly [string, string, string, string, string, readonly string[]]>> = {
  'singapore-private-market-quarterly-brief': [
    '서로 다른 방향으로 움직인 싱가포르 콘도 가격',
    '2026년 2분기 URA 민간 비토지부 주택 가격지수 변동: CCR +1.8%, RCR −1.2%, OCR −0.1%. 각 막대는 0에서 시작합니다.',
    'URA, 2026년 2분기 부동산 통계, 4항(2026년 7월 24일)',
    '지역별 민간 비토지부 주택 가격지수이며, 개별 프로젝트 수익률이 아닙니다.',
    '2026년 1분기 대비 변동', ['CCR', 'RCR', 'OCR'],
  ],
  'read-singapore-private-transactions': [
    'S$2 million 주택 매수의 인지세 계산 예시',
    'BSD는 S$69,600입니다. 감면 없이 일반 외국인 개인 ABSD 세율 60%를 적용하면 ABSD는 S$1.2 million입니다. 인지세 합계 S$1,269,600은 매매대금에 추가됩니다.',
    'IRAS BSD 구간과 ABSD 세율표를 이용한 SignedPrice 계산, 2026년 9월 6일 확인',
    '예시 전용: 가격 S$2m, 시가는 이를 초과하지 않음, 외국인 개인, 감면 없음; 기타 비용 제외',
    '매수 시 추가 인지세', ['BSD', 'ABSD'],
  ],
  'wolse-vs-jeonse': [
    '자금비용에 따라 달라지는 임대차 비교',
    '연간 자금비용 4%를 적용하면 예시 전세의 월 비용은 KRW 1m, 월세는 약 KRW 1.067m입니다. 동일한 관리비는 제외했습니다.',
    'SignedPrice 계산 예시: 보증금 × 4% ÷ 12 + 월세',
    '실제 매물이 아닌 예시: A 보증금 KRW 300m/월세 0; B 보증금 KRW 50m/월세 KRW 900k; 관리비 동일',
    '월세와 보증금 자금비용 합계', ['조건 A · 전세', '조건 B · 월세'],
  ],
};
export const KOREAN_RESEARCH_FIGURES: Readonly<Record<string, InfographicSpec>> = Object.freeze(Object.fromEntries(
  Object.entries(RESEARCH_FIGURES).map(([slug, figure]) => {
    const [title, accessibleSummary, sourceLabel, sampleLabel, seriesLabel, datumLabels] = copy[slug]!;
    return [slug, { ...figure, id: `ko-${figure.id}`, locale: 'ko' as const, title, accessibleSummary, sourceLabel, sampleLabel,
      relatedHref: figure.relatedHref === '/news/policy/singapore-absd-policy-status/' ? '/ko/news/singapore-absd-policy-status/' : figure.relatedHref,
      series: figure.series.map(series => ({ ...series, label: seriesLabel, values: series.values.map((datum, index) => ({ ...datum, label: datumLabels[index]! })) })),
    }];
  }),
));
