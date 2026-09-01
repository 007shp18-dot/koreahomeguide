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
import { SingaporeProjectDetail } from '../components/singapore/singapore-project-detail';
import { SingaporeSegmentDetail } from '../components/singapore/singapore-segment-detail';
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
import SingaporeExplorePage from '../app/(en)/sg/singapore/explore/page';
import sitemap from '../app/sitemap';
import {
  buildSingaporeExploreModel,
  buildSingaporeProjectModel,
  buildSingaporeSegmentModel,
} from '../lib/singapore/route-model.server';
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

describe('Singapore route SSR', () => {
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

    for (const label of [
      'SGD', 'PSF', 'PSM', 'CCR', 'RCR', 'OCR', 'New sale', 'Subsale', 'Resale',
      'URA', '2026-06..2026-08', 'Private residential sales only',
      '/trust/', '/sg/singapore/corrections/',
    ]) expect(html).toContain(label);
    expect(html).toContain('12 private residential sale transactions');
    expect(html).toContain('Search a Singapore address');
    expect(html).toContain('key=test-google-key');
    expect(html).toContain('href="/sg/singapore/explore/ccr/');
    expect(html).toContain(`href="/sg/singapore/explore/ccr/${projectIdentity.id}"`);
    expect(html).not.toMatch(/KRW|jeonse|HDB|forecast|valuation|asking-price|recommendation/i);
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

    expect(css).toMatch(/\.main\s*\{[\s\S]*?width:\s*min\(calc\(100% - \(2 \* var\(--page-gutter\)\)\),\s*var\(--content-frame\)\)/);
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
});
