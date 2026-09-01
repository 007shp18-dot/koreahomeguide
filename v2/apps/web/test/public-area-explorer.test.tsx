import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/kr/seoul/explore/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('next/script', () => ({
  default: ({ src }: Readonly<{ src: string }>) => createElement('script', { src }),
}));

import { AreaExplorer } from '../components/public-market/area-explorer';
import {
  buildPublicAreaExploreModel,
} from '../lib/public-market/area-route-model.server';
import {
  CITY_MEDIAN_SENTINEL,
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaFixture,
  createPublicAreaV2Fixture,
} from './public-area-fixture';
import { createPublicBuildingFixture } from './public-building-fixture';

const rankedFixture = () => createPublicAreaFixture({
  publishedMedians: {
    'jongno-gu': 500_000_000,
    'jung-gu': 100_000_000,
    'yongsan-gu': 100_000_000,
    'seongdong-gu': 300_000_000,
    'gwangjin-gu': 700_000_000,
    'dongdaemun-gu': 400_000_000,
    'jungnang-gu': 200_000_000,
  },
  withheldCounts: { 'seongbuk-gu': 1 },
});

function readyModel() {
  const model = buildPublicAreaExploreModel('gangnam-gu', {
    source: rankedFixture(),
    buildingSource: createPublicBuildingFixture(),
    period: PUBLIC_AREA_FIXTURE_PERIOD,
  });
  if (model.status !== 'ready') throw new Error('Fixture model must be ready.');
  return model;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('public Seoul area Explorer', () => {
  it('renders the complete map, legend, table, and allowed evidence in initial HTML', () => {
    const model = readyModel();
    const markup = renderToStaticMarkup(createElement(AreaExplorer, {
      model,
      naverMapClientId: 'test-naver-client',
    }));

    expect(markup).toContain('data-map-provider="naver"');
    expect(markup).toContain('ncpKeyId=test-naver-client');
    expect(markup).toContain('viewBox="0 0 720 560"');
    expect(markup).toContain('District median refundable jeonse deposit');
    expect(markup).toContain(PUBLIC_AREA_FIXTURE_PERIOD);
    expect(markup).toContain('MOLIT');
    expect(markup).toContain(
      'KOSTAT census boundaries via southkorea/seoul-maps (Apache-2.0)',
    );
    for (const district of model.districts) {
      expect(markup).toContain(district.nameEn);
      expect(markup).toContain(district.nameKo);
      expect(markup).toContain(district.sampleLabel);
      expect(markup).toContain(`href="${district.href.replace(/\/$/, '')}"`);
      if (district.medianLabel !== null) expect(markup).toContain(district.medianLabel);
    }
    expect((markup.match(/data-district-path=/g) ?? [])).toHaveLength(25);
    expect((markup.match(/data-district-row=/g) ?? [])).toHaveLength(25);
    expect(markup).toContain('data-map-bucket="0"');
    expect(markup).toContain('data-map-bucket="1"');
    expect(markup).toContain('data-map-bucket="2"');
    expect(markup).toContain('data-map-bucket="3"');
    expect(markup).toContain('data-map-bucket="4"');
    expect(markup).toContain('data-map-state="withheld"');
    expect(markup).toContain('Not published');
    expect(markup).toContain('Selected · Gangnam-gu');
    expect(markup).toContain('data-selected-evidence="gangnam-gu"');
    expect(markup).toContain('New/renewal split not available in this snapshot');
    expect(markup).toContain('href="/kr/seoul/explore/gangnam-gu"');
    expect(markup).toContain('Open Gangnam-gu evidence');
    expect(markup).toContain('Open Jongno-gu');
    expect(markup).toContain('href="/kr/seoul/rankings"');
    expect(markup).toContain('View district rankings');
    expect(markup).toContain('Evidence Tower');
    expect(markup).toContain('역삼동');
    expect(markup).not.toContain(`₩${CITY_MEDIAN_SENTINEL.toLocaleString('en-US')}`);
  });

  it('renders a money-free unavailable state without a P1 city fallback', () => {
    const model = buildPublicAreaExploreModel(undefined, {
      source: { invalid: true },
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    });
    const markup = renderToStaticMarkup(createElement(AreaExplorer, { model }));

    expect(markup).toContain('Verified district summary unavailable');
    expect(markup).toContain('data-map-state="unavailable"');
    expect(markup).toContain(PUBLIC_AREA_FIXTURE_PERIOD);
    expect(markup).toContain('MOLIT');
    expect(markup).toContain('href="/kr/seoul"');
    expect(markup).not.toContain(String(CITY_MEDIAN_SENTINEL));
    expect(markup).not.toMatch(/data-district-path|data-district-row|₩/);
  });

  it('wires the page to one district query and indexable canonical metadata', async () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT', JSON.stringify(createPublicAreaV2Fixture()));
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);
    vi.stubEnv('NAVER_MAP_CLIENT_ID', 'page-naver-client');
    const modulePath = '../app/kr/seoul/explore/page';
    const route = await import(/* @vite-ignore */ modulePath);
    const page = await route.default({
      searchParams: Promise.resolve({ district: 'mapo-gu', contract: 'new' }),
    });
    const markup = renderToStaticMarkup(page);

    expect(route.metadata).toEqual({
      title: 'Seoul district jeonse evidence | signedprice',
      description: 'Compare verified 45–55㎡ refundable jeonse deposits across Seoul districts.',
      robots: { index: true, follow: true },
      alternates: {
        canonical: 'https://www.signedprice.com/kr/seoul/explore/',
      },
    });
    expect(markup).toContain('Selected · Mapo-gu');
    expect(markup).toContain('New contracts');
    expect(markup).toContain('Contract type unknown · 1');
    expect(markup).toContain('ncpKeyId=page-naver-client');
    expect(markup).toContain('Korea public evidence. Publication limits shown.');
    expect(markup).not.toMatch(/public P2 preview|Production launch is not authorized/i);
    expect(markup).toContain('Neighborhoods &amp; buildings');
    expect(markup).toContain('Verified building artifact is not loaded.');
  });

  it('keeps the Modernist workspace responsive, focused, and touch-safe', () => {
    const css = readFileSync(
      new URL('../components/public-market/area-explorer.module.css', import.meta.url),
      'utf8',
    );

    expect(css).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)\s+460px/);
    expect(css).toMatch(/\.districtButton[\s\S]*min-height:\s*44px/);
    expect(css).toMatch(/\.detailLink[\s\S]*min-height:\s*44px/);
    expect(css).toMatch(/:focus-visible[\s\S]*outline:\s*2px solid var\(--area-accent\)[\s\S]*outline-offset:\s*2px/);
    expect(css).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(css).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*\.mapPath\s*\{[\s\S]*pointer-events:\s*none/);
    expect(css).toMatch(/\.legend[\s\S]*min-height:\s*88px/);
    expect(css).toMatch(/max-width:\s*100%/);
  });
});
