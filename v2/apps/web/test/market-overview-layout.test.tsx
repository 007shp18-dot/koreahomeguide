import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { MarketOverview } from '../components/market-ui/market-overview';
import { KoreanMarketOverview } from '../components/korean-market-overview';
import { SeoulOverview } from '../components/public-market/seoul-overview';
import { DubaiOverview } from '../components/dubai/dubai-overview';
import { SingaporeEntry } from '../components/singapore/singapore-entry';
import * as koreaRepositories from '../lib/public-market/korea-evidence-repositories.server';

afterEach(() => vi.restoreAllMocks());

describe('shared visitor market overview', () => {
  it('withholds supplied numbers when data is unavailable without hiding sources or Korean actions', () => {
    const html = renderToStaticMarkup(<MarketOverview locale="ko" city="서울" description="서울 거래" media={null} available={false}
      facts={[{ label: '매매', value: '123' }]} actions={[{ label: '실거래가 탐색', href: '/ko/kr/seoul/explore/', description: '단지별 거래' }]} notes="국토교통부" />);
    expect(html).not.toContain('123');
    expect(html).toContain('role="status"');
    expect(html).toContain('href="/ko/kr/seoul/explore"');
    expect(html).toContain('국토교통부');
  });

  it('limits headline facts to four and keeps their individual periods before actions and sources', () => {
    const html = renderToStaticMarkup(<MarketOverview locale="en" city="Seoul" description="Reported contracts" media={null} available
      facts={[{ label: 'Sale contracts', value: '123', detail: 'Jan–Mar 2026' }, { label: 'Rental contracts', value: '456', detail: 'Apr–Jun 2026' }, { label: 'Currency', value: 'KRW' }, { label: 'Districts', value: '25' }, { label: 'Hidden fifth', value: '999' }]}
      actions={[{ label: 'Explore reported prices', href: '/kr/seoul/explore/', description: 'Find a building' }]} notes="MOLIT source" ><section>Historical chart</section></MarketOverview>);
    expect(html.match(/<dt>/g)).toHaveLength(4);
    expect(html).not.toContain('999');
    expect(html).toMatch(/Sale contracts<\/dt><dd[^>]*>123[\s\S]*Jan–Mar 2026/);
    expect(html).toMatch(/Rental contracts<\/dt><dd[^>]*>456[\s\S]*Apr–Jun 2026/);
    expect(html.indexOf('Apr–Jun 2026')).toBeLessThan(html.indexOf('href="/kr/seoul/explore"'));
    expect(html.indexOf('Find a building')).toBeLessThan(html.indexOf('MOLIT source'));
    expect(html.indexOf('MOLIT source')).toBeLessThan(html.indexOf('Historical chart'));
  });

  it.each([['singapore', '/ko/sg/singapore', 'SGD'], ['dubai', '/ko/ae/dubai', 'AED']] as const)('keeps %s actions localized and currency beside its reporting period', (market, base, currency) => {
    const html = renderToStaticMarkup(<KoreanMarketOverview market={market} available facts={[{ label: '거래 통화', value: currency }]} period="2026-01–2026-06" />);
    expect(html).toContain('data-market-overview="true"');
    expect(html).toContain(`href="${base}/explore"`);
    expect(html).toContain(`href="${base}/check"`);
    expect(html).toContain(currency);
    expect(html).toContain('2026-01–2026-06');
    expect(html).not.toContain('현재 영어로 제공');
    expect(html).toContain('출처와 집계 범위');
    expect(html).toMatch(/<figcaption>[^<]*도시 참고 사진 · 해당 매물의 사진이 아닙니다<\/figcaption>/);
    expect(html).not.toContain('Editorial city photograph');
  });

  it('uses the common overview for Seoul while keeping sale and rental evidence separate', () => {
    const repositories = koreaRepositories.koreaEvidenceRepositoriesFromEnvironment({ useCheckedInSnapshot: true, retainLastVerified: false });
    vi.spyOn(koreaRepositories, 'koreaEvidenceRepositoriesFromEnvironment').mockReturnValue(repositories);
    const html = renderToStaticMarkup(<SeoulOverview />);
    expect(html).toContain('data-market-overview="true"');
    expect(html).toContain('Sale contracts');
    expect(html).toContain('Rental contracts');
    expect(html).toMatch(/Sale contracts<\/dt><dd[^>]*>74,188<small>2026-02–2026-08<\/small>/);
    expect(html).toMatch(/Rental contracts<\/dt><dd[^>]*>340,704<small>2026-02–2026-08<\/small>/);
    expect(html).toContain('https://rt.molit.go.kr/');
    expect(html).toContain('href="/kr/seoul/check"');
  });

  it('does not fabricate Seoul counts when neither repository is available', () => {
    vi.spyOn(koreaRepositories, 'koreaEvidenceRepositoriesFromEnvironment').mockReturnValue({ sale: null, rent: null });
    const html = renderToStaticMarkup(<SeoulOverview locale="ko" />);
    expect(html).toContain('role="status"');
    expect(html).not.toContain('<dt>');
    expect(html).toContain('href="/ko/kr/seoul/check"');
    expect(html).toContain('href="/ko/news?market=seoul&amp;type=analysis"');
    expect(html).toContain('<figcaption>도시 전경</figcaption>');
    expect(html).not.toContain('City view');
  });

  it('describes Singapore coverage without referring to absent headline figures', () => {
    const html = renderToStaticMarkup(<KoreanMarketOverview market="singapore" available={false} facts={[]} period="" />);
    expect(html).toContain('role="status"');
    expect(html).not.toContain('위 거래 건수와 단지 수');
    expect(html).toContain('URA 민간 주택 매매');
    expect(html).toContain('HDB 재판매와 임대 자료는 별도로 확인하세요');
  });

  it.each(['en', 'ko'] as const)('keeps the unavailable Singapore entry coverage truthful in %s', locale => {
    const html = renderToStaticMarkup(<SingaporeEntry locale={locale} model={{ status: 'unavailable', message: 'Verified Singapore evidence unavailable', correctionHref: '/sg/singapore/corrections/' }} />);
    expect(html).toContain('role="status"');
    expect(html).not.toContain('위 주요 수치');
    expect(html).not.toContain('Headline figures');
    expect(html).toContain('URA');
    expect(html).toContain('HDB');
    expect(html).toContain(locale === 'ko' ? '도시 참고 사진 · 해당 매물의 사진이 아닙니다' : 'Editorial city photograph · not this exact property');
  });

  it('keeps Dubai annual and quarterly figures below the common overview with their limitations', () => {
    const html = renderToStaticMarkup(<DubaiOverview />);
    expect(html).toContain('data-market-overview="true"');
    expect(html).toContain('annual rents and estimated gross yields');
    expect(html).toContain('Ready');
    expect(html).toContain('Off-Plan');
    expect(html).toContain('AED 761B');
    expect(html).toContain('AED 917B');
    expect(html).toContain('Q1 2026');
    expect(html).toContain('not residential sale-price indices');
    expect(html.indexOf('Sources and coverage')).toBeLessThan(html.indexOf('Annual transaction activity'));
  });
});
