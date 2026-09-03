import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import BuildingRoute, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from '../app/(en)/kr/seoul/explore/[district]/[buildingId]/page';
import { BuildingDecisionTabs } from '../components/public-market/building-decision-tabs';
import { BuildingDetailHeader } from '../components/public-market/building-detail-header';
import { BuildingDetailPage } from '../components/public-market/building-detail-page';
import { buildBuildingDecisionModel } from '../lib/public-market/building-decision-model';
import type {
  BuildingContractCohort,
  BuildingDecisionMode,
} from '../lib/public-market/building-decision-state';
import { buildBuildingVisualModel } from '../lib/public-market/building-visual-model';
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

function detailProps(
  mode: BuildingDecisionMode = 'rent',
  contract: BuildingContractCohort = 'all',
) {
  const building = model();
  const base = '/kr/seoul/explore/gangnam-gu/gangnam-evidence-tower/';
  return {
    model: building,
    decision: buildBuildingDecisionModel(building, { mode, contract }),
    visual: buildBuildingVisualModel({
      buildingName: building.building.name,
      mapHref: '/kr/seoul/explore/?district=gangnam-gu',
      photo: null,
    }),
    base,
  } as const;
}

describe('public building detail', () => {
  it('renders shared product navigation and URL-backed decision tabs', () => {
    const header = renderToStaticMarkup(<BuildingDetailHeader />);
    expect(header).toContain('aria-label="signedprice home"');
    for (const label of ['Check', 'Explore', 'Rankings', 'Briefs', 'Guide']) {
      expect(header).toContain(`>${label}</strong>`);
    }
    expect(header).toMatch(/<a[^>]*aria-current="page"[^>]*>[\s\S]*?<strong>Explore<\/strong>/);
    expect(header).toMatch(/Singapore|Dubai/);

    const tabs = renderToStaticMarkup(
      <BuildingDecisionTabs
        base="/kr/seoul/explore/gangnam-gu/gangnam-evidence-tower/"
        selection={{ mode: 'rent', contract: 'renewal' }}
      />,
    );
    expect(tabs).toContain('role="tablist"');
    expect(tabs).toContain('aria-selected="true"');
    expect(tabs).toContain('?mode=buy&amp;contract=renewal');
    expect(tabs).toContain('?mode=rent&amp;contract=all');
    expect(tabs).toContain('?mode=rent');
  });

  it('renders only verified building fields, evidence limits, and privacy-safe contracts', () => {
    const html = renderToStaticMarkup(<BuildingDetailPage {...detailProps()} />);

    for (const value of [
      'Evidence Tower', 'Gangnam-gu', 'apartment', '6 reported contracts',
      '₩320,000,000', '45–55㎡', '2026-07', '50㎡', 'MOLIT',
      'New contracts', 'Renewal contracts', 'Unclassified type',
      PUBLIC_BUILDING_FIXTURE_PERIOD, 'Canceled records', 'Private fields',
    ]) {
      expect(html).toContain(value);
    }
    expect(html).not.toContain('aria-label="Breadcrumb"');
    expect(html).toContain('href="/trust/"');
    expect(html).toContain('href="/kr/seoul/corrections/"');
    expect(html).toContain('Community signal');
    expect(html).toContain('Community responses are not open yet');
    expect(html).not.toMatch(/orientation|supply/i);
    expect(html).toContain('href="/kr/seoul/news');
    expect(html).not.toContain('data-detail-main="true"');
    expect(html).not.toContain('data-detail-rail="true"');
    expect(html).toContain('Latest verified News');
    expect(html).toContain('How SignedPrice reads reported rental contracts');
    expect(html).toContain('<th>Floor</th>');
    expect(html).toContain('Floor was not retained in this verified snapshot.');
    expect(html).not.toContain('45-55sqm');
  });

  it('uses an honest evidence fallback and keeps the identity, decision, and evidence hierarchy', () => {
    const html = renderToStaticMarkup(<BuildingDetailPage {...detailProps()} />);
    const identity = html.indexOf('data-building-section="identity"');
    const decision = html.indexOf('data-building-section="decision"');
    const evidence = html.indexOf('data-building-section="evidence"');

    expect(html).toContain('data-building-media="evidence-fallback"');
    expect(html).toContain('data-detail-hero="building"');
    expect(html).toContain('data-detail-hero-metric="identity"');
    expect(html).not.toMatch(/<img[^>]+src="(?:data:|https?:\/\/)/);
    expect(identity).toBeGreaterThan(-1);
    expect(identity).toBeLessThan(decision);
    expect(decision).toBeLessThan(evidence);
  });

  it('renders the six-pair gate basis and the exact single-band empty state', () => {
    const html = renderToStaticMarkup(<BuildingDetailPage {...detailProps()} />);

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

  it('keeps secondary evidence behind native disclosure without losing claims', () => {
    const html = renderToStaticMarkup(<BuildingDetailPage {...detailProps()} />);

    expect(html).toContain('<details');
    expect(html).toContain(
      '<summary>See records, adjustments, and methodology</summary>',
    );
    expect(html).toContain('Floor adjustment evidence');
    expect(html).toContain('Evidence by filed area band');
    expect(html).toContain('Privacy-safe reported contracts');
    expect(html).toContain('Latest verified News');
    expect(html).toContain('Community signal');
    expect(html).toContain('Use this evidence within its boundary');
    expect(html.indexOf('Open full Rent Check')).toBeLessThan(html.indexOf('<details'));
  });

  it('renders the published distribution while withholding an unassessable comparison', () => {
    const html = renderToStaticMarkup(<BuildingDetailPage {...detailProps()} />);

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
    vi.stubEnv('NAVER_MAP_CLIENT_ID', 'detail-naver-client');

    expect(dynamicParams).toBe(true);
    expect(generateStaticParams()).toEqual([
      { district: 'gangnam-gu', buildingId: 'gangnam-evidence-tower' },
    ]);
    const params = Promise.resolve({ district: 'gangnam-gu', buildingId: 'gangnam-evidence-tower' });
    const searchParams = Promise.resolve({});
    const metadata = await generateMetadata({ params, searchParams });
    const html = renderToStaticMarkup(await BuildingRoute({ params, searchParams }));
    expect(metadata).toMatchObject({ robots: { index: false, follow: true } });
    expect(metadata).not.toHaveProperty('alternates');
    expect(html).toContain('Evidence Tower');
    expect(html).toContain('data-building-media="naver-panorama"');
    expect(html).toContain('Nearby street view · not a listing photo · NAVER');
  });

  it('restores valid route state and rejects invalid decision queries', async () => {
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_BUILDING_SUMMARY_ARTIFACT',
      JSON.stringify(createPublicBuildingFixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_BUILDING_FIXTURE_PERIOD);
    const params = Promise.resolve({
      district: 'gangnam-gu', buildingId: 'gangnam-evidence-tower',
    });
    const selected = renderToStaticMarkup(await BuildingRoute({
      params,
      searchParams: Promise.resolve({
        mode: 'rent',
        contract: 'all',
        district: 'gangnam-gu',
        neighborhood: 'yeoksam-dong',
        buildingId: 'gangnam-evidence-tower',
        contractType: 'all',
      }),
    }));
    expect(selected).toContain('data-selected-mode="rent"');
    expect(selected).toContain('6 reported contracts');
    expect(selected).toContain('Street view unavailable');
    expect(selected).toContain('Building evidence remains available');
    expect(selected).not.toContain('data-detail-rail="true"');
    expect(selected).toContain(
      'href="/kr/seoul/explore?district=gangnam-gu&amp;neighborhood=yeoksam-dong&amp;buildingId=gangnam-evidence-tower&amp;contractType=all"',
    );

    const fallback = renderToStaticMarkup(await BuildingRoute({
      params,
      searchParams: Promise.resolve({ mode: 'forecast', contract: 'mixed' }),
    }));
    expect(fallback).toContain('data-selected-mode="overview"');
    expect(fallback).toContain('Viewing Overview · New contract cohort');
  });

  it('generates no route when the artifact is absent', () => {
    expect(generateStaticParams()).toEqual([]);
  });

  it('keeps building actions touch-sized and the layout single-column on mobile', () => {
    const css = readFileSync(
      new URL('../components/public-market/building-detail.module.css', import.meta.url),
      'utf8',
    );
    expect(css).toMatch(/\.main\s*\{[\s\S]*?width:\s*min\(100%,\s*var\(--evidence-workspace-frame\)\)/);
    expect(css).toMatch(/min-height:\s*44px/);
    expect(css).toMatch(/@media \(max-width:\s*720px\)[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(css).toMatch(/max-width:\s*100%/);
    expect(css).toMatch(/\.identityHero[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+380px/);
    expect(css).toMatch(/\.identitySummary h1[\s\S]*font-size:\s*var\(--evidence-type-detail-title\)/);
    expect(css).toMatch(/\.decisionLayout h2[\s\S]*font-size:\s*var\(--evidence-type-subhead\)/);
  });
});
