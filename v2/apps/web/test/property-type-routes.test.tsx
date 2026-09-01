import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import sitemap from '../app/sitemap';
import PropertyTypePage, {
  generateMetadata,
  generateStaticParams,
} from '../app/kr/seoul/explore/[district]/[buildingId]/page';
import DistrictPage from '../app/kr/seoul/explore/[district]/page';
import {
  createPublicBuildingFixture,
  createPublicBuildingRecord,
  PUBLIC_BUILDING_FIXTURE_PERIOD,
} from './public-building-fixture';
import { createPublicAreaFixture } from './public-area-fixture';
import { listSignedPricePropertyTypeRoutes } from '../lib/seo/public-route-registry.server';

const values = [600, 500, 400, 300, 200, 100].map((value) => value * 1_000_000);

function recentContracts() {
  return values.map((depositWon, index) => ({
    filedMonth: `2026-${String(7 - index).padStart(2, '0')}`,
    areaSqm: 50,
    contractType: index < 3 ? 'new' : 'renewal',
    depositWon,
  }));
}

function record(propertyType: 'apartment' | 'officetel' | 'villa_multifamily') {
  const suffix = propertyType === 'villa_multifamily' ? 'villa' : propertyType;
  return createPublicBuildingRecord({
    buildingId: `gangnam-${suffix}-evidence`,
    name: `Gangnam ${suffix} evidence`,
    housingType: propertyType,
    recentContracts: recentContracts(),
  });
}

function useEvidence() {
  vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_BUILDING_FIXTURE_PERIOD);
  vi.stubEnv('SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT', JSON.stringify(
    createPublicBuildingFixture([
      record('apartment'),
      record('officetel'),
      record('villa_multifamily'),
    ]),
  ));
  vi.stubEnv('SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT', JSON.stringify(
    createPublicAreaFixture({ publishedMedians: { 'gangnam-gu': 500_000_000 } }),
  ));
}

afterEach(() => vi.unstubAllEnvs());

describe('district property-type SEO routes', () => {
  it('uses the installed signed artifact period for production static params when env data is absent', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', undefined);
    vi.stubEnv('SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT', undefined);

    const params = generateStaticParams();

    expect(params).toContainEqual({ district: 'gangnam-gu', buildingId: 'apartment' });
    expect(params).toContainEqual({ district: 'mapo-gu', buildingId: 'villa' });
  });

  it('generates only evidence-ready static params and self-canonical metadata', async () => {
    useEvidence();
    expect(generateStaticParams()).toEqual(expect.arrayContaining([
      { district: 'gangnam-gu', buildingId: 'apartment' },
      { district: 'gangnam-gu', buildingId: 'officetel' },
      { district: 'gangnam-gu', buildingId: 'villa' },
    ]));

    const metadata = await generateMetadata({
      params: Promise.resolve({ district: 'gangnam-gu', buildingId: 'apartment' }),
    });
    expect(metadata).toMatchObject({
      title: 'Gangnam-gu apartment jeonse evidence | signedprice',
      description: '6 retained recent contracts across 1 published Gangnam-gu apartment building, with MOLIT source and coverage limits shown.',
      robots: { index: true, follow: true },
      alternates: {
        canonical: 'https://www.signedprice.com/kr/seoul/explore/gangnam-gu/apartment/',
      },
    });
  });

  it('renders distinct evidence, coverage limits, JSON-LD and crawlable sibling links', async () => {
    useEvidence();
    const html = renderToStaticMarkup(await PropertyTypePage({
      params: Promise.resolve({ district: 'gangnam-gu', buildingId: 'apartment' }),
    }));

    expect(html).toContain('Gangnam-gu apartment jeonse evidence');
    expect(html).toContain('₩350,000,000');
    expect(html).toContain('6 retained recent contracts');
    expect(html).toContain('not the complete district/type contract history');
    expect(html).toContain('MOLIT');
    expect(html).toContain('2026-01/2026-07');
    expect(html).toContain('href="/kr/seoul/explore/gangnam-gu/gangnam-apartment-evidence/"');
    expect(html).toContain('href="/kr/seoul/explore/gangnam-gu/officetel/"');
    expect(html).toContain('href="/kr/seoul/explore/gangnam-gu/villa/"');
    expect(html).toContain('"@type":"Dataset"');
    expect(html).toContain('"@type":"BreadcrumbList"');
  });

  it('links publishable property types from their district parent and sitemap', async () => {
    useEvidence();
    expect(listSignedPricePropertyTypeRoutes().map((route) => ({
      path: route.path,
      legacySourcePath: route.legacySourcePath,
      cohort: route.cohort,
    }))).toEqual([
      {
        path: '/kr/seoul/explore/gangnam-gu/apartment/',
        legacySourcePath: '/rent/gangnam-gu/apartment/',
        cohort: 2,
      },
      {
        path: '/kr/seoul/explore/gangnam-gu/officetel/',
        legacySourcePath: '/rent/gangnam-gu/officetel/',
        cohort: 2,
      },
      {
        path: '/kr/seoul/explore/gangnam-gu/villa/',
        legacySourcePath: '/rent/gangnam-gu/villa/',
        cohort: 2,
      },
    ]);
    const districtHtml = renderToStaticMarkup(await DistrictPage({
      params: Promise.resolve({ district: 'gangnam-gu' }),
      searchParams: Promise.resolve({}),
    }));
    expect(districtHtml).toContain('href="/kr/seoul/explore/gangnam-gu/apartment/"');
    expect(districtHtml).toContain('href="/kr/seoul/explore/gangnam-gu/officetel/"');
    expect(districtHtml).toContain('href="/kr/seoul/explore/gangnam-gu/villa/"');

    const urls = sitemap().map(({ url }) => url);
    expect(urls).toEqual(expect.arrayContaining([
      'https://www.signedprice.com/kr/seoul/explore/gangnam-gu/apartment/',
      'https://www.signedprice.com/kr/seoul/explore/gangnam-gu/officetel/',
      'https://www.signedprice.com/kr/seoul/explore/gangnam-gu/villa/',
    ]));
  });

  it('returns the 404 boundary for unsupported or unpublished combinations', async () => {
    useEvidence();
    await expect(PropertyTypePage({
      params: Promise.resolve({ district: 'gangnam-gu', buildingId: 'studio' }),
    })).rejects.toThrow(/404/);
    await expect(generateMetadata({
      params: Promise.resolve({ district: 'jongno-gu', buildingId: 'apartment' }),
    })).rejects.toThrow(/404/);
  });
});
