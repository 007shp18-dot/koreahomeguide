import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import RankingsPage, { metadata } from '../app/(en)/kr/seoul/rankings/page';
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
      languages: {
        en: 'https://www.signedprice.com/kr/seoul/rankings/',
        ko: 'https://www.signedprice.com/ko/kr/seoul/rankings/',
        'x-default': 'https://www.signedprice.com/kr/seoul/rankings/',
      },
    });
  });

  it('server-renders retained rankings and an honest unavailable change section', async () => {
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
    expect(html).toContain('Three-month change not assessable');
    expect(html).toContain('Prior/latest sample counts were not retained in this snapshot.');
    expect(html).toContain('Middle-half spread (P75 − P25)');
    expect(html).toContain('Qualifying reported contracts');
    expect(html.match(/data-ranking-section=/g)).toHaveLength(4);
    expect(html).toContain('href="/kr/seoul/explore/jongno-gu"');
    expect(html).toContain('href="/kr/seoul/explore/jung-gu"');
    expect(html).toContain('₩100,000,000');
    expect(html).not.toContain('-2.0%');
    expect(html).not.toContain('+3.0%');
    expect(html).not.toContain('data-change-centre="true"');
    expect(html).not.toContain('data-change-direction=');
    expect(html).toContain('23 districts excluded');
    expect(html).toContain('aria-current="page"');
    expect(html).toMatch(/aria-current="page"[^>]*href="\/kr\/seoul\/rankings"/);
    expect(html).toContain('href="/news"');
    expect(html).toContain('href="/guides"');
  });

  it('does not reinterpret a positive stored change without retained counts', async () => {
    install(createPublicAreaFixture({
      publishedMedians: { 'jongno-gu': 100_000_000 },
      publishedOverrides: { 'jongno-gu': { chg3m: 1.5 } },
    }));

    const html = renderToStaticMarkup(await RankingsPage());

    expect(html).toContain('Three-month change not assessable');
    expect(html).not.toContain('No eligible district fell in the latest comparison.');
    expect(html).not.toContain('+1.5%');
  });

  it('renders explicit empty sections without numeric rows', () => {
    const model = buildPublicAreaRankingsModel({
      source: createPublicAreaFixture({ publishedMedians: {} }),
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    });

    const html = renderToStaticMarkup(<DistrictRankings model={model} />);

    expect(html.match(/data-ranking-row=/g)).toHaveLength(75);
    expect(html.match(/Not published/g)?.length).toBeGreaterThanOrEqual(75);
    expect(html).not.toContain('data-ranking-distribution=');
  });

  it('presents one ranking measure at a time through an accessible view selector', () => {
    const model = buildPublicAreaRankingsModel({
      source: createPublicAreaFixture(),
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    });

    const html = renderToStaticMarkup(<DistrictRankings model={model} />);

    expect(html).toContain('role="tablist"');
    expect(html.match(/role="tab"/g)).toHaveLength(6);
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html.match(/role="tabpanel"/g)).toHaveLength(6);
    expect(html.match(/ hidden=""/g)).toHaveLength(5);
  });

  it('contains the ranking workspace and uses one consistent rule hierarchy', () => {
    const model = buildPublicAreaRankingsModel({
      source: createPublicAreaFixture(),
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    });
    const html = renderToStaticMarkup(<DistrictRankings model={model} />);
    const css = readFileSync(
      new URL('../components/public-market/district-rankings.module.css', import.meta.url),
      'utf8',
    );

    expect(html).toContain('data-ranking-frame="contained"');
    expect(html).toContain('data-ranking-method="published-context"');
    expect(html).toContain(PUBLIC_AREA_FIXTURE_PERIOD);
    expect(css).toMatch(/\.frame\s*\{[\s\S]*?width:\s*min\(calc\(100% - \(2 \* var\(--page-gutter\)\)\),\s*var\(--content-frame\)\)/);
    expect(css).toMatch(/\.hero\s*\{[\s\S]*?min-height:\s*0/);
    expect(css).toMatch(/\.hero\s*\{[\s\S]*?border-bottom:\s*var\(--rule-strong\)/);
    expect(css).toMatch(/\.row,[\s\S]*?border-bottom:\s*var\(--rule-subtle\)/);
    expect(css).not.toMatch(/outline:\s*3px/);
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
