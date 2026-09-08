import { createHash } from 'node:crypto';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND'); }),
}));

import DubaiAreaPage, {
  generateMetadata,
  generateStaticParams,
} from '../app/(en)/ae/dubai/explore/[area]/page';
import sitemap from '../app/sitemap';
import { DubaiAreaDetail } from '../components/dubai/dubai-area-detail';
import { createDubaiEvidenceRepository } from '../lib/dubai/evidence-repository.server';
import { buildDubaiAreaModel } from '../lib/dubai/route-model.server';
import {
  dubaiComparableEvidenceFixture,
  dubaiEvidenceFixture,
} from './dubai-evidence-fixture';

function installedFixture() {
  const value = dubaiEvidenceFixture();
  const source = JSON.stringify(value);
  const digest = createHash('sha256').update(source).digest('hex');
  vi.stubEnv('SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS', 'false');
  vi.stubEnv('SIGNEDPRICE_DUBAI_AREA_EVIDENCE_ARTIFACT', source);
  vi.stubEnv('SIGNEDPRICE_DUBAI_AREA_EVIDENCE_SHA256', digest);
  return { source, digest };
}

afterEach(() => vi.unstubAllEnvs());

describe('Dubai area evidence routes', () => {
  it('enumerates and indexes only released area evidence', async () => {
    installedFixture();

    expect(await generateStaticParams()).toEqual([{ area: 'marsa-dubai' }]);
    expect(await generateMetadata({ params: Promise.resolve({ area: 'marsa-dubai' }) }))
      .toMatchObject({
        title: 'Marsa Dubai apartment sale prices and rent evidence 2026 | signedprice',
        robots: { index: true, follow: true },
        alternates: { canonical: 'https://www.signedprice.com/ae/dubai/explore/marsa-dubai/' },
      });
    expect(sitemap().map(({ url }) => url)).toContain(
      'https://www.signedprice.com/ae/dubai/explore/marsa-dubai/',
    );
  });

  it('renders distinct stage, rent, sample, period, and comparable language', async () => {
    const value = dubaiComparableEvidenceFixture();
    const { source, digest } = (() => {
      const source = JSON.stringify(value);
      return { source, digest: createHash('sha256').update(source).digest('hex') };
    })();
    const repository = await createDubaiEvidenceRepository({ serialized: source, expectedDigest: digest });
    const model = buildDubaiAreaModel(repository, 'marsa-dubai');
    if (model === null) throw new Error('missing area model');
    const html = renderToStaticMarkup(<DubaiAreaDetail model={model} />);

    for (const id of ['detail-overview', 'detail-evidence', 'detail-source']) expect(html).toContain(`id="${id}"`);
    const overview = html.slice(html.indexOf('id="detail-overview"'), html.indexOf('id="detail-evidence"'));
    expect(overview).toContain('2026-06-08–2026-09-05');
    expect(overview).toContain('31 registered sales');
    expect(overview).toContain('Off-Plan');

    for (const label of [
      'Ready vs Off-Plan', 'Median annual rent', 'Estimated gross rent-to-price ratio',
      '31 registered sales', '30 new rent contracts', '2026-06-08–2026-09-05',
      'Comparable areas', 'Check this asking price', 'Source: Dubai Land Department',
    ]) expect(html).toContain(label);
    expect(html).toContain('data-comparable-stage="ready"');
    expect(html).toContain('data-comparable-stage="off-plan"');
    expect(html).toContain('Apartment · Ready');
    expect(html).toContain('Apartment · Off-Plan');
    for (const segment of model.segments) {
      for (const [stage, areas] of [['ready', segment.comparableAreas.ready], ['off-plan', segment.comparableAreas.offPlan]] as const) {
        for (const area of areas) expect(html.replaceAll('/?', '?')).toContain(`${area.href.replace(/\/$/u, '')}?housing=${segment.housing}&amp;stage=${stage}`);
      }
    }
    expect(html).not.toMatch(/nearby|individual building|available listing/iu);
  });

  it('fails closed for an unknown area', async () => {
    installedFixture();
    await expect(DubaiAreaPage({
      params: Promise.resolve({ area: 'unknown-area' }),
    })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(await generateMetadata({ params: Promise.resolve({ area: 'unknown-area' }) }))
      .toMatchObject({ robots: { index: false, follow: true } });
  });

  it('keeps stale display evidence out of routes and sitemap', async () => {
    const stale = {
      ...dubaiEvidenceFixture(),
      publication: { displayState: 'stale' as const, indexState: 'noindex' as const },
    };
    const source = JSON.stringify(stale);
    vi.stubEnv('SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS', 'false');
    vi.stubEnv('SIGNEDPRICE_DUBAI_AREA_EVIDENCE_ARTIFACT', source);
    vi.stubEnv('SIGNEDPRICE_DUBAI_AREA_EVIDENCE_SHA256', createHash('sha256').update(source).digest('hex'));

    expect(await generateStaticParams()).toEqual([]);
    expect(sitemap().map(({ url }) => url)).not.toContain(
      'https://www.signedprice.com/ae/dubai/explore/marsa-dubai/',
    );
  });
});
