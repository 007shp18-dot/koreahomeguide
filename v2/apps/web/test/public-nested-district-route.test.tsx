import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import NestedDistrictPage, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from '../app/(en)/kr/seoul/explore/[district]/page';
import ThirdSegmentPage from '../app/(en)/[country]/[city]/[intent]/page';
import {
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaFixture,
} from './public-area-fixture';

afterEach(() => vi.unstubAllEnvs());

function installArtifact(): void {
  vi.stubEnv(
    'SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT',
    JSON.stringify(createPublicAreaFixture()),
  );
  vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);
}

describe('nested Seoul district route', () => {
  it('generates exactly the 25 canonical Explore district params', () => {
    expect(dynamicParams).toBe(false);
    expect(generateStaticParams()).toEqual(
      SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => ({ district: slug })),
    );
  });

  it('renders a reload-safe nested district page with indexable self-canonical metadata', async () => {
    installArtifact();
    const params = Promise.resolve({ district: 'gangnam-gu' });
    const metadata = await generateMetadata({ params });
    const page = await NestedDistrictPage({ params });
    const html = renderToStaticMarkup(page);

    expect(metadata).toMatchObject({
      title: 'Gangnam-gu sale evidence | signedprice',
      robots: { index: true, follow: true },
      alternates: {
        canonical: 'https://www.signedprice.com/kr/seoul/explore/gangnam-gu/',
      },
      openGraph: {
        url: 'https://www.signedprice.com/kr/seoul/explore/gangnam-gu/',
        locale: 'en_US',
        images: ['https://www.signedprice.com/og/en/'],
      },
      twitter: {
        card: 'summary_large_image',
        images: ['https://www.signedprice.com/og/en/'],
      },
    });
    expect(html).toContain('data-district-detail="published"');
    expect(html).toContain('Gangnam-gu');
    expect(html).toContain('href="/kr/seoul/explore?district=gangnam-gu"');
  });

  it('keeps the old district URL as a compatibility render', async () => {
    installArtifact();
    const page = await ThirdSegmentPage({
      params: Promise.resolve({ country: 'kr', city: 'seoul', intent: 'gangnam-gu' }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('data-district-detail="published"');
    expect(html).toContain('Gangnam-gu');
  });
});
