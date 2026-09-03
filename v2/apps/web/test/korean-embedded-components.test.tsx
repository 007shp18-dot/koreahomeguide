import type { KoreaConversionCurveProjection } from '@signedprice/korea-rent';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { ContractCheckWorkspace } from '../components/contract-check/contract-check-workspace';
import KoreanExplorePage from '../app/(ko)/ko/kr/seoul/explore/page';
import KoreanRankingsPage from '../app/(ko)/ko/kr/seoul/rankings/page';
import { AreaExplorer } from '../components/public-market/area-explorer';
import { DistrictRankings } from '../components/public-market/district-rankings';
import { SiteHeader } from '../components/site-header';
import { SiteFooter } from '../components/site-footer';
import type { ContractCheckRouteModel } from '../lib/contract-check/route-model.server';
import { KOREAN_SITE_FOOTER, KOREAN_SITE_HEADER } from '../lib/locale/ko';
import { buildPublicAreaExploreModel } from '../lib/public-market/area-route-model.server';
import { buildPublicAreaRankingsModel } from '../lib/public-market/rankings-route-model.server';
import {
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaV2Fixture,
} from './public-area-fixture';

const curves: readonly KoreaConversionCurveProjection[] = Object.freeze([
  Object.freeze({
    housingType: 'apartment',
    period: '2026-03/2026-08',
    generatedAt: '2026-08-31T00:00:00.000Z',
    anchors: Object.freeze([
      Object.freeze({ deposit: 30_000_000, annualRate: 0.0495, pairCount: 140 }),
      Object.freeze({ deposit: 500_000_000, annualRate: 0.0447, pairCount: 160 }),
    ]),
  }),
]);

const contractModel: ContractCheckRouteModel = Object.freeze({
  status: 'ready',
  curves,
  availability: Object.freeze({ sale: true, jeonse: true, monthly: true, conversion: true }),
  districts: Object.freeze([{ slug: 'gangnam-gu', nameEn: 'Gangnam-gu', nameKo: '강남구' }]),
  selection: Object.freeze({
    districtSlug: 'gangnam-gu', buildingId: null, housingType: 'apartment', areaSqm: 84,
    offers: Object.freeze({
      a: Object.freeze({ transaction: 'jeonse', salePriceWon: null, depositWon: null, monthlyRentWon: null }),
      b: Object.freeze({ transaction: 'monthly', salePriceWon: null, depositWon: null, monthlyRentWon: null }),
    }),
  }),
  submitted: false,
  offerChecks: null,
  comparison: null,
  buildingName: null,
  disclosure: Object.freeze({
    source: 'MOLIT reported rental contracts',
    basis: 'Matched contracts in the same building and filed area',
    periods: Object.freeze({
      sale: Object.freeze({
        period: '2026-02/2026-08', startMonth: '2026-02', endMonth: '2026-08',
        completedMonthCount: 7, maximumMonthCount: 12,
      }),
      rent: Object.freeze({
        period: '2026-02/2026-08', startMonth: '2026-02', endMonth: '2026-08',
        completedMonthCount: 7, maximumMonthCount: 12,
      }),
      conversion: '2026-03/2026-08',
    }),
    boundary: 'Rates are interpolated only within verified anchors.',
  }),
  secondaryCheckHref: '/kr/seoul/tools/rent-check/',
  navigation: Object.freeze([
    Object.freeze({ label: 'Check', href: '/kr/seoul/check/', available: true }),
    Object.freeze({ label: 'Explore', href: '/kr/seoul/explore/', available: true }),
    Object.freeze({ label: 'Guide', href: '/kr/seoul/guide/', available: true }),
  ]),
});

afterEach(() => vi.unstubAllEnvs());

