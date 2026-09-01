import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import ThirdSegmentPage, {
  generateMetadata,
  generateStaticParams,
} from '../app/[country]/[city]/[intent]/page';
import {
  publicThirdSegmentRouteParams,
  resolvePublicThirdSegment,
} from '../lib/public-market/public-third-segment.server';
import { publicIntentRouteParams } from '../lib/route-model';
import {
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaFixture,
} from './public-area-fixture';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('public third-segment resolver', () => {
  it('preserves the three public intents without claiming static or unknown segments', () => {
    for (const intent of ['rent', 'buy', 'invest']) {
      expect(resolvePublicThirdSegment('kr', 'seoul', intent)).toMatchObject({
        kind: 'intent',
        model: { marketId: 'kr-seoul' },
      });
    }

    for (const segment of ['explore', 'tools', 'unknown-gu']) {
      expect(resolvePublicThirdSegment('kr', 'seoul', segment)).toBeNull();
    }
    expect(resolvePublicThirdSegment('sg', 'singapore', 'gangnam-gu')).toBeNull();
    expect(resolvePublicThirdSegment('kr', 'busan', 'gangnam-gu')).toBeNull();
  });

  it('resolves exactly the canonical 25 Seoul districts', () => {
    for (const district of SEOUL_RENT_CHECK_DISTRICTS) {
      expect(resolvePublicThirdSegment('kr', 'seoul', district.slug)).toMatchObject({
        kind: 'district',
        model: { identity: district },
      });
    }
  });

  it('generates existing intent params plus 25 unique district params', () => {
    const districtParams = SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => ({
      country: 'kr',
      city: 'seoul',
      intent: slug,
    }));
    const expected = [...publicIntentRouteParams, ...districtParams];

    expect(publicThirdSegmentRouteParams).toEqual(expected);
    expect(generateStaticParams()).toEqual(expected);
    expect(new Set(expected.map((entry) => JSON.stringify(entry))).size).toBe(28);
  });
});

describe('public district route integration', () => {
  it('keeps the legacy district render noindex with the Explore canonical', async () => {
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT',
      JSON.stringify(createPublicAreaFixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);
    const params = Promise.resolve({
      country: 'kr', city: 'seoul', intent: 'gangnam-gu',
    });

    const metadata = await generateMetadata({ params });
    const page = await ThirdSegmentPage({ params });
    const html = renderToStaticMarkup(page);

    expect(metadata).toMatchObject({
      title: 'Gangnam-gu jeonse evidence | signedprice',
      robots: { index: false, follow: true },
      alternates: {
        canonical: 'https://www.signedprice.com/kr/seoul/explore/gangnam-gu/',
      },
    });
    expect(html).toContain('Gangnam-gu');
    expect(html).toContain('reported contracts');
    expect(html).toContain('data-district-detail="published"');
  });

  it('keeps withheld and unavailable district metadata money-free', async () => {
    const params = Promise.resolve({
      country: 'kr', city: 'seoul', intent: 'gangnam-gu',
    });
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT',
      JSON.stringify(createPublicAreaFixture({
        publishedMedians: { 'jongno-gu': 500_000_000 },
        withheldCounts: { 'gangnam-gu': 4 },
      })),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);

    const withheld = await generateMetadata({ params });
    expect(withheld).toMatchObject({
      description: '4 reported contracts met the fixed filter; monetary evidence is not published.',
      robots: { index: false, follow: true },
    });
    expect(withheld).not.toHaveProperty('alternates');
    expect(JSON.stringify(withheld)).not.toMatch(/₩|987654321|KRW\s*\d/i);

    vi.stubEnv('SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT', '{"invalid":true}');
    const unavailable = await generateMetadata({ params });
    expect(unavailable).toMatchObject({
      description: 'Verified district summary unavailable; no city figure is substituted.',
      robots: { index: false, follow: true },
    });
    expect(JSON.stringify(unavailable)).not.toMatch(/₩|987654321|KRW\s*\d/i);
  });

  it('keeps the existing intent branch intact', async () => {
    const page = await ThirdSegmentPage({
      params: Promise.resolve({ country: 'kr', city: 'seoul', intent: 'rent' }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('Rent in Seoul');
    expect(html).not.toContain('data-district-detail');
  });
});
