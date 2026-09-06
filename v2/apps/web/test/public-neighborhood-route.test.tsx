import type { Metadata } from 'next';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import NeighborhoodPage, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from '../app/(en)/kr/seoul/explore/[district]/neighborhood/[neighborhoodId]/page';

afterEach(() => vi.unstubAllEnvs());

describe('public Seoul neighborhood route', () => {
  it('pre-renders every published neighborhood with self-canonical metadata and building links', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(dynamicParams).toBe(false);
    expect(generateStaticParams()).toHaveLength(379);
    expect(generateStaticParams()).toContainEqual({
      district: 'gangnam-gu',
      neighborhoodId: 'gangnam-gu-dong-1g2fbdb',
    });

    const params = Promise.resolve({
      district: 'gangnam-gu',
      neighborhoodId: 'gangnam-gu-dong-1g2fbdb',
    });
    const metadata: Metadata = await generateMetadata({ params });
    const html = renderToStaticMarkup(await NeighborhoodPage({ params }));

    expect(metadata).toMatchObject({
      title: '역삼동 property prices in Gangnam-gu | signedprice',
      robots: { index: true, follow: true },
      alternates: {
        canonical: 'https://www.signedprice.com/kr/seoul/explore/gangnam-gu/neighborhood/gangnam-gu-dong-1g2fbdb/',
      },
      openGraph: {
        url: 'https://www.signedprice.com/kr/seoul/explore/gangnam-gu/neighborhood/gangnam-gu-dong-1g2fbdb/',
        locale: 'en_US',
      },
    });
    expect(metadata.description).toContain('133 published buildings');
    expect(html).toContain('<span lang="ko">역삼동</span> reported property prices');
    expect(html).toContain('133 buildings meet the current evidence publication threshold.');
    expect(html).toContain('href="/kr/seoul/explore/gangnam-gu/gangnam-gu-1lf81kj"');
    expect(html).toContain('역삼역센트럴푸르지오시티');
    expect(html).toContain('836 contracts');
    expect(html).toContain('href="/kr/seoul/explore/gangnam-gu"');
  }, 20_000);

  it('returns a search-safe 404 for an unknown district', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    await expect(generateMetadata({
      params: Promise.resolve({
        district: 'unknown-district',
        neighborhoodId: 'gangnam-gu-dong-1g2fbdb',
      }),
    })).rejects.toMatchObject({ digest: 'NEXT_HTTP_ERROR_FALLBACK;404' });
  });

  it('returns a search-safe 404 when a real neighborhood belongs to another district', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    await expect(generateMetadata({
      params: Promise.resolve({
        district: 'songpa-gu',
        neighborhoodId: 'gangnam-gu-dong-1g2fbdb',
      }),
    })).rejects.toMatchObject({ digest: 'NEXT_HTTP_ERROR_FALLBACK;404' });
  });
});
