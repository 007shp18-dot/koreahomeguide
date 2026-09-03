import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/script', () => ({
  default: ({ src }: Readonly<{ src: string }>) => <script async src={src} />,
}));

import {
  buildSingaporeSnapshot,
  parseUraPrivateSaleEnvelope,
  stringifySingaporeSnapshot,
} from '@signedprice/singapore-property';
import { SingaporeExplorer } from '../components/singapore/singapore-explorer';
import { SingaporeCheckWorkspace } from '../components/singapore/singapore-check-workspace';
import { SingaporeProjectDetail } from '../components/singapore/singapore-project-detail';
import { SingaporeSegmentDetail } from '../components/singapore/singapore-segment-detail';
import { SingaporePage } from '../components/singapore/singapore-shell';
import { metadata as entryMetadata } from '../app/(en)/sg/page';
import { metadata as exploreMetadata } from '../app/(en)/sg/singapore/explore/page';
import {
  generateStaticParams as segmentStaticParams,
  metadata as segmentMetadata,
} from '../app/(en)/sg/singapore/explore/[area]/page';
import {
  generateStaticParams as projectStaticParams,
  metadata as projectMetadata,
} from '../app/(en)/sg/singapore/explore/[area]/[projectId]/page';
import { metadata as correctionMetadata } from '../app/(en)/sg/singapore/corrections/page';
import { metadata as checkMetadata } from '../app/(en)/sg/singapore/check/page';
import SingaporeExplorePage from '../app/(en)/sg/singapore/explore/page';
import sitemap from '../app/sitemap';
import {
  buildSingaporeExploreModel,
  buildSingaporeProjectModel,
  buildSingaporeSegmentModel,
} from '../lib/singapore/route-model.server';
import { buildSingaporeCheckRouteModel } from '../lib/singapore/check-route-model.server';
import { createSingaporeCheckEvidenceRepositories } from '../lib/singapore/check-evidence-repository.server';
import { createSingaporeSnapshotRepository } from '../lib/singapore/snapshot-repository.server';

const fixture = JSON.parse(readFileSync(
  new URL('../../../packages/singapore-property/test/fixtures/ura-transaction-envelope.synthetic.json', import.meta.url),
  'utf8',
)) as unknown;
const rights = { operations: { aggregate: 'allowed', display: 'allowed' } } as const;

function snapshot() {
  return buildSingaporeSnapshot({
    records: [1, 2, 3, 4].flatMap((batch) => parseUraPrivateSaleEnvelope(fixture, batch)),
    generatedAt: '2026-08-31T09:00:00.000Z',
    rights,
  });
}

async function repository() {
  const source = snapshot();
  return createSingaporeSnapshotRepository({
    serialized: stringifySingaporeSnapshot(source),
    expectedDigest: source.digest,
    expectedPeriod: '2026-06..2026-08',
    rights,
  });
}

const repositoriesForCheck = () => createSingaporeCheckEvidenceRepositories({});

