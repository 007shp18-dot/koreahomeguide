import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { DistrictDetailPage } from '../components/public-market/district-detail-page';
import { buildPublicDistrictModel } from '../lib/public-market/area-route-model.server';
import {
  CITY_MEDIAN_SENTINEL,
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaFixture,
} from './public-area-fixture';
import { createPublicBuildingFixture } from './public-building-fixture';

function publishedModel() {
  const model = buildPublicDistrictModel('gangnam-gu', {
    source: createPublicAreaFixture(),
    period: PUBLIC_AREA_FIXTURE_PERIOD,
  });
  if (model === null || model.status !== 'published') {
    throw new Error('Expected published Gangnam fixture.');
  }
  return model;
}

function withheldModel() {
  const model = buildPublicDistrictModel('gangnam-gu', {
    source: createPublicAreaFixture({
      publishedMedians: { 'jongno-gu': 500_000_000 },
      withheldCounts: { 'gangnam-gu': 4 },
    }),
    period: PUBLIC_AREA_FIXTURE_PERIOD,
  });
  if (model === null || model.status !== 'withheld') {
    throw new Error('Expected withheld Gangnam fixture.');
  }
  return model;
}

describe('public district detail page', () => {
  it('renders one published finding, distribution, local quote, FAQ, and safe JSON-LD', () => {
    const model = publishedModel();
    const html = renderToStaticMarkup(createElement(DistrictDetailPage, { model }));

    expect(html).toContain('data-district-detail="published"');
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('Explore');
    expect(html).toContain(model.identity.nameEn);
    expect(html).toContain(model.identity.nameKo);
    expect(html).toContain(model.display.medianLabel!);
    expect(html).toContain(model.display.sampleLabel);
    expect(html).toContain('data-sample-state="published"');
    for (const label of ['Minimum', '25th percentile', 'Median', '75th percentile', 'Maximum']) {
      expect(html).toContain(label);
    }
    expect(html).toContain('name="quote"');
    expect(html).toContain(`>${model.identity.nameEn} (${model.identity.nameKo})</option>`);
    expect(html).toContain('data-median-comparison="true"');
    expect(html).toContain('What was the median refundable jeonse deposit');
    expect(html).toContain('data-structured-data="dataset"');
    expect(html).toContain('data-structured-data="faq"');
    expect(html).toContain('https://schema.org');
    expect(html).toContain(PUBLIC_AREA_FIXTURE_PERIOD);
    expect(html).toContain('MOLIT');
    expect(html).toContain('href="/kr/seoul/corrections/"');
    expect(html).toContain('KOSTAT census boundaries via southkorea/seoul-maps (Apache-2.0)');
    expect(html).toContain('Korea public evidence. Publication limits shown.');
    expect(html).not.toMatch(/public P2 preview|Production launch is not authorized/i);
    expect(html).toContain('href="/kr/seoul/explore?district=gangnam-gu"');
    expect(html).toContain('href="/kr/seoul/rankings"');
    expect(html).toContain('View district rankings');
    for (const nearby of model.nearby) {
      expect(html).toContain(`href="/kr/seoul/explore/${nearby.slug}"`);
    }
    expect(model.buildingAvailability).toMatchObject({ status: 'not_loaded' });
    expect(html).toContain('Building evidence is not loaded');
    expect(html).toContain('The verified district artifact does not contain building records');
    expect(html).toContain(
      'Use district evidence or return after a verified building snapshot is installed',
    );
    expect(model.communitySignal).toMatchObject({
      state: 'unavailable', code: 'storage_not_configured',
    });
    expect(html).toContain('Community signal');
    expect(html).toContain('Community responses are not open yet');
    expect(html).toContain('data-detail-main="true"');
    expect(html).toContain('data-detail-rail="true"');
    expect(html).toContain('Latest verified News');
    expect(html).toContain('How SignedPrice reads reported rental contracts');
    expect(html).toContain('Back to Seoul map');
    expect(html).not.toMatch(/save this building/i);
  });

  it('renders a money-free refusal with real count, hatch, FAQ, and navigation', () => {
    const model = withheldModel();
    const html = renderToStaticMarkup(createElement(DistrictDetailPage, { model }));

    expect(html).toContain('data-district-detail="withheld"');
    expect(html).toContain('Not published');
    expect(html).toContain('4 reported contracts');
    expect(html).toContain('data-sample-state="withheld"');
    expect(html).toContain('data-evidence-state="withheld"');
    expect(html).toContain('data-structured-data="dataset"');
    expect(html).toContain('data-structured-data="faq"');
    expect(html).toContain('href="/kr/seoul/explore?district=gangnam-gu"');
    expect(html).toContain('href="/kr/seoul/rankings"');
    expect(html).not.toContain('name="quote"');
    expect(html).not.toContain('data-quote-marker');
    expect(html).not.toMatch(/<dt>(?:Minimum|25th percentile|Median|75th percentile|Maximum)<\/dt>/);
    expect(html).not.toContain('₩');
    expect(html).not.toContain(String(CITY_MEDIAN_SENTINEL));
    expect(html).not.toMatch(/"unitCode":"KRW"|"(?:min|p25|med|p75|max|chg3m)":/);
    expect(html).toContain('Building evidence is not loaded');
    expect(html).toContain('Community responses are not open yet');
  });

  it('shows building links only when a verified same-period artifact is installed', () => {
    const model = buildPublicDistrictModel('gangnam-gu', {
      source: createPublicAreaFixture(),
      buildingSource: createPublicBuildingFixture(),
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    });
    if (model === null) throw new Error('Expected district identity.');
    const html = renderToStaticMarkup(<DistrictDetailPage model={model} />);

    expect(model.buildingAvailability).toMatchObject({ status: 'ready' });
    expect(html).toContain('Evidence Tower');
    expect(html).toContain('href="/kr/seoul/explore/gangnam-gu/gangnam-evidence-tower"');
    expect(html).not.toContain('Building evidence is not loaded');
    expect(html).toContain('Community responses are not open yet');
  });

  it('fails closed without city money or structured data when the artifact is unavailable', () => {
    const model = buildPublicDistrictModel('gangnam-gu', {
      source: { invalid: true },
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    });
    if (model === null) throw new Error('Expected unavailable district identity.');
    const html = renderToStaticMarkup(createElement(DistrictDetailPage, { model }));

    expect(html).toContain('data-district-detail="unavailable"');
    expect(html).toContain('Verified district summary unavailable');
    expect(html).toContain('href="/kr/seoul/explore?district=gangnam-gu"');
    expect(html).toContain('href="/kr/seoul/rankings"');
    expect(html).not.toContain('data-structured-data');
    expect(html).not.toContain('₩');
    expect(html).not.toContain(String(CITY_MEDIAN_SENTINEL));
    expect(html).toContain('Building evidence is not loaded');
    expect(model.communitySignal).toMatchObject({
      state: 'unavailable', scope: null, code: 'evidence_unavailable',
    });
    expect(html).toContain('Community responses are not open yet');
  });

  it('escapes less-than characters in model-owned structured data', () => {
    const model = publishedModel();
    const unsafeModel = {
      ...model,
      datasetJsonLd: { ...model.datasetJsonLd, probe: '</script><script>alert(1)</script>' },
    };
    const html = renderToStaticMarkup(createElement(DistrictDetailPage, { model: unsafeModel }));

    expect(html).not.toContain('</script><script>alert(1)</script>');
    expect(html).toContain('\\u003c/script>\\u003cscript>alert(1)\\u003c/script>');
  });

  it('keeps navigation touch-sized, visibly focused, and single-column on mobile', () => {
    const css = readFileSync(
      new URL('../components/public-market/district-detail.module.css', import.meta.url),
      'utf8',
    );

    expect(css).toMatch(/\.exploreLink,[\s\S]*\.nearby a[\s\S]*min-height:\s*44px/);
    expect(css).toMatch(/:focus-visible[\s\S]*outline:\s*2px solid var\(--district-accent\)[\s\S]*outline-offset:\s*2px/);
    expect(css).toMatch(/@media \(max-width:\s*720px\)[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(css).toMatch(/\.detailLayout[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+380px/);
  });
});
