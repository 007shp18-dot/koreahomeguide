import { createHash } from 'node:crypto';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { generateMetadata } from '../app/(en)/ae/dubai/check/page';
import sitemap from '../app/sitemap';
import { DubaiCheckWorkspace } from '../components/dubai/dubai-check-workspace';
import { resolveDubaiCheckRouteState } from '../lib/dubai/check-model';
import { createDubaiEvidenceRepository } from '../lib/dubai/evidence-repository.server';
import { buildDubaiCheckModel } from '../lib/dubai/route-model.server';
import type { DubaiAreaEvidenceSnapshot } from '../lib/dubai/evidence-contract';
import {
  dubaiEvidenceFixture,
  withDubaiEvidenceDataDigest,
} from './dubai-evidence-fixture';

async function modelFor(snapshot: DubaiAreaEvidenceSnapshot = dubaiEvidenceFixture()) {
  const source = JSON.stringify(snapshot);
  return buildDubaiCheckModel(await createDubaiEvidenceRepository({
    serialized: source,
    expectedDigest: createHash('sha256').update(source).digest('hex'),
  }));
}

function benchmarkFixture(): DubaiAreaEvidenceSnapshot {
  const fixture = dubaiEvidenceFixture();
  return withDubaiEvidenceDataDigest({
    ...fixture,
    areas: [{
      ...fixture.areas[0]!,
      segments: [{
        ...fixture.areas[0]!.segments[0]!,
        sales: {
          ready: {
            n: 31,
            medianPriceAed: 1_280_000,
            priceP25Aed: 1_050_000,
            priceP75Aed: 1_600_000,
            medianPricePerSqmAed: 18_900,
            pricePerSqmP25Aed: 16_000,
            pricePerSqmP75Aed: 21_000,
          },
          offPlan: {
            n: 30,
            medianPriceAed: 1_100_000,
            priceP25Aed: 900_000,
            priceP75Aed: 1_300_000,
            medianPricePerSqmAed: 17_000,
            pricePerSqmP25Aed: 15_000,
            pricePerSqmP75Aed: 19_000,
          },
        },
        readyGrossYieldPct: 7.03,
      }],
    }],
    totals: { ...fixture.totals, mappedSaleRows: 61, qualifyingSaleRows: 61 },
    sources: {
      ...fixture.sources,
      transactions: { ...fixture.sources.transactions, rows: 61 },
    },
  });
}

function fullQuery(completion: 'ready' | 'off-plan' = 'ready') {
  return resolveDubaiCheckRouteState({
    area: 'marsa-dubai',
    housing: 'apartment',
    completion,
    price: '1500000',
    areaSqm: '70',
    annualRent: '91500',
  });
}

afterEach(() => vi.unstubAllEnvs());

describe('Dubai Check workspace', () => {
  it('starts with instructions and no calculated monetary result', async () => {
    const html = renderToStaticMarkup(<DubaiCheckWorkspace
      model={await modelFor()}
      state={resolveDubaiCheckRouteState({})}
    />);

    expect(html).toContain('Enter a Dubai asking price');
    expect(html).not.toContain('data-dubai-check-result="ready"');
  });

  it('compares a complete Ready scenario without calling it an appraisal', async () => {
    const html = renderToStaticMarkup(<DubaiCheckWorkspace
      model={await modelFor(benchmarkFixture())}
      state={fullQuery()}
    />);

    for (const value of [
      'AED 1,500,000', 'AED 1,280,000', '+17.2%', 'AED 21,429/m²',
      'AED 18,900/m²', '+13.4%', '6.1%', 'Above the released middle range',
    ]) expect(html).toContain(value);
    expect(html).toContain('data-dubai-check-result="ready"');
    expect(html).toContain('not an appraisal, forecast, or recommendation');
    expect(html).not.toMatch(/fair value|undervalued|overvalued/iu);
  });

  it('keeps an Off-Plan user rent assumption separate from published Ready evidence', async () => {
    const html = renderToStaticMarkup(<DubaiCheckWorkspace
      model={await modelFor(benchmarkFixture())}
      state={fullQuery('off-plan')}
    />);

    expect(html).toContain('Off-Plan area comparison');
    expect(html).toContain('Hypothetical gross scenario from your rent input');
    expect(html).not.toContain('Published Ready gross ratio');
  });

  it('does not substitute another area for malformed or unknown input', async () => {
    const model = await modelFor(benchmarkFixture());
    const malformed = renderToStaticMarkup(<DubaiCheckWorkspace
      model={model}
      state={resolveDubaiCheckRouteState({ price: '1e6' })}
    />);
    const unknown = renderToStaticMarkup(<DubaiCheckWorkspace
      model={model}
      state={resolveDubaiCheckRouteState({
        area: 'unknown-area', housing: 'apartment', completion: 'ready',
        price: '1500000', areaSqm: '70', annualRent: '91500',
      })}
    />);

    expect(malformed).toContain('Check the entered fields');
    expect(unknown).toContain('This area and cohort are not published');
    expect(unknown).not.toContain('data-dubai-check-result="ready"');
  });

  it('hands the exact Dubai scenario to the neutral AED calculator', async () => {
    const html = renderToStaticMarkup(<DubaiCheckWorkspace
      model={await modelFor(benchmarkFixture())}
      state={fullQuery()}
    />);

    expect(html).toContain('/tools/property-scenario?market=ae-dubai&amp;currency=AED');
    expect(html).toContain('entity=marsa-dubai');
    expect(html).toContain('property=Marsa+Dubai');
    expect(html).toContain('area=70');
    expect(html).toContain('price=1500000');
    expect(html).toContain('returnTo=%2Fae%2Fdubai%2Fcheck%2F%3Farea%3Dmarsa-dubai');
  });

  it('renders no invented AED evidence when the release is unavailable', () => {
    const html = renderToStaticMarkup(<DubaiCheckWorkspace
      model={{ status: 'unavailable', message: 'Verified Dubai area evidence unavailable' }}
      state={resolveDubaiCheckRouteState({})}
    />);

    expect(html).toContain('Verified Dubai area evidence unavailable');
    expect(html).not.toMatch(/AED[\s ]+[\d,]+/u);
  });
});

describe('Dubai Check route publication', () => {
  it('indexes only the released base route and keeps result queries noindex', async () => {
    const snapshot = benchmarkFixture();
    const source = JSON.stringify(snapshot);
    vi.stubEnv('SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS', 'false');
    vi.stubEnv('SIGNEDPRICE_DUBAI_AREA_EVIDENCE_ARTIFACT', source);
    vi.stubEnv('SIGNEDPRICE_DUBAI_AREA_EVIDENCE_SHA256', createHash('sha256').update(source).digest('hex'));

    expect(await generateMetadata({ searchParams: Promise.resolve({}) }))
      .toMatchObject({ robots: { index: true, follow: true } });
    expect(await generateMetadata({ searchParams: Promise.resolve({ area: 'marsa-dubai' }) }))
      .toMatchObject({ robots: { index: false, follow: true } });
    expect(sitemap().map(({ url }) => url)).toContain(
      'https://www.signedprice.com/ae/dubai/check/',
    );
  });
});
