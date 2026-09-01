import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { ObservedBuildingDetail } from '../components/public-market/observed-building-detail';
import BuildingRoute, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from '../app/(en)/kr/seoul/explore/[district]/[buildingId]/page';
import { buildObservedBuildingIdentityModel } from '../lib/public-market/observed-building-route-model.server';
import {
  OBSERVED_BUILDING_FIXTURE_PERIOD,
  createObservedBuildingInventoryFixture,
} from './observed-building-fixture';

afterEach(() => vi.unstubAllEnvs());

function identityModel() {
  const model = buildObservedBuildingIdentityModel('jongno-gu', 'jongno-monthly-home', {
    source: createObservedBuildingInventoryFixture(),
    period: OBSERVED_BUILDING_FIXTURE_PERIOD,
  });
  if (model === null) throw new Error('Expected observed building identity model.');
  return model;
}

describe('observed building detail', () => {
  it('renders verified identity and observation counts without fabricating a price', () => {
    const html = renderToStaticMarkup(
      <ObservedBuildingDetail
        model={identityModel()}
        backHref="/kr/seoul/explore/?district=jongno-gu&contractType=monthly"
      />,
    );

    for (const value of [
      'Monthly Home', 'Jongno-gu', '사직동', 'officetel',
      '1 observed contract', 'Monthly rent', '2026-06',
      'MOLIT reported rent contracts', 'Price evidence unavailable',
      'Coordinate verification pending',
    ]) {
      expect(html).toContain(value);
    }
    expect(html).toContain('data-building-detail="identity-only"');
    expect(html).toContain('href="/kr/seoul/explore?district=jongno-gu&amp;contractType=monthly"');
    expect(html).toContain('href="/trust/"');
    expect(html).toContain('href="/kr/seoul/corrections/"');
    expect(html).not.toMatch(/₩|KRW|median|average price/i);
    expect(html).not.toContain('Check this contract');
    expect(html).not.toContain('role="tablist"');
  });

  it('resolves non-prerendered observed identities with noindex metadata', async () => {
    vi.stubEnv(
      'SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT',
      JSON.stringify(createObservedBuildingInventoryFixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', OBSERVED_BUILDING_FIXTURE_PERIOD);
    const params = Promise.resolve({
      district: 'jongno-gu', buildingId: 'jongno-monthly-home',
    });
    const searchParams = Promise.resolve({
      transaction: 'monthly',
      district: 'jongno-gu',
      neighborhood: 'sajik-dong',
      buildingId: 'jongno-monthly-home',
      contractType: 'all',
    });

    expect(dynamicParams).toBe(true);
    expect(generateStaticParams()).not.toContainEqual({
      district: 'jongno-gu', buildingId: 'jongno-monthly-home',
    });
    const metadata = await generateMetadata({ params, searchParams });
    expect(metadata).toMatchObject({
      title: 'Monthly Home observed building | signedprice',
      robots: { index: false, follow: true },
    });
    expect(metadata).not.toHaveProperty('alternates');

    const html = renderToStaticMarkup(await BuildingRoute({ params, searchParams }));
    expect(html).toContain('data-building-detail="identity-only"');
    expect(html).toContain('Monthly Home');
    expect(html).toContain(
      'href="/kr/seoul/explore?transaction=monthly&amp;district=jongno-gu&amp;neighborhood=sajik-dong&amp;buildingId=jongno-monthly-home&amp;contractType=all"',
    );
  });
});
