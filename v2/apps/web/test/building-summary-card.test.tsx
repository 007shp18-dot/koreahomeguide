import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { KoreaEvidenceBuildingDetail } from '../components/public-market/observed-building-detail';
import type { KoreaExplorerBuildingDetailModel } from '../lib/public-market/korea-explorer-evidence.server';

type Row = KoreaExplorerBuildingDetailModel['recentTransactions'][number];

const row = (month: string, price = 900_000_000, area = 84.88): Row => ({
  filedMonth: month, areaSqm: area, areaLabel: `${area}㎡`, transaction: 'sale',
  primaryWon: price, primaryLabel: `₩${price.toLocaleString('en')}`,
  filedDepositWon: null, filedDepositLabel: null, contractType: null, floor: 7, buildYear: 2012,
});

const model: KoreaExplorerBuildingDetailModel = {
  status: 'ready', period: '2026-06–2026-08', generatedAt: '2026-09-09T00:00:00Z',
  district: { slug: 'mapo-gu', nameEn: 'Mapo-gu', nameKo: '마포구' },
  building: { buildingId: 'summary-home', officialName: '요약아파트', neighborhoodId: 'mangwon-dong', neighborhoodName: '망원동', housingType: 'apartment' },
  selection: { transaction: 'sale', areaBand: '60-85', housingType: 'apartment', contractGroup: 'not-applicable' },
  evidence: { state: 'published', primaryMetric: 'sale-price', sampleLabel: '15 reported contracts', medianWon: 900_000_000,
    medianLabel: '₩900,000,000', middleHalfLabel: '₩880,000,000–₩920,000,000', rangeLabel: null,
    filedDepositMedianWon: null, filedDepositMedianLabel: null },
  recentTransactions: ['2026-06', '2026-07', '2026-08'].flatMap(month => Array.from({ length: 5 }, (_, i) => row(month, 880_000_000 + i * 10_000_000))),
};

function renderSummary(overrides: Partial<KoreaExplorerBuildingDetailModel> = {}) {
  const html = renderToStaticMarkup(<KoreaEvidenceBuildingDetail model={{ ...model, ...overrides }} backHref="/ko/kr/seoul/explore/?district=mapo-gu" locale="ko" />);
  return html.slice(html.indexOf('data-building-summary="true"'), html.indexOf('data-detail-order="media"'));
}

describe('building summary card', () => {
  it('leads with the published period median and keeps month precision without claiming a latest sale or record', () => {
    const html = renderSummary();
    expect(html).toContain('기간 매매가격 중앙값');
    expect(html).toContain('9억 원');
    expect(html).toContain('2026-06–2026-08');
    expect(html).toContain('최근 계약 월');
    expect(html).toContain('2026-08');
    expect(html).toContain('2012');
    expect(html).not.toMatch(/신고가|직전 거래 대비|최신 매매가|세대수|용적률|건폐율/);
  });

  it('only charts already reported contracts at one exact size with sufficient samples in each month', () => {
    const complete = renderSummary();
    expect(complete).toContain('data-building-summary-chart="reported-contracts"');
    expect(complete.match(/<circle /g)).toHaveLength(15);
    expect(complete).toContain('84.88㎡');
    expect(complete).not.toContain('<polyline');

    const mixedSizes = renderSummary({ recentTransactions: [...model.recentTransactions, row('2026-08', 950_000_000, 59.99)] });
    expect(mixedSizes).not.toContain('data-building-summary-chart');
    const insufficientMonth = renderSummary({ recentTransactions: model.recentTransactions.slice(1) });
    expect(insufficientMonth).not.toContain('data-building-summary-chart');
  });

  it('does not expose a price or chart for a withheld cohort, even when the model retains rows', () => {
    const html = renderSummary({ evidence: { ...model.evidence, state: 'withheld', medianWon: null, medianLabel: null, middleHalfLabel: null } });
    expect(html).toContain('가격 집계 없음');
    expect(html).not.toContain('9억 원');
    expect(html).not.toContain('data-building-summary-chart');
  });

  it('omits a disputed construction year and shows monthly rent with its separate deposit', () => {
    const disputed = renderSummary({ recentTransactions: [...model.recentTransactions, { ...row('2026-08'), buildYear: 2013 }] });
    expect(disputed).not.toContain('신고 건축연도');
    const monthly = renderSummary({
      selection: { ...model.selection, transaction: 'monthly', contractGroup: 'all' },
      evidence: { ...model.evidence, primaryMetric: 'monthly-rent', medianWon: 1_500_000, medianLabel: '₩1,500,000', filedDepositMedianWon: 100_000_000, filedDepositMedianLabel: '₩100,000,000' },
      recentTransactions: [],
    });
    expect(monthly).toContain('150만 원 /월');
    expect(monthly).toContain('보증금 중앙값');
    expect(monthly).toContain('1억 원');
  });
});