describe('Singapore route SSR', () => {
  it('keeps A and B market choices independent while switching tabs', async () => {
    const html = renderToStaticMarkup(<SingaporeCheckWorkspace model={buildSingaporeCheckRouteModel(
      await repositoriesForCheck(),
      { mode: 'compare', 'a-market': 'hdb-resale', 'b-market': 'hdb-rent' },
    )} />);

    expect(html).toContain('mode=compare&amp;a-market=hdb-resale&amp;b-market=hdb-rent');
    expect(html).toContain('aria-label="Offer A market"');
    expect(html).toContain('aria-label="Offer B market"');
  });

  it('uses Singapore context with global product navigation and never falls through to Seoul Check', () => {
    const html = renderToStaticMarkup(<SingaporePage><p>Singapore content</p></SingaporePage>);

    expect(html).toContain('aria-label="Singapore evidence navigation"');
    expect(html).toContain('href="/sg/singapore/explore/"');
    expect(html).not.toContain('href="/kr/seoul/check/"');
    expect(html).toContain('href="/prices">Prices</a>');
    expect(html).toContain('Singapore · reported filings');
  });

  it('maps the Singapore evidence route to the global Prices destination', () => {
    const html = renderToStaticMarkup(<SingaporePage currentHref="/sg/singapore/explore/"><p>Explore</p></SingaporePage>);
    expect(html).toMatch(/aria-current="page" href="\/prices"/);
    expect(html).not.toMatch(/site-header__product-link" aria-current="page" href="\/sg/);
    expect(html).not.toMatch(/href="\/kr\/seoul\/[^"]*" aria-current="page"/);
  });

  it('renders Explore and ready segment/project evidence in initial HTML', async () => {
    const store = await repository();
    const explore = renderToStaticMarkup(<SingaporeExplorer
      model={buildSingaporeExploreModel(store)}
      googleMapsBrowserKey="test-google-key"
    />);
    const segmentModel = buildSingaporeSegmentModel(store, 'ccr');
    if (segmentModel === null) throw new Error('missing segment');
    const segment = renderToStaticMarkup(<SingaporeSegmentDetail model={segmentModel} />);
    const projectIdentity = store.listProjects('CCR')[0]!;
    const projectModel = buildSingaporeProjectModel(store, 'ccr', projectIdentity.id);
    if (projectModel === null) throw new Error('missing project');
    const project = renderToStaticMarkup(<SingaporeProjectDetail model={projectModel} />);
    const html = `${explore}${segment}${project}`;

    expect(explore).toContain('data-singapore-explore-workspace="true"');
    expect(explore).toContain('data-singapore-evidence="ready"');
    expect(explore).toContain('data-market-explore-shell="true"');
    expect(explore).toContain('aria-label="Singapore market layers"');
    expect(explore).toContain('URA private sales');
    expect(explore).toContain('HDB resale');
    expect(explore).toContain('HDB rent');
    expect(explore).not.toContain('Compare private-sale evidence across CCR, RCR, and OCR.');

    for (const label of [
      'SGD', 'PSF', 'PSM', 'CCR', 'RCR', 'OCR', 'New sale', 'Subsale', 'Resale',
      'URA', '2026-06..2026-08', 'Private residential sales only',
      '/trust/', '/sg/singapore/corrections/',
    ]) expect(html).toContain(label);
    expect(html).toContain('12 private residential sale transactions');
    expect(segment).toContain('data-market-detail-shell="true"');
    expect(project).toContain('data-market-detail-shell="true"');
    expect(html).toContain('Search a Singapore address');
    expect(html).toContain('key=test-google-key');
    expect(html).toContain('href="/sg/singapore/explore/ccr/');
    expect(html).toContain('Open CCR evidence');
    expect(html).toContain(`href="/sg/singapore/explore/ccr/${projectIdentity.id}"`);
    expect(html).toContain('data-hdb-evidence="unavailable"');
    expect(html).not.toMatch(/KRW|jeonse|forecast|valuation|asking-price|recommendation/i);
    expect(html).not.toMatch(/use client/);
  });

  it('passes the server-only Google key into the Singapore Explore map', async () => {
    const source = snapshot();
    vi.stubEnv('SIGNEDPRICE_SINGAPORE_SNAPSHOT_ARTIFACT', stringifySingaporeSnapshot(source));
    vi.stubEnv('SIGNEDPRICE_SINGAPORE_SNAPSHOT_SHA256', source.digest);
    vi.stubEnv('SIGNEDPRICE_SINGAPORE_SNAPSHOT_PERIOD', '2026-06..2026-08');
    vi.stubEnv('GOOGLE_MAPS_API_KEY', 'page-google-key');

    const html = renderToStaticMarkup(await SingaporeExplorePage());

    expect(html).toContain('data-map-provider="google"');
    expect(html).toContain('key=page-google-key');
    vi.unstubAllEnvs();
  });

  it('renders explicit insufficient and unavailable states without monetary claims', async () => {
    const store = await repository();
    const insufficient = buildSingaporeSegmentModel(store, 'ocr');
    if (insufficient === null) throw new Error('missing segment');
    const insufficientHtml = renderToStaticMarkup(<SingaporeSegmentDetail model={insufficient} />);
    const unavailableHtml = renderToStaticMarkup(<SingaporeExplorer model={{
      status: 'unavailable',
      message: 'Verified Singapore evidence unavailable',
      correctionHref: '/sg/singapore/corrections/',
    }} />);

    expect(insufficientHtml).toContain('4 reported transactions');
    expect(insufficientHtml).toContain('At least 5 are required');
    expect(insufficientHtml).not.toMatch(/SGD [\d,]+/);
    expect(unavailableHtml).toContain('Verified Singapore evidence unavailable');
    expect(unavailableHtml).not.toMatch(/SGD [\d,]+|PSF|PSM/);
  });
});

describe('Singapore route containment', () => {
  it('uses the standard content frame instead of viewport width', () => {
    const css = readFileSync(
      new URL('../components/singapore/singapore.module.css', import.meta.url),
      'utf8',
    );

    expect(css).toMatch(/\.main\s*\{[\s\S]*?width:\s*min\(calc\(100% - \(2 \* var\(--evidence-page-gutter\)\)\),\s*var\(--evidence-workspace-frame\)\)/);
    expect(css).toMatch(/\.mainUnframed\s*\{[^}]*width:\s*100%/);
  });

  it('generates three native areas and only published project params', async () => {
    expect(segmentStaticParams()).toEqual([{ area: 'ccr' }, { area: 'rcr' }, { area: 'ocr' }]);
    expect(await projectStaticParams()).toEqual([]);
  });

  it.each([
    entryMetadata,
    exploreMetadata,
    segmentMetadata,
    projectMetadata,
    correctionMetadata,
  ])('keeps every Singapore route noindex without alternates', (metadata) => {
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata).not.toHaveProperty('alternates');
  });

  it('keeps Singapore out of the sitemap', () => {
    expect(sitemap().map(({ url }) => url).join('\n')).not.toMatch(/\/sg\//);
  });

  it('keeps native Singapore Check noindex and self-canonical until evidence release', () => {
    expect(checkMetadata.robots).toEqual({ index: false, follow: false });
    expect(checkMetadata.alternates).toEqual({ canonical: 'https://www.signedprice.com/sg/singapore/check/' });
  });
});
