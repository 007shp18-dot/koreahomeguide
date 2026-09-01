import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import BuildingRoute, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from '../app/kr/seoul/explore/[district]/[buildingId]/page';
import { BuildingDetailPage } from '../components/public-market/building-detail-page';
import { buildPublicBuildingModel } from '../lib/public-market/building-route-model.server';
import {
  PUBLIC_BUILDING_FIXTURE_PERIOD,
  createPublicBuildingFixture,
} from './public-building-fixture';

afterEach(() => vi.unstubAllEnvs());

function model() {
  const result = buildPublicBuildingModel('gangnam-gu', 'gangnam-evidence-tower', {
    source: createPublicBuildingFixture(), period: PUBLIC_BUILDING_FIXTURE_PERIOD,
  });
  if (result === null) throw new Error('Expected ready building model.');
  return result;
}

describe('public building detail', () => {
  it('renders only verified building fields, evidence limits, and privacy-safe contracts', () => {
    const html = renderToStaticMarkup(<BuildingDetailPage model={model()} />);

    for (const value of [
      'Evidence Tower', 'Gangnam-gu', 'apartment', '6 reported contracts',
      '₩320,000,000', '45-55sqm', '2026-07', '50㎡', 'MOLIT',
      'New contracts', 'Renewal contracts', 'Unclassified type',
      PUBLIC_BUILDING_FIXTURE_PERIOD, 'Canceled records', 'Private fields',
    ]) {
      expect(html).toContain(value);
    }
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('href="/trust/"');
    expect(html).toContain('href="/kr/seoul/corrections/"');
    expect(html).toContain('Community signal');
    expect(html).toContain('Community responses are not open yet');
    expect(html).not.toMatch(/orientation|supply/i);
    expect(html).toContain('href="/kr/seoul/news');
    expect(html).toContain('data-detail-main="true"');
    expect(html).toContain('data-detail-rail="true"');
    expect(html).toContain('Latest verified News');
    expect(html).toContain('How SignedPrice reads reported rental contracts');
  });

  it('generates only ready params and keeps the route noindex', async () => {
    vi.stubEnv('SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT', JSON.stringify(createPublicBuildingFixture()));
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_BUILDING_FIXTURE_PERIOD);

    expect(dynamicParams).toBe(false);
    expect(generateStaticParams()).toEqual([
      { district: 'gangnam-gu', buildingId: 'gangnam-evidence-tower' },
    ]);
    const params = Promise.resolve({ district: 'gangnam-gu', buildingId: 'gangnam-evidence-tower' });
    const metadata = await generateMetadata({ params });
    const html = renderToStaticMarkup(await BuildingRoute({ params }));
    expect(metadata).toMatchObject({ robots: { index: false, follow: true } });
    expect(metadata).not.toHaveProperty('alternates');
    expect(html).toContain('Evidence Tower');
  });

  it('generates no route when the artifact is absent', () => {
    expect(generateStaticParams()).toEqual([]);
  });

  it('keeps building actions touch-sized and the layout single-column on mobile', () => {
    const css = readFileSync(
      new URL('../components/public-market/building-detail.module.css', import.meta.url),
      'utf8',
    );
    expect(css).toMatch(/min-height:\s*44px/);
    expect(css).toMatch(/@media \(max-width:\s*720px\)[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(css).toMatch(/max-width:\s*100%/);
    expect(css).toMatch(/\.detailLayout[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+380px/);
  });
});