describe('Korean embedded product components', () => {
  it('keeps the Korean surface in the single header and exposes a crawlable English switch', () => {
    const html = renderToStaticMarkup(<>
      <SiteHeader copy={KOREAN_SITE_HEADER} />
      <SiteFooter copy={KOREAN_SITE_FOOTER} />
    </>);

    expect(html).toContain('data-navigation-tier="primary"');
    expect(html).not.toContain('data-navigation-tier="market"');
    expect(html).not.toContain('data-navigation-tier="product"');
    expect(html).toContain('href="/kr/seoul"');
    expect(html).toMatch(/hreflang="en"/i);
    expect(html).not.toContain('href="/ko/kr/seoul/check"');
    expect(html).not.toContain('>Briefs<');
  });

  it('switches Korean Explore and Rankings to their matching English routes', async () => {
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT',
      JSON.stringify(createPublicAreaV2Fixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);
    const explore = renderToStaticMarkup(await KoreanExplorePage({
      searchParams: Promise.resolve({}),
    }));
    const rankings = renderToStaticMarkup(await KoreanRankingsPage());

    expect(explore).toMatch(/hreflang="en"[^>]*href="\/kr\/seoul\/explore"/i);
    expect(rankings).toMatch(/hreflang="en"[^>]*href="\/kr\/seoul\/rankings"/i);
  });

  it('preserves Korean Explore URL selection and search state', async () => {
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT',
      JSON.stringify(createPublicAreaV2Fixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);
    const html = renderToStaticMarkup(await KoreanExplorePage({
      searchParams: Promise.resolve({
        district: 'jongno-gu',
        contractType: 'renewal',
        q: '강남구',
      }),
    }));

    expect(html).toContain('선택 · 강남구');
    expect(html).toContain('value="강남구"');
    expect(html).toContain('갱신 계약');
  });

  it('renders the interactive Contract Check workspace in Korean', () => {
    const html = renderToStaticMarkup(
      <ContractCheckWorkspace locale="ko" model={contractModel} />,
    );

    for (const visible of [
      '조건 A',
      '보증금',
      '월세',
      '주택 유형',
      '결과',
      '시장 근거',
      '두 조건 비교',
      '7개월 완료',
    ]) expect(html).toContain(visible);
    expect(html).toContain('href="/ko/kr/seoul/explore"');
    expect(html).not.toMatch(/Offer A|Monthly rent|Housing type|Evidence boundary|Reset/);
  });

  it('renders Explore, its district summary, tabs and source boundary in Korean', () => {
    const model = buildPublicAreaExploreModel('jung-gu', {
      source: createPublicAreaV2Fixture(),
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    }, 'new');
    const html = renderToStaticMarkup(
      <AreaExplorer locale="ko" model={model} naverMapClientId="test-client" />,
    );

    for (const visible of [
      '전세',
      '월세',
      '매매',
      '검증된 커버리지',
      '구 중앙값 전세보증금',
      '신규 계약',
      '표본',
      '출처와 한계',
      '좁은 중간 절반',
      '3개월 변화 확인 불가',
      '국토교통부 신고 임대차 계약',
      '서울 구별 전세보증금 지도',
    ]) expect(html).toContain(visible);
    expect(html).toContain('data-map-state="coordinate-pending"');
    expect(html).not.toContain('oapi.map.naver.com');
    expect(html).not.toContain('href="/ko/kr/seoul/rankings"');
    expect(html).toContain('data-explorer-layout="split"');
    expect(html).not.toMatch(
      /Verified coverage|District map|New contracts|Source and limits|Narrow middle-half|3-month change not assessable|Prior\/latest sample|reported rent contracts|Interactive NAVER map/,
    );
  });

  it('renders all ranking evidence panels and Korean district links in Korean', () => {
    const model = buildPublicAreaRankingsModel({
      source: createPublicAreaV2Fixture(),
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    });
    const html = renderToStaticMarkup(<DistrictRankings locale="ko" model={model} />);

    for (const visible of [
      '서울 구별 근거 순위',
      '신고 전세보증금 중앙값',
      '최근 비교',
      '중간 절반 분포 폭',
      '신고 계약 표본 수',
      '순위 해석의 한계',
      '2026년 1월',
      '최솟값',
    ]) expect(html).toContain(visible);
    expect(html).toContain('<strong>중구</strong><span lang="en">Jung-gu</span>');
    expect(html).toContain('href="/kr/seoul/explore/jung-gu"');
    expect(html).not.toMatch(
      /Seoul district rankings|Recent comparison|Evidence depth|Ranking limitations|Jan 2026|Minimum/,
    );
  });
});
