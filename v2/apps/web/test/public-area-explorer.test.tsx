import { readFileSync } from 'node:fs';
import { Children, createElement, isValidElement } from 'react';
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

import {
  AreaExplorer,
  createExploreBuildingSelectionHref,
} from '../components/public-market/area-explorer';
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
import { createObservedBuildingInventoryFixture } from './observed-building-fixture';

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
  it('renders one mockup-first map and discovery workspace', () => {
    const markup = renderToStaticMarkup(createElement(AreaExplorer, {
      model: readyModel(),
      naverMapClientId: 'test-naver-client',
    }));

    expect(markup).toContain('data-explorer-version="mockup-parity"');
    expect(markup).toContain('data-explorer-layout="mockup-workspace"');
    expect(markup).toContain('data-explorer-region="filters"');
    expect(markup).toContain('data-explorer-region="results"');
    expect(markup).toContain('data-explorer-region="map"');
    expect(markup).not.toContain('aria-label="Explorer view"');
    expect(markup.indexOf('data-explorer-region="filters"'))
      .toBeLessThan(markup.indexOf('data-explorer-region="map"'));
    expect(markup.indexOf('data-explorer-region="map"'))
      .toBeLessThan(markup.indexOf('data-explorer-region="results"'));
  });

  it.each(['split', 'list', 'table', 'map'] as const)(
    'normalizes the legacy %s view to the same map workspace',
    (view) => {
      const markup = renderToStaticMarkup(createElement(AreaExplorer, {
        model: readyModel(),
        initialSelection: { market: 'kr', transaction: 'jeonse', view },
      }));

      expect(markup).toContain('data-explore-view="mockup-workspace"');
      expect(markup).toContain('data-explorer-layout="mockup-workspace"');
      expect(markup).not.toContain('aria-label="Explorer view"');
    },
  );

  it('restores a valid URL-selected building in a modal with a canonical detail action', () => {
    const markup = renderToStaticMarkup(createElement(AreaExplorer, {
      model: readyModel(),
      naverMapClientId: 'test-naver-client',
      initialSelection: {
        market: 'kr',
        transaction: 'jeonse',
        district: 'gangnam-gu',
        neighborhood: 'yeoksam-dong',
        buildingId: 'gangnam-evidence-tower',
      },
    }));

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain('data-building-dialog="gangnam-evidence-tower"');
    expect(markup).toContain('data-building-panel="gangnam-evidence-tower"');
    expect(markup).toContain('data-building-media="naver-panorama"');
    expect(markup).toContain('Open full building evidence');
  });

  it('emits the same literal Explore URL for a building selected by list or marker', () => {
    const model = readyModel();
    const building = model.buildingAvailability.status === 'ready'
      ? model.buildingAvailability.buildings[0]
      : model.buildingAvailability.fallbackBuildings[0];
    if (building === undefined) throw new Error('Fixture building must exist.');

    expect(createExploreBuildingSelectionHref(
      building,
      { market: 'kr', transaction: 'jeonse', district: 'gangnam-gu' },
      'en',
    )).toBe(
      '/kr/seoul/explore/?district=gangnam-gu&neighborhood=yeoksam-dong&buildingId=gangnam-evidence-tower',
    );
  });

  it('keeps query and building page in a selected-building Explore URL', () => {
    const model = readyModel();
    const building = model.buildingAvailability.status === 'ready'
      ? model.buildingAvailability.buildings[0]
      : model.buildingAvailability.fallbackBuildings[0];
    if (building === undefined) throw new Error('Fixture building must exist.');

    expect(createExploreBuildingSelectionHref(
      building,
      { market: 'kr', transaction: 'jeonse', district: 'gangnam-gu' },
      'en',
      { query: 'Evidence Tower', buildingPage: 3 },
    )).toBe(
      '/kr/seoul/explore/?district=gangnam-gu&neighborhood=yeoksam-dong&buildingId=gangnam-evidence-tower&q=Evidence+Tower&buildingPage=3',
    );
  });

  it('remounts client-owned filters when same-route district or query props change', () => {
    const clientStateKey = (
      initialQuery: string,
      initialSelection: NonNullable<Parameters<typeof AreaExplorer>[0]['initialSelection']>
        = { market: 'kr', transaction: 'jeonse' },
    ): string | null => {
      const element = AreaExplorer({ model: readyModel(), initialQuery, initialSelection });
      if (!isValidElement<{ children: unknown }>(element)) {
        throw new Error('Expected AreaExplorer to return an element.');
      }
      const child = Children.only(element.props.children);
      if (!isValidElement(child)) throw new Error('Expected ready Explorer child.');
      return child.key;
    };

    expect(clientStateKey('Evidence Tower')).toBe(
      'gangnam-gu:Evidence Tower:jeonse:legacy-45-55:all:new:0:split:none',
    );
    expect(clientStateKey('Apartment')).toBe(
      'gangnam-gu:Apartment:jeonse:legacy-45-55:all:new:0:split:none',
    );
    expect(clientStateKey('Evidence Tower')).not.toBe(clientStateKey('Apartment'));
    expect(clientStateKey('', {
      market: 'kr',
      transaction: 'jeonse',
      district: 'gangnam-gu',
      neighborhood: 'yeoksam-dong',
      buildingId: 'gangnam-evidence-tower',
    })).toContain(':split:gangnam-evidence-tower');
  });

  it('provides a real retained-building text filter in the evidence rail', () => {
    const markup = renderToStaticMarkup(createElement(AreaExplorer, {
      model: readyModel(),
      naverMapClientId: 'test-naver-client',
    }));

    expect(markup).toContain('data-building-search="retained"');
    expect(markup).toContain('type="search"');
    expect(markup).toContain('name="building-query"');
    expect(markup).toContain('Search retained buildings');
    expect(markup).toContain('Search district, neighborhood, building or type');
    expect(markup).toContain('name="housing-type"');
    expect(markup).toContain('Search this area');
  });

  it('does not expose document-style view switching inside the map experience', () => {
    const markup = renderToStaticMarkup(createElement(AreaExplorer, {
      model: readyModel(),
      initialSelection: { market: 'kr', transaction: 'jeonse', view: 'table' },
    }));

    expect(markup).toContain('data-explore-view="mockup-workspace"');
    expect(markup).not.toContain('aria-label="Explorer view"');
    for (const view of ['Split', 'List', 'Table', 'Map']) expect(markup).not.toContain(`>${view}</a>`);
  });

  it('retains search, page, and neighborhood state inside the single workspace', () => {
    const base = readyModel();
    const buildings = base.buildingAvailability.status === 'ready'
      ? base.buildingAvailability.buildings
      : base.buildingAvailability.fallbackBuildings;
    const model = Object.freeze({
      ...base,
      buildingAvailability: Object.freeze({
        status: 'ready' as const,
        buildings,
        total: 150,
        page: 3,
        pageSize: 50,
      }),
    });
    const markup = renderToStaticMarkup(createElement(AreaExplorer, {
      model,
      initialQuery: 'Evidence Tower',
      initialSelection: {
        market: 'kr',
        transaction: 'jeonse',
        district: 'gangnam-gu',
        neighborhood: 'yeoksam-dong',
        view: 'table',
      },
    }));

    expect(markup).toMatch(/<button[^>]+aria-pressed="true"[^>]*>역삼동<\/button>/);
    expect(markup).toContain('value="Evidence Tower"');
    expect(markup).toContain('buildingPage=3');
  });

  it('uses one availability-safe transaction filter before the map workspace', () => {
    const markup = renderToStaticMarkup(createElement(AreaExplorer, {
      model: readyModel(),
      naverMapClientId: 'test-naver-client',
    }));

    expect(markup).not.toContain('data-transaction-tabs="true"');
    expect(markup).toContain('data-transaction-filter="verified-availability"');
    expect(markup.match(/data-transaction-mode=/g)).toHaveLength(3);
    expect(markup).toMatch(/<a[^>]+aria-current="page"[^>]+data-transaction-mode="jeonse"[^>]*>Jeonse<\/a>/);
    expect(markup).toMatch(/<span[^>]+aria-disabled="true"[^>]+data-transaction-mode="sale"[^>]*>Sale<\/span>/);
    expect(markup).toMatch(/<span[^>]+aria-disabled="true"[^>]+data-transaction-mode="monthly-rent"[^>]*>Monthly rent<\/span>/);
    expect(markup).not.toMatch(/data-transaction-mode="(?:sale|monthly-rent)"[^>]+(?:href|aria-current="page")/);
    expect(markup).toContain('name="evidence-area"');
    expect(markup).toContain('Price-ready');
    expect(markup.indexOf('class="_workspace_')).toBeLessThan(markup.indexOf('data-coverage-panel="verified"'));
  });

  it('renders the complete map, legend, table, and allowed evidence in initial HTML', () => {
    const model = readyModel();
    const markup = renderToStaticMarkup(createElement(AreaExplorer, {
      model,
      naverMapClientId: 'test-naver-client',
    }));

    expect(markup).toContain('data-map-provider="naver"');
    expect(markup).toContain('data-district-rail="all-25"');
    expect(markup.match(/data-district-option=/g)).toHaveLength(25);
    expect(markup).toContain('ncpKeyId=test-naver-client');
    expect(markup).toContain('viewBox="0 0 720 560"');
    expect(markup).toContain('District median refundable jeonse deposit');
    expect(markup).toContain('aria-label="Map legend"');
    expect(markup).toMatch(/· \d+ districts/);
    expect(markup).toContain(PUBLIC_AREA_FIXTURE_PERIOD);
    expect(markup).toContain('MOLIT');
    expect(markup).toContain(
      'KOSTAT census boundaries via southkorea/seoul-maps (Apache-2.0)',
    );
    for (const district of model.districts) {
      expect(markup).toContain(district.nameEn);
      expect(markup).toContain(district.nameKo);
      expect(markup).toContain(district.sampleLabel);
      expect(markup).toContain(`href="/kr/seoul/explore/${district.slug}"`);
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
    expect(markup).toContain('district=gangnam-gu');
    expect(markup).toContain('Open Gangnam-gu evidence');
    expect(markup).toContain('Open Jongno-gu');
    expect(markup).toContain('href="/kr/seoul/rankings"');
    expect(markup).toContain('View district rankings');
    expect(markup).toContain('Evidence Tower');
    expect(markup).toContain('역삼동');
    expect(markup).toContain('data-coverage-panel="verified"');
    expect(markup).toContain('7 of 25');
    expect(markup).toContain(
      'Observed inventory unavailable. Showing the verified price-ready fallback.',
    );
    expect(markup).toContain('104 eligible contracts');
    expect(markup).toContain('18 districts below publication minimum');
    expect(markup).toContain('Source candidate building counts are not retained');
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

  it('wires the page to server-owned search state and indexable canonical metadata', async () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT', JSON.stringify(createPublicAreaV2Fixture()));
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT',
      JSON.stringify(createPublicBuildingFixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);
    vi.stubEnv('NAVER_MAP_CLIENT_ID', 'page-naver-client');
    const modulePath = '../app/(en)/kr/seoul/explore/page';
    const route = await import(/* @vite-ignore */ modulePath);
    const page = await route.default({
      searchParams: Promise.resolve({
        contract: 'new',
        q: 'Evidence Tower',
      }),
    });
    const markup = renderToStaticMarkup(page);

    expect(route.metadata).toMatchObject({
      title: 'Seoul sale, jeonse and monthly-rent evidence | signedprice',
      description: 'Compare verified all-area sale, jeonse and monthly-rent evidence across Seoul districts.',
      robots: { index: true, follow: true },
      alternates: {
        canonical: 'https://www.signedprice.com/kr/seoul/explore/',
        languages: {
          en: 'https://www.signedprice.com/kr/seoul/explore/',
          ko: 'https://www.signedprice.com/ko/kr/seoul/explore/',
          'x-default': 'https://www.signedprice.com/kr/seoul/explore/',
        },
      },
    });
    expect(markup).toContain('Selected · Gangnam-gu');
    expect(markup).toContain('New contracts');
    expect(markup).toContain('Contract type unknown · 1');
    expect(markup).toContain('ncpKeyId=page-naver-client');
    expect(markup).toContain('value="Evidence Tower"');
    expect(markup).toContain('Korea public evidence. Publication limits shown.');
    expect(markup).not.toMatch(/public P2 preview|Production launch is not authorized/i);
    expect(markup).toContain('Neighborhoods &amp; buildings');
    expect(markup).toContain('Evidence Tower');
    expect(markup).not.toContain('Verified building artifact is not loaded.');
  });

  it('keeps a valid building selection after the Explore URL is server-rendered', async () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT', JSON.stringify(createPublicAreaV2Fixture()));
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT',
      JSON.stringify(createPublicBuildingFixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);
    const modulePath = '../app/(en)/kr/seoul/explore/page';
    const route = await import(/* @vite-ignore */ modulePath);
    const page = await route.default({
      searchParams: Promise.resolve({
        district: 'gangnam-gu',
        neighborhood: 'yeoksam-dong',
        buildingId: 'gangnam-evidence-tower',
      }),
    });
    const markup = renderToStaticMarkup(page);

    expect(markup).toContain('data-selected-building-card="gangnam-evidence-tower"');
    expect(markup).toContain('data-building-panel="gangnam-evidence-tower"');
  });

  it('normalizes the shared market selection before rendering Explore', async () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT', JSON.stringify(createPublicAreaV2Fixture()));
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT',
      JSON.stringify(createPublicBuildingFixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);
    const modulePath = '../app/(en)/kr/seoul/explore/page';
    const route = await import(/* @vite-ignore */ modulePath);
    const selected = await route.default({
      searchParams: Promise.resolve({
        transaction: 'jeonse',
        district: 'jongno-gu',
        contractType: 'renewal',
      }),
    });
    const selectedMarkup = renderToStaticMarkup(selected);
    const invalid = await route.default({
      searchParams: Promise.resolve({
        transaction: 'rent',
        district: 'jongno-gu',
      }),
    });
    const invalidMarkup = renderToStaticMarkup(invalid);

    expect(selectedMarkup).toContain('data-market-selection="kr:jeonse"');
    expect(selectedMarkup).toContain('Selected · Jongno-gu');
    expect(selectedMarkup).toContain('Renewal contracts');
    expect(selectedMarkup).toContain(
      'href="/kr/seoul/explore/jongno-gu?contractType=renewal"',
    );
    expect(invalidMarkup).toContain('data-market-selection="kr:jeonse"');
    expect(invalidMarkup).toContain('Selected · Jongno-gu');
  });

  it('separates observed discovery from transaction and price coverage', () => {
    const model = buildPublicAreaExploreModel('jongno-gu', {
      source: rankedFixture(),
      buildingSource: createPublicBuildingFixture(),
      observedBuildingSource: createObservedBuildingInventoryFixture(),
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    });
    const markup = renderToStaticMarkup(createElement(AreaExplorer, {
      model,
      naverMapClientId: 'test-naver-client',
      initialSelection: {
        market: 'kr', transaction: 'monthly', contractType: 'all', district: 'jongno-gu',
      },
    }));

    expect(markup).toContain('data-building-inventory="observed"');
    expect(markup).toContain('Observed buildings');
    expect(markup).toContain('Transaction-covered');
    expect(markup).toContain('Price-ready');
    expect(markup).toContain('Monthly Home');
    expect(markup).toContain('Monthly observations · 1');
    expect(markup).toMatch(
      /data-building-evidence="unavailable"[^>]*>[\s\S]*?Monthly Home[\s\S]*?Price evidence unavailable/,
    );
    expect(markup).toContain(
      'href="/kr/seoul/explore/jongno-gu/jongno-monthly-home?transaction=monthly&amp;district=jongno-gu&amp;neighborhood=sajik-dong&amp;buildingId=jongno-monthly-home&amp;contractType=all"',
    );
  });

  it('loads Naver geocoding only for visible coordinate-pending buildings with a map client', () => {
    const model = buildPublicAreaExploreModel('jongno-gu', {
      source: rankedFixture(),
      buildingSource: createPublicBuildingFixture(),
      observedBuildingSource: createObservedBuildingInventoryFixture(),
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    });
    const initialSelection = {
      market: 'kr' as const,
      transaction: 'monthly' as const,
      contractType: 'all' as const,
      district: 'jongno-gu' as const,
    };
    const configured = renderToStaticMarkup(createElement(AreaExplorer, {
      model,
      naverMapClientId: 'test-naver-client',
      initialSelection,
    }));
    const unconfigured = renderToStaticMarkup(createElement(AreaExplorer, {
      model,
      naverMapClientId: null,
      initialSelection,
    }));

    expect(configured).toContain(
      'maps.js?ncpKeyId=test-naver-client&amp;submodules=geocoder',
    );
    expect(configured).toContain('Monthly Home');
    expect(unconfigured).not.toContain('maps.js?ncpKeyId=');
    expect(unconfigured).toContain('data-map-state="fallback"');
  });

  it('keeps the Modernist workspace responsive, focused, and touch-safe', () => {
    const css = readFileSync(
      new URL('../components/public-market/area-explorer.module.css', import.meta.url),
      'utf8',
    );

    expect(css).toMatch(/\.explorer\s*\{[\s\S]*?overflow-x:\s*clip/);
    expect(css).toMatch(/\.hero,[\s\S]*?\.workspace,[\s\S]*?\{[\s\S]*?width:\s*min\(calc\(100% - 32px\),\s*1680px\)/);
    expect(css).toMatch(/\.workspace\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*65fr\)\s+minmax\(340px,\s*35fr\)/);
    expect(css).toMatch(/\.transactionFilter[\s\S]*border:\s*var\(--rule-default\)/);
    expect(css).toMatch(/\.districtRail[\s\S]*overflow-y:\s*auto/);
    expect(css).toMatch(/\.districtButton[\s\S]*min-height:\s*44px/);
    expect(css).toMatch(/\.detailLink[\s\S]*min-height:\s*44px/);
    expect(css).toMatch(/:focus-visible[\s\S]*outline:\s*2px solid var\(--area-accent\)[\s\S]*outline-offset:\s*2px/);
    expect(css).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*\.discoveryRail\s*\{[\s\S]*position:\s*absolute[\s\S]*bottom:\s*0[\s\S]*max-height:\s*64dvh[\s\S]*overflow-y:\s*auto/);
    expect(css).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*\.tableWrap[\s\S]*overflow-x:\s*auto/);
    expect(css).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*\.mapPath\s*\{[\s\S]*pointer-events:\s*none/);
    expect(css).toMatch(/\.legend[\s\S]*min-height:\s*88px/);
    expect(css).toMatch(/max-width:\s*100%/);
  });
});
