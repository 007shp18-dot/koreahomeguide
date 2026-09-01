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

const REFERENCE_INSTANT = '2026-09-01T00:00:00.000Z';

afterEach(() => vi.unstubAllEnvs());

function model() {
  const result = buildPublicBuildingModel('gangnam-gu', 'gangnam-evidence-tower', {
    source: createPublicBuildingFixture(), period: PUBLIC_BUILDING_FIXTURE_PERIOD,
    referenceInstant: REFERENCE_INSTANT,
  });
  if (result === null) throw new Error('Expected ready building model.');
  return result;
}

describe('public building detail', () => {
  it('renders only verified building fields, evidence limits, and privacy-safe contracts', () => {
    const html = renderToStaticMarkup(<BuildingDetailPage model={model()} />);

    for (const value of [
      'Evidence Tower', 'Gangnam-gu', 'apartment', '6 reported contracts',
      '₩320,000,000', '45–55㎡', '2026-07', '50㎡', 'MOLIT',
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
    expect(html).toContain('<th>Floor</th>');
    expect(html).toContain('Floor was not retained in this verified snapshot.');
    expect(html).not.toContain('45-55sqm');
  });

  it('renders the six-pair gate basis and the exact single-band empty state', () => {
    const html = renderToStaticMarkup(<BuildingDetailPage model={model()} />);

    expect(html).toContain('data-floor-coefficient="unavailable"');
    expect(html).toContain('Contract evidence insufficient');
    expect(html).toContain('0 eligible pairs');
    expect(html).toContain(
      'Compared filed contracts in the same building and exact floor area where floor was the differing retained field. Coefficients stay blank when fewer than six eligible pairs remain.',
    );
    expect(html).toContain('data-area-band-state="single-fixed-band"');
    expect(html).toContain('Other floor-area bands are not available yet.');
    expect(html).toContain('Published contract evidence is currently fixed to the 45–55㎡ floor-area band.');
    expect(html).toContain('Additional bands will open after the collection scope expands.');
  });

  it('renders the published distribution while withholding an unassessable comparison', () => {
    const html = renderToStaticMarkup(<BuildingDetailPage model={model()} />);

    expect(html).toContain('Declared-period contract evidence');
    expect(html).toContain('data-building-distribution="true"');
    expect(html).toContain('data-plot-variant="full"');
    for (const key of ['min', 'p25', 'median', 'p75', 'max']) {
      expect(html).toContain(`data-plot-label="${key}"`);
    }
    expect(html).toContain('3-month change not assessable');
    expect(html).toContain('Prior/latest sample counts were not retained in this snapshot.');
    expect(html).not.toContain('+1.2%');
    expect(html).not.toMatch(/completed[- ]period/i);
    expect(html.match(/data-month-state="complete"/g)).toHaveLength(6);
    expect(html.match(/data-month-state="filing_in_progress"/g)).toHaveLength(1);
    expect(html).toContain('Complete');
    expect(html).toContain('Filing in progress');
    expect(html).toContain('aggregate period distribution includes filing-in-progress months');
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
