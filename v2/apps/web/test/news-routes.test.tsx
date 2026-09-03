import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const navigation = vi.hoisted(() => ({
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND'); }),
  redirect: vi.fn((href: string) => { throw new Error(`NEXT_REDIRECT:${href}`); }),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => navigation);

import LegacyNewsPage from '../app/(en)/kr/news/page';
import NewsIndexRoute, { metadata as indexMetadata } from '../app/(en)/kr/seoul/news/page';
import NewsDetailRoute, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from '../app/(en)/kr/seoul/news/[slug]/page';
import { buildNewsIndexModel } from '../lib/news/news-route-model.server';
import {
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaV2Fixture,
} from './public-area-fixture';

function installAreaArtifact(source: unknown = createPublicAreaV2Fixture()) {
  vi.stubEnv('SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT', JSON.stringify(source));
  vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('verified Seoul News routes', () => {
  it('renders an indexable server-first index with official sources and evidence lines', () => {
    installAreaArtifact();
    const html = renderToStaticMarkup(<NewsIndexRoute />);

    expect(indexMetadata).toMatchObject({
      robots: { index: true, follow: true },
      alternates: { canonical: 'https://www.signedprice.com/kr/seoul/news/' },
    });
    expect(html).toContain('>Market Briefs</h1>');
    expect(html).toContain('>Methodology</p>');
    expect(html).toContain('Human approval required before publication');
    expect(html).toContain('What the Seoul district snapshot covers');
    expect(html).toContain('How SignedPrice reads reported rental contracts');
    expect((html.match(/Our data:/g) ?? [])).toHaveLength(2);
    expect(html).toContain('25 Seoul districts are included');
    expect(html).toContain('data-news-evidence="verified"');
    expect(html).toContain('data-news-evidence="not-applicable"');
    expect(html).toContain('data-navigation-tier="primary"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('>Insights</a>');
    expect(html).toContain('href="/kr/seoul/check/">Contract Check</a>');
    expect(html).not.toMatch(/articleText|<iframe|dangerouslySetInnerHTML/);
  });

  it('fails closed on a missing artifact while preserving non-numeric methodology', () => {
    const model = buildNewsIndexModel({
      areaSource: { invalid: true },
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    });

    expect(model.records.map(({ slug }) => slug)).toEqual([
      'how-signedprice-reads-reported-rental-contracts',
    ]);
  });

  it('generates only evidence-ready params and renders canonical detail pages', async () => {
    installAreaArtifact();
    expect(dynamicParams).toBe(false);
    expect(generateStaticParams()).toEqual([
      { slug: 'what-the-seoul-district-snapshot-covers' },
      { slug: 'how-signedprice-reads-reported-rental-contracts' },
    ]);

    for (const slug of generateStaticParams().map((item) => item.slug)) {
      const params = Promise.resolve({ slug });
      const metadata = await generateMetadata({ params });
      const html = renderToStaticMarkup(await NewsDetailRoute({ params }));

      expect(metadata.robots).toEqual({ index: true, follow: true });
      expect(metadata.alternates).toEqual({
        canonical: `https://www.signedprice.com/kr/seoul/news/${slug}/`,
      });
      expect(html).toContain('Our data:');
      expect(html).toContain('Public Data Portal');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
      expect(html).toContain('href="/kr/seoul/corrections"');
      expect(html).toContain('href="/kr/seoul/check"');
      expect(html).toContain('application/ld+json');
      expect(html).not.toMatch(/articleText|copied body/);
    }
  });

  it('returns not found for a slug outside the evidence-ready repository', async () => {
    installAreaArtifact();
    const params = Promise.resolve({ slug: 'unknown-brief' });

    await expect(NewsDetailRoute({ params })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(navigation.notFound).toHaveBeenCalledOnce();
  });

  it('redirects the legacy Korean News route to the Seoul canonical', () => {
    expect(() => LegacyNewsPage()).toThrow('NEXT_REDIRECT:/kr/seoul/news/');
    expect(navigation.redirect).toHaveBeenCalledWith('/kr/seoul/news/');
  });
});
