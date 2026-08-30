import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import KoreaHomePage from '../app/kr/page';
import KoreaAreaPage from '../app/kr/[area]/page';
import KoreaCheckPage from '../app/kr/check/[area]/page';
import {
  PUBLIC_SUMMARY_ARTIFACT_VERSION,
  buildKoreaPublicRouteModel,
} from '../lib/public-market/route-model.server';

const period = '2026-01/2026-07';

function publishedSummary() {
  return {
    marketId: 'kr-seoul', area: 'seoul', parent: 'kr', deal: 'jeonse',
    band: '45-55sqm', period, n: 20, published: true,
    min: 180_000_000, p25: 280_000_000, med: 380_000_000,
    p75: 480_000_000, max: 580_000_000, chg3m: null,
  } as const;
}

function artifact(summary: Record<string, unknown> = publishedSummary()) {
  return {
    artifactVersion: PUBLIC_SUMMARY_ARTIFACT_VERSION,
    generatedAt: '2026-08-30T00:00:00.000Z',
    provenance: {
      marketId: 'kr-seoul', period, provider: 'MOLIT', endpointVersion: 'v1',
      parserVersion: 'kr-molit-rent-parser-v2', rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true,
    },
    summaries: [summary],
  };
}

function useArtifact(value = artifact()) {
  vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT', JSON.stringify(value));
  vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', period);
}

afterEach(() => vi.unstubAllEnvs());

describe('Korea public route model', () => {
  it('accepts only the ready Seoul area and exact verified feed', () => {
    expect(buildKoreaPublicRouteModel('seoul', {
      source: artifact(),
      period,
    })?.summary).toEqual(publishedSummary());
    expect(buildKoreaPublicRouteModel('unknown', {
      source: artifact(),
      period,
    })).toBeNull();
  });

  it('fails closed when the feed is missing', () => {
    expect(() => buildKoreaPublicRouteModel('seoul', {
      source: undefined,
      period,
    })).toThrow('Verified public market summary is unavailable.');
  });
});

describe('Korea public SSR routes', () => {
  it.each([
    ['home', async () => KoreaHomePage()],
    ['check', async () => KoreaCheckPage({ params: Promise.resolve({ area: 'seoul' }) })],
    ['area', async () => KoreaAreaPage({ params: Promise.resolve({ area: 'seoul' }) })],
  ])('puts every published number and sample count in initial %s HTML', async (name, render) => {
    useArtifact();
    const html = renderToStaticMarkup(await render());

    for (const value of ['₩180,000,000', '₩280,000,000', '₩380,000,000', '₩480,000,000', '₩580,000,000']) {
      expect(html).toContain(value);
    }
    expect(html).toContain('20 reported contracts');
    expect(html).toContain('2026-01/2026-07');
    expect(html).toContain('MOLIT reported rental contracts');
    expect(html).toContain('Seven completed months · 45–55㎡ · zero-rent jeonse');
    expect(html).toContain('refundable deposit');
    if (name === 'area') expect(html).toContain('Reported refundable-deposit distribution.');
    expect(html).not.toMatch(/monthly-rent distribution|5\.0%\/year/i);
    expect(html).not.toMatch(/statutory|legal rate/i);
    expect(html).not.toContain('/kr/seoul/tools/rent-check');
  });

  it('renders the two-input quote on home and check but a static graph on area detail', async () => {
    useArtifact();
    const home = renderToStaticMarkup(await KoreaHomePage());
    const check = renderToStaticMarkup(await KoreaCheckPage({
      params: Promise.resolve({ area: 'seoul' }),
    }));
    const area = renderToStaticMarkup(await KoreaAreaPage({
      params: Promise.resolve({ area: 'seoul' }),
    }));

    expect((home.match(/<(?:input|select)\b/g) ?? [])).toHaveLength(2);
    expect((check.match(/<(?:input|select)\b/g) ?? [])).toHaveLength(2);
    expect(area).not.toMatch(/<(?:input|select)\b/);
    expect(area).toContain('data-evidence-state="published"');
  });

  it('withholds sparse evidence recursively without monetary or marker leakage', async () => {
    useArtifact(artifact({
      marketId: 'kr-seoul', area: 'seoul', parent: 'kr', deal: 'jeonse',
      band: '45-55sqm', period, n: 4, published: false,
    }));
    const html = renderToStaticMarkup(await KoreaCheckPage({
      params: Promise.resolve({ area: 'seoul' }),
    }));

    expect(html).toContain('4 reported contracts');
    expect(html).toContain('At least 5 are required');
    expect(html).toContain('Market position withheld');
    expect(html).not.toContain('₩');
    expect(html).not.toMatch(/Minimum|percentile|Median|Maximum/);
    expect(html).not.toContain('data-quote-marker');
    expect(html).not.toMatch(/"(?:min|p25|med|p75|max|chg3m)"/);
  });

  it('returns the Next 404 boundary for an unknown area or missing feed', async () => {
    useArtifact();
    await expect(KoreaAreaPage({
      params: Promise.resolve({ area: 'unknown' }),
    })).rejects.toThrow(/404/);

    vi.unstubAllEnvs();
    await expect(KoreaCheckPage({
      params: Promise.resolve({ area: 'seoul' }),
    })).rejects.toThrow(/404/);
  });

  it('keeps market-specific names out of the shared public template', async () => {
    const source = await import('node:fs').then(({ readFileSync }) => readFileSync(
      new URL('../components/public-market/public-market-page.tsx', import.meta.url),
      'utf8',
    ));
    expect(source).not.toMatch(/Korea|Seoul|KRW|MOLIT|jeonse|District/i);
  });
});
