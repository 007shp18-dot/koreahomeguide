import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import RankingsPage, { metadata } from '../app/kr/seoul/rankings/page';
import { DistrictRankings } from '../components/public-market/district-rankings';
import { buildPublicAreaRankingsModel } from '../lib/public-market/rankings-route-model.server';
import {
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaFixture,
} from './public-area-fixture';

afterEach(() => vi.unstubAllEnvs());

function install(source: unknown) {
  vi.stubEnv('SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT', JSON.stringify(source));
  vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);
}

describe('Seoul district rankings page', () => {
  it('keeps the route in the indexable Explore SEO cohort', () => {
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates).toEqual({
      canonical: 'https://www.signedprice.com/kr/seoul/rankings/',
    });
  });

  it('server-renders all four complete lists, definitions, and linked values', async () => {
    install(createPublicAreaFixture({
      publishedMedians: {
        'jongno-gu': 200_000_000,
        'jung-gu': 100_000_000,
      },
      publishedOverrides: {
        'jongno-gu': { n: 6, chg3m: -2 },
        'jung-gu': { n: 8, chg3m: 3 },
      },
    }));

    const html = renderToStaticMarkup(await RankingsPage());

    expect(html).toContain('Seoul district rankings');
    expect(html).toContain('Median refundable jeonse deposit');
    expect(html).toContain('Median change: latest 3 months vs prior 3 months');
    expect(html).toContain('Middle-half spread (P75 − P25)');
    expect(html).toContain('Qualifying reported contracts');
    expect(html.match(/data-ranking-section=/g)).toHaveLength(4);
    expect(html).toContain('href="/kr/seoul/explore/jongno-gu"');
    expect(html).toContain('href="/kr/seoul/explore/jung-gu"');
    expect(html).toContain('₩100,000,000');
    expect(html).toContain('-2.0%');
    expect(html).toContain('+3.0%');
    expect(html).toContain('data-change-centre="true"');
    expect(html).toContain('data-change-direction="negative"');
    expect(html).toContain('data-change-direction="positive"');
    expect(html).toContain('23 districts excluded');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('data-public-tab="explore"');
    expect(html).not.toContain('href="/kr/seoul/news/"');
    expect(html).not.toContain('href="/kr/seoul/guide/"');
  });

  it('states when no eligible district fell without hiding positive rows', async () => {
    install(createPublicAreaFixture({
      publishedMedians: { 'jongno-gu': 100_000_000 },
      publishedOverrides: { 'jongno-gu': { chg3m: 1.5 } },
    }));

    const html = renderToStaticMarkup(await RankingsPage());

    expect(html).toContain('No eligible district fell in the latest comparison.');
    expect(html).toContain('+1.5%');
  });

  it('renders explicit empty sections without numeric rows', () => {
    const model = buildPublicAreaRankingsModel({
      source: createPublicAreaFixture({ publishedMedians: {} }),
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    });

    const html = renderToStaticMarkup(<DistrictRankings model={model} />);

    expect(html.match(/No eligible districts for this metric\./g)).toHaveLength(4);
    expect(html).not.toContain('data-ranking-row=');
    expect(html).not.toMatch(/₩[0-9]|[+-][0-9]+\.[0-9]%/);
  });

  it('fails closed without rendering district money', async () => {
    install({ invalid: true });

    const html = renderToStaticMarkup(await RankingsPage());

    expect(html).toContain('Verified district summary unavailable');
    expect(html).toContain('No district money is substituted.');
    expect(html).not.toContain('data-ranking-row=');
    expect(html).not.toMatch(/₩[0-9]/);
  });
});
